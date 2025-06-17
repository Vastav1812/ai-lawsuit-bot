// scripts/deploy-contract.js
const hre = require("hardhat");
const fs = require("fs");
const { Coinbase, Wallet } = require("@coinbase/coinbase-sdk");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

function randomSeed() {
  return crypto.randomBytes(32).toString("hex");
}

async function main() {
  console.log("🚀 Deploying AI Court Settlement Contract...\n");

  // Initialize Coinbase SDK
  console.log("Initializing Coinbase SDK...");
  Coinbase.configureFromJson(process.env.COINBASE_API_KEY_PATH);
  console.log("✅ Coinbase SDK initialized\n");

  // Create treasury wallets
  console.log("Creating treasury wallets...");
  
  const courtTreasuryWallet = await Wallet.createWithSeed({
    networkId: 'base-sepolia',
    seed: randomSeed()
  });
  
  const juryPoolWallet = await Wallet.createWithSeed({
    networkId: 'base-sepolia',
    seed: randomSeed()
  });
  
  const precedentFundWallet = await Wallet.createWithSeed({
    networkId: 'base-sepolia',
    seed: randomSeed()
  });

  // Extract string addresses from WalletAddress objects
  const courtTreasuryAddressObj = await courtTreasuryWallet.getDefaultAddress();
  const juryPoolAddressObj = await juryPoolWallet.getDefaultAddress();
  const precedentFundAddressObj = await precedentFundWallet.getDefaultAddress();

  const treasuryAddresses = {
    courtTreasury: courtTreasuryAddressObj.id,
    juryPool: juryPoolAddressObj.id,
    precedentFund: precedentFundAddressObj.id
  };

  console.log("Treasury Addresses:");
  console.log("  Court Treasury:", treasuryAddresses.courtTreasury);
  console.log("  Jury Pool:", treasuryAddresses.juryPool);
  console.log("  Precedent Fund:", treasuryAddresses.precedentFund);
  console.log("");

  // Deploy contract using Hardhat
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const AICourtSettlement = await hre.ethers.getContractFactory("AICourtSettlement");
  const court = await AICourtSettlement.deploy(
    treasuryAddresses.courtTreasury,
    treasuryAddresses.juryPool,
    treasuryAddresses.precedentFund
  );

  await court.waitForDeployment();
  const courtAddress = await court.getAddress();
  
  console.log("\n✅ AI Court Settlement deployed to:", courtAddress);

  // Create AI Judge wallet
  console.log("\nCreating AI Judge wallet...");
  const aiJudgeWallet = await Wallet.createWithSeed({
    networkId: 'base-sepolia',
    seed: randomSeed()
  });
  const aiJudgeAddressObj = await aiJudgeWallet.getDefaultAddress();
  const aiJudgeAddress = aiJudgeAddressObj.id;
  console.log("🤖 AI Judge Address:", aiJudgeAddress);

  // Authorize AI Judge
  console.log("\nAuthorizing AI Judge...");
  const tx = await court.authorizeJudge(aiJudgeAddress);
  await tx.wait();
  console.log("✅ AI Judge authorized");

  // Save deployment info
  const deploymentInfo = {
    network: "base-sepolia",
    courtContract: courtAddress,
    treasuryAddresses,
    aiJudgeAddress,
    walletSeeds: {
      // Store these securely in production!
      courtTreasury: courtTreasuryWallet.getId(),
      juryPool: juryPoolWallet.getId(),
      precedentFund: precedentFundWallet.getId(),
      aiJudge: aiJudgeWallet.getId()
    },
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 Deployment info saved to deployment-info.json");

  // Update .env file instructions
  console.log("\n📝 Add these to your .env file:");
  console.log(`COURT_CONTRACT_ADDRESS=${courtAddress}`);
  console.log(`COURT_TREASURY_ADDRESS=${treasuryAddresses.courtTreasury}`);
  console.log(`JURY_POOL_ADDRESS=${treasuryAddresses.juryPool}`);
  console.log(`PRECEDENT_FUND_ADDRESS=${treasuryAddresses.precedentFund}`);
  console.log(`AI_JUDGE_ADDRESS=${aiJudgeAddress}`);

  // Verify on Basescan (optional)
  if (process.env.BASESCAN_API_KEY && hre.network.name !== "hardhat") {
    console.log("\n🔍 Waiting for contract to be indexed...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    console.log("Verifying contract on Basescan...");
    try {
      await hre.run("verify:verify", {
        address: courtAddress,
        constructorArguments: [
          treasuryAddresses.courtTreasury,
          treasuryAddresses.juryPool,
          treasuryAddresses.precedentFund
        ],
      });
      console.log("✅ Contract verified on Basescan");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});