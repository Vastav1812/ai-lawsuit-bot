// backend/scripts/setup-deployment-wallet.js
import { Wallet, Coinbase } from "@coinbase/coinbase-sdk";
import { config } from "dotenv";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Coinbase SDK
try {
  const apiKeyPath = join(__dirname, '../coinbase_cloud_api_key.json');
  Coinbase.configureFromJson(apiKeyPath);
  console.log('✅ Coinbase SDK initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Coinbase SDK:', error);
  process.exit(1);
}

async function setupDeploymentWallet() {
  console.log("🔑 Creating deployment wallet...\n");
  
  // Create a new wallet for deployment
  const deploymentWallet = await Wallet.create({ networkId: "base-sepolia" });
  const address = await deploymentWallet.getDefaultAddress();
  
  console.log("✅ Deployment wallet created:");
  console.log("   Address:", address);
  console.log("   Wallet ID:", deploymentWallet.getId());
  
  // Export the wallet seed (BE VERY CAREFUL WITH THIS)
  const walletData = deploymentWallet.export();
  
  // Get the private key for Hardhat
  // Note: This is a simplified example. In production, use proper key management
  console.log("\n⚠️  IMPORTANT: Save your wallet data securely!");
  console.log("   Add this private key to your .env file:");
  console.log("   PRIVATE_KEY=<your-private-key>");
  
  // Save wallet backup
  const backupPath = "./wallet-backup.json";
  fs.writeFileSync(backupPath, JSON.stringify(walletData, null, 2));
  console.log("\n📄 Wallet backup saved to:", backupPath);
  
  console.log("\n💰 Fund this wallet with Base Sepolia ETH:");
  console.log("   1. Go to: https://faucet.quicknode.com/base/sepolia");
  console.log("   2. Enter address:", address);
  console.log("   3. Request test ETH");
  
  return deploymentWallet;
}

setupDeploymentWallet().catch(console.error);