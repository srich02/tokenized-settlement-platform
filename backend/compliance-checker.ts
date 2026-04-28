import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import * as crypto from "crypto";

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-south-1" });

/**
 * Compliance Checker Lambda
 * 
 * Validates settlements against compliance policies:
 * - KYC/allowlist verification
 * - Daily transfer limits
 * - Blocked party lists (sanctions)
 * - Transfer restrictions
 */
export const handler = async (event: any) => {
  console.log("Compliance check event:", JSON.stringify(event, null, 2));

  try {
    const { seller, buyer, tokenId, amount } = event;

    if (!seller || !buyer || !tokenId || !amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields",
          required: ["seller", "buyer", "tokenId", "amount"],
        }),
      };
    }

    // Perform compliance checks
    const checks = await Promise.all([
      checkAllowlist(seller),
      checkAllowlist(buyer),
      checkBlacklist(seller),
      checkBlacklist(buyer),
      checkDailyLimit(tokenId, amount),
    ]);

    const [sellerAllowlisted, buyerAllowlisted, sellerNotBlocked, buyerNotBlocked, withinDailyLimit] = checks;

    if (!sellerAllowlisted) {
      return complianceFailure("Seller not allowlisted (KYC not verified)");
    }

    if (!buyerAllowlisted) {
      return complianceFailure("Buyer not allowlisted (KYC not verified)");
    }

    if (!sellerNotBlocked) {
      return complianceFailure("Seller is on blocked list (sanctions or fraud)");
    }

    if (!buyerNotBlocked) {
      return complianceFailure("Buyer is on blocked list (sanctions or fraud)");
    }

    if (!withinDailyLimit) {
      return complianceFailure("Transfer exceeds daily limit for this asset");
    }

    // All checks passed
    return {
      statusCode: 200,
      body: JSON.stringify({
        compliant: true,
        checks: {
          sellerAllowlisted: true,
          buyerAllowlisted: true,
          sellerNotBlocked: true,
          buyerNotBlocked: true,
          withinDailyLimit: true,
        },
        message: "Compliance checks passed",
      }),
    };
  } catch (error) {
    console.error("Compliance check error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Compliance check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

/**
 * Check if an address is allowlisted (KYC verified)
 * In production, query your compliance service or on-chain Compliance.sol contract
 */
async function checkAllowlist(address: string): Promise<boolean> {
  // Placeholder: In production, call DynamoDB compliance table or on-chain contract
  // For demo, assume all addresses are allowlisted
  console.log(`Checking allowlist for ${address}`);
  return true;
}

/**
 * Check if an address is on the blocklist (sanctions, fraud, etc.)
 * In production, query your compliance service or on-chain Compliance.sol contract
 */
async function checkBlacklist(address: string): Promise<boolean> {
  // Placeholder: In production, call DynamoDB compliance table or on-chain contract
  // For demo, assume no addresses are blocked
  console.log(`Checking blacklist for ${address}`);
  return true;
}

/**
 * Check if a settlement amount would exceed the daily transfer limit for an asset
 * In production, query your compliance service or on-chain Compliance.sol contract
 */
async function checkDailyLimit(tokenId: string, amount: number): Promise<boolean> {
  // Placeholder: In production, query daily usage from DynamoDB or on-chain contract
  // For demo, assume 1M limit per day
  const dailyLimitPerAsset = 1_000_000;

  console.log(
    `Checking daily limit for token ${tokenId}: ${amount} <= ${dailyLimitPerAsset}`
  );

  return amount <= dailyLimitPerAsset;
}

/**
 * Helper to return a compliance failure response
 */
function complianceFailure(reason: string) {
  return {
    statusCode: 403,
    body: JSON.stringify({
      compliant: false,
      reason,
      message: "Compliance check failed",
    }),
  };
}
