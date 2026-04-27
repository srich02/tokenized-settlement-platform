# Architecture — Tokenized Asset Settlement Platform

## Context

Enterprises need faster, auditable settlement of trade assets/invoices between counter-parties. Traditional systems rely on batch reconciliation with T+2 or longer settlement windows. This platform reduces that to near-real-time with on-chain finality and off-chain orchestration.

## System Context (C4 Level 1)

```
[Enterprise User] --> [Web Dashboard / API]
                          |
              +-----------+-----------+
              |                       |
    [AWS Backend Services]    [Smart Contracts]
              |                       |
    [DynamoDB / S3 / Athena]   [EVM Chain]
```

## Container Diagram (C4 Level 2)

### Frontend
- React SPA hosted on S3 + CloudFront
- Auth via Cognito hosted UI

### API Layer
- API Gateway (REST) with Cognito authorizer
- Lambda functions for CRUD and transaction submission

### Orchestration
- Step Functions for multi-step settlement workflow:
  1. Validate asset
  2. Check compliance (KYC, limits)
  3. Submit on-chain transaction
  4. Wait for finality
  5. Update DynamoDB state
  6. Emit EventBridge event for downstream consumers

### Smart Contracts
- `AssetToken.sol` — ERC-1155 for tokenized assets with metadata URI
- `Settlement.sol` — Escrow + release with multi-party approval
- `Compliance.sol` — On-chain allowlist and transfer restriction logic

### Data
- DynamoDB: transaction state, asset metadata
- S3: raw event logs, compliance evidence
- Glue + Athena: analytics queries over settlement history
- QuickSight: dashboards for ops and audit

### Security
- KMS for signing key material (not raw private keys in env)
- Secrets Manager for RPC endpoints and API keys
- CloudTrail for all API activity logging
- WAF on API Gateway

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| ERC-1155 over ERC-721 | Batch operations, lower gas for multi-asset settlements |
| Step Functions over direct Lambda chains | Visual workflow, built-in retry, audit trail |
| DynamoDB over RDS | Low-latency key-value access for transaction state |
| EventBridge over SNS/SQS | Schema registry, filtering, multi-target fan-out |
| CDK over CloudFormation/SAM | TypeScript, reusable constructs, testable infra |

## Sequence: Settlement Flow

```
User -> API GW -> Lambda (validate) -> Step Functions
  Step 1: Check asset ownership (DynamoDB)
  Step 2: Compliance check (Lambda + on-chain call)
  Step 3: Submit settlement tx (Lambda -> RPC)
  Step 4: Poll for finality (Lambda, retry with backoff)
  Step 5: Update state (DynamoDB)
  Step 6: Emit event (EventBridge -> downstream)
```
