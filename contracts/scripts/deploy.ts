import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1. Deploy Compliance
  const Compliance = await ethers.getContractFactory("Compliance");
  const compliance = await Compliance.deploy(deployer.address);
  await compliance.waitForDeployment();
  console.log("Compliance deployed to:", await compliance.getAddress());

  // 2. Deploy AssetToken
  const AssetToken = await ethers.getContractFactory("AssetToken");
  const assetToken = await AssetToken.deploy(
    "https://metadata.example.com/assets/{id}.json",
    deployer.address
  );
  await assetToken.waitForDeployment();
  console.log("AssetToken deployed to:", await assetToken.getAddress());

  // 3. Deploy Settlement
  const Settlement = await ethers.getContractFactory("Settlement");
  const settlement = await Settlement.deploy(deployer.address);
  await settlement.waitForDeployment();
  console.log("Settlement deployed to:", await settlement.getAddress());

  // Output summary
  console.log("\n--- Deployment Summary ---");
  console.log({
    compliance: await compliance.getAddress(),
    assetToken: await assetToken.getAddress(),
    settlement: await settlement.getAddress(),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
