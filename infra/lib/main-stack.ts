import * as cdk from "aws-cdk-lib";
import {
  aws_apigateway as apigw,
  aws_lambda as lambda,
  aws_dynamodb as dynamodb,
  aws_cognito as cognito,
  aws_s3 as s3,
  aws_iam as iam,
  aws_kms as kms,
  aws_stepfunctions as sfn,
  aws_logs as logs,
} from "aws-cdk-lib";

export class SettlementPlatformStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tableName = "settlement-transactions";
    const assetTableName = "tokenized-assets";

    // ========== DynamoDB Tables ==========
    const transactionTable = new dynamodb.Table(this, "TransactionTable", {
      tableName: tableName,
      partitionKey: { name: "transactionId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const assetTable = new dynamodb.Table(this, "AssetTable", {
      tableName: assetTableName,
      partitionKey: { name: "assetId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========== KMS Key ==========
    const kmsKey = new kms.Key(this, "SettlementKey", {
      description: "KMS key for securing settlement data",
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========== S3 Bucket for Logs & Evidence ==========
    const logBucket = new s3.Bucket(this, "SettlementLogsBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========== Cognito User Pool ==========
    const userPool = new cognito.UserPool(this, "SettlementUserPool", {
      selfSignUpEnabled: false,
      userVerification: {
        emailSubject: "Settlement Platform verification code",
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
    });

    const userPoolClient = userPool.addClient("SettlementClient", {
      authFlows: {
        userPassword: true,
        adminUserPassword: true,
      },
    });

    // ========== Lambda Execution Role ==========
    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
      ],
    });

    // Grant permissions to DynamoDB tables
    transactionTable.grantReadWriteData(lambdaRole);
    assetTable.grantReadWriteData(lambdaRole);

    // Grant permissions to KMS key
    kmsKey.grantEncryptDecrypt(lambdaRole);

    // ========== Lambda Functions ==========
    
    // Settlement Orchestrator: Multi-step settlement workflow
    const orchFunction = new lambda.Function(this, "SettlementOrchestratorFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "settlement-orchestrator.handler",
      role: lambdaRole,
      code: lambda.Code.fromAsset("../backend/dist"),
      environment: {
        TRANSACTION_TABLE: transactionTable.tableName,
        ASSET_TABLE: assetTable.tableName,
        AWS_REGION: this.region,
      },
      timeout: cdk.Duration.seconds(120),
      memorySize: 512,
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });

    // Compliance Checker: Validate KYC, allowlist, daily limits
    const complianceFunction = new lambda.Function(this, "ComplianceCheckerFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "compliance-checker.handler",
      role: lambdaRole,
      code: lambda.Code.fromAsset("../backend/dist"),
      environment: {
        TRANSACTION_TABLE: transactionTable.tableName,
        ASSET_TABLE: assetTable.tableName,
        AWS_REGION: this.region,
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });

    // ========== API Gateway ==========
    const api = new apigw.RestApi(this, "SettlementAPI", {
      description: "Settlement Platform API",
      deploy: true,
      deployOptions: {
        stageName: "prod",
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });

    // Cognito authorizer
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
      }
    );

    // API resource: /settlement
    const settlementResource = api.root.addResource("settlement");
    settlementResource.addMethod("POST", new apigw.LambdaIntegration(orchFunction), {
      authorizer: authorizer,
      methodResponses: [
        { statusCode: "200" },
        { statusCode: "400" },
        { statusCode: "403" },
        { statusCode: "500" },
      ],
    });

    // API resource: /compliance
    const complianceResource = api.root.addResource("compliance");
    complianceResource.addMethod("POST", new apigw.LambdaIntegration(complianceFunction), {
      authorizer: authorizer,
      methodResponses: [
        { statusCode: "200" },
        { statusCode: "400" },
        { statusCode: "403" },
        { statusCode: "500" },
      ],
    });

    // ========== Stack Outputs ==========
    new cdk.CfnOutput(this, "TransactionTableName", {
      value: transactionTable.tableName,
      description: "DynamoDB table for settlement transactions",
    });

    new cdk.CfnOutput(this, "AssetTableName", {
      value: assetTable.tableName,
      description: "DynamoDB table for tokenized assets",
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });

    new cdk.CfnOutput(this, "LogBucketName", {
      value: logBucket.bucketName,
      description: "S3 bucket for settlement logs and evidence",
    });

    new cdk.CfnOutput(this, "KMSKeyArn", {
      value: kmsKey.keyArn,
      description: "KMS key ARN for encryption",
    });

    new cdk.CfnOutput(this, "APIEndpoint", {
      value: api.url,
      description: "Settlement API endpoint",
    });
  }
}
