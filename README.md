# Tokenized Asset Settlement Platform

> Enterprise-grade tokenized invoice/asset settlement with on-chain auditability and AWS-native orchestration.

## Architecture Overview

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity (Hardhat), EVM-compatible chain |
| Backend | AWS Lambda, API Gateway, Step Functions, EventBridge |
| Identity & Auth | AWS Cognito, IAM, KMS |
| Data | DynamoDB, S3, Glue, Athena |
| Infra-as-Code | AWS CDK (TypeScript) |
| CI/CD | GitHub Actions |
| Monitoring | CloudWatch, X-Ray, CloudTrail |

## Project Structure

```
contracts/       # Solidity smart contracts
test/            # Contract + integration tests
scripts/         # Deployment and utility scripts
backend/         # AWS Lambda functions and API definitions
frontend/        # Web dashboard (React)
infra/           # AWS CDK stacks
docs/            # Architecture diagrams, threat model, decision records
.github/         # CI/CD workflows
```

## Key Features

1. **Asset Issuance** — Mint tokenized invoices with metadata and compliance flags
2. **Multi-Party Settlement** — Approval-gated workflow with Step Functions orchestration
3. **On-Chain/Off-Chain Reconciliation** — Event-driven sync between chain state and DynamoDB
4. **Compliance Controls** — KYC status checks, transfer limits, and full audit trail
5. **Failure Handling** — Retry logic, dead-letter queues, and transaction finality checks

## Getting Started

```bash
# Install dependencies
pnpm install

# Compile contracts
pnpm run compile

# Run tests
pnpm test

# Deploy infra (requires AWS credentials)
cd infra && cdk deploy
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

## License

MIT
