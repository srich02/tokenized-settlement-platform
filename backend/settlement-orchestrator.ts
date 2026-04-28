import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { KMSClient } from "@aws-sdk/client-kms";
import * as crypto from "crypto";

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-south-1" });
const kms = new KMSClient({ region: process.env.AWS_REGION || "ap-south-1" });

/**
 * Settlement Orchestrator Lambda
 * 
 * Orchestrates the multi-step settlement workflow:
 * 1. Validate deal (check parties, amounts, assets)
 * 2. Compliance check (KYC, allowlist, daily limits)
 * 3. Record settlement initiation in DynamoDB
 * 4. Emit event for downstream processing (on-chain submission, finality wait)
 */
export const handler = async (event: any) => {
  console.log("Settlement orchestration event:", JSON.stringify(event, null, 2));

  try {
    const {
      dealId,
      seller,
      buyer,
      tokenId,
      amount,
      assetName,
      onChainAddress, // address that will submit the settlement on-chain
    } = event;

    // Validation
    if (!dealId || !seller || !buyer || !tokenId || !amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields",
          required: ["dealId", "seller", "buyer", "tokenId", "amount"],
        }),
      };
    }

    // Step 1: Fetch deal metadata from DynamoDB
    const dealResponse = await dynamodb.send(
      new GetItemCommand({
        TableName: process.env.ASSET_TABLE || "tokenized-assets",
        Key: { assetId: { S: tokenId } },
      })
    );

    if (!dealResponse.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Asset not found" }),
      };
    }

    // Step 2: Check compliance (in production, call compliance Lambda or service)
    const complianceCheckResult = await checkCompliance(seller, buyer, tokenId, amount);

    if (!complianceCheckResult.compliant) {
      // Log failed compliance check
      await recordSettlementEvent({
        transactionId: `${dealId}-compliance-fail`,
        dealId,
        status: "COMPLIANCE_FAILED",
        reason: complianceCheckResult.reason,
        timestamp: Date.now(),
      });

      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Compliance check failed",
          details: complianceCheckResult.reason,
        }),
      };
    }

    // Step 3: Record settlement initiation in DynamoDB
    const transactionId = `txn-${dealId}-${Date.now()}`;

    await recordSettlementEvent({
      transactionId,
      dealId,
      seller,
      buyer,
      tokenId,
      amount,
      status: "INITIATED",
      complianceApproved: true,
      onChainAddress: onChainAddress || seller,
      timestamp: Date.now(),
    });

    // Step 4: Prepare settlement submission payload
    const settlementSubmission = {
      transactionId,
      dealId,
      seller,
      buyer,
      tokenId,
      amount,
      assetName,
      onChainAddress,
      complianceApproved: true,
      submittedAt: new Date().toISOString(),
    };

    console.log("Settlement initiated:", settlementSubmission);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        transactionId,
        message: "Settlement orchestration initiated",
        nextStep: "waiting for on-chain submission",
        submission: settlementSubmission,
      }),
    };
  } catch (error) {
    console.error("Settlement orchestration error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Settlement orchestration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

/**
 * Check compliance for a settlement transaction
 * In production, integrate with your compliance service / Compliance.sol contract
 */
async function checkCompliance(
  seller: string,
  buyer: string,
  tokenId: string,
  amount: number
): Promise<{ compliant: boolean; reason?: string }> {
  // Placeholder: In production, call your compliance Lambda or on-chain compliance contract
  // For now, basic checks:
  
  if (!seller || !buyer) {
    return { compliant: false, reason: "Invalid seller or buyer address" };
  }

  if (amount <= 0) {
    return { compliant: false, reason: "Invalid settlement amount" };
  }

  // Assume approved for demo purposes
  return { compliant: true };
}

/**
 * Record settlement event in DynamoDB transaction table
 */
async function recordSettlementEvent(event: any): Promise<void> {
  const { transactionId, dealId, timestamp, ...rest } = event;

  await dynamodb.send(
    new PutItemCommand({
      TableName: process.env.TRANSACTION_TABLE || "settlement-transactions",
      Item: {
        transactionId: { S: transactionId },
        dealId: { S: dealId },
        timestamp: { N: String(timestamp || Date.now()) },
        status: { S: event.status || "PENDING" },
        ...Object.fromEntries(
          Object.entries(rest).map(([key, value]) => [
            key,
            typeof value === "string" ? { S: value } : { N: String(value) },
          ])
        ),
        createdAt: { S: new Date().toISOString() },
      },
    })
  );
}
