#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { SettlementPlatformStack } from "../lib/main-stack";

const app = new cdk.App();

const env = {
  account: process.env.AWS_ACCOUNT_ID || "123456789012",
  region: process.env.AWS_REGION || "ap-south-1",
};

new SettlementPlatformStack(app, "SettlementPlatformStack", {
  env,
  description: "Tokenized Asset Settlement Platform infrastructure",
});

app.synth();
