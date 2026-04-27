# Threat Model — Tokenized Asset Settlement Platform

## Assets

| Asset | Sensitivity | Location |
|-------|------------|----------|
| Deployer private key | Critical | AWS KMS (never in env vars) |
| User auth tokens | High | Cognito JWT, short-lived |
| Transaction state | High | DynamoDB (encrypted at rest) |
| Smart contract admin role | Critical | Multi-sig or KMS-backed EOA |
| RPC endpoint credentials | Medium | Secrets Manager |
| Compliance evidence logs | High | S3 (versioned, encrypted) |

## Threat Categories (STRIDE)

### Spoofing
- **Threat**: Unauthorized user submits settlement transactions
- **Mitigation**: Cognito JWT validation on API Gateway; on-chain allowlist in Compliance.sol

### Tampering
- **Threat**: Modification of transaction state in DynamoDB
- **Mitigation**: DynamoDB encryption at rest + point-in-time recovery; on-chain state is immutable

### Repudiation
- **Threat**: Party denies approving a settlement
- **Mitigation**: On-chain event logs with block timestamp; CloudTrail for API calls

### Information Disclosure
- **Threat**: Leaking private keys or PII
- **Mitigation**: KMS for key ops (sign without exposing key); no PII stored on-chain; S3 bucket policies + encryption

### Denial of Service
- **Threat**: API Gateway flood; chain gas price spike
- **Mitigation**: WAF rate limiting; API throttling; gas price oracle with circuit breaker in Step Functions

### Elevation of Privilege
- **Threat**: Lambda role over-permissioned; contract admin key compromised
- **Mitigation**: Least-privilege IAM per Lambda; contract admin behind multi-sig or time-lock

## Key Management Strategy

1. **Deployer/Admin key**: AWS KMS asymmetric key; Lambda calls KMS Sign API
2. **User wallets**: Client-side (MetaMask or WalletConnect); platform never holds user keys
3. **API secrets**: Secrets Manager with automatic rotation policy
4. **Encryption keys**: AWS-managed KMS keys for DynamoDB, S3, CloudWatch Logs

## Incident Response

1. Detect via CloudWatch alarms + GuardDuty findings
2. Isolate via Lambda concurrency set to 0 + API Gateway stage disable
3. Investigate via X-Ray traces + CloudTrail event history
4. Remediate: rotate keys, patch contract (if upgradeable proxy), redeploy infra
5. Post-mortem: document in `docs/incidents/` with timeline and corrective actions
