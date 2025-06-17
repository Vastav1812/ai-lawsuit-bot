import { Wallet } from "@coinbase/coinbase-sdk";
import Coinbase from "../src/config/coinbase.js";
import { testBedrockConnection } from "../src/config/bedrock.js";
import { config } from "dotenv";

config();

async function verifySetup() {
  console.log('🔍 Verifying AI Lawsuit Bot Complete Setup...\n');
  
  let allGood = true;
  const results = {
    env: true,
    coinbase: false,
    bedrock: false,
    overall: false
  };

  // 1. Environment variables
  console.log('1️⃣ Checking environment variables...');
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'NETWORK',
    'COINBASE_API_KEY_PATH',
    'BEDROCK_MODEL_ID'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} is set`);
    } else {
      console.log(`❌ ${envVar} is missing`);
      results.env = false;
      allGood = false;
    }
  }

  // 2. Coinbase SDK
  console.log('\n2️⃣ Testing Coinbase SDK...');
  try {
    console.log('   Creating test wallet on Base Sepolia...');
    const testWallet = await Wallet.create({ networkId: "base-sepolia" });
    console.log('   Getting wallet address...');
    const address = await testWallet.getDefaultAddress();
    console.log(`✅ Created test wallet: ${testWallet.getId()}`);
    console.log(`   Address: ${address}`);
    results.coinbase = true;
  } catch (error) {
    console.log(`❌ Coinbase SDK test failed: ${error.message || 'Unknown error'}`);
    console.log('   Error details:', error);
    allGood = false;
  }

  // 3. AWS Bedrock Nova Micro
  console.log('\n3️⃣ Testing AWS Bedrock Nova Micro...');
  results.bedrock = await testBedrockConnection();
  if (!results.bedrock) {
    allGood = false;
  }

  // Summary
  results.overall = allGood;
  console.log('\n📊 Setup Summary:');
  console.log(`   Environment Variables: ${results.env ? '✅' : '❌'}`);
  console.log(`   Coinbase SDK: ${results.coinbase ? '✅' : '❌'}`);
  console.log(`   AWS Bedrock Nova: ${results.bedrock ? '✅' : '❌'}`);
  
  if (allGood) {
    console.log('\n🎉 Phase 1 COMPLETE! All systems operational!');
    console.log('\n🚀 Ready for Phase 2: Smart Contract Development');
    console.log('\nNext steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Test: curl http://localhost:3000/health');
    console.log('   3. Begin smart contract development');
  } else {
    console.log('\n❌ Some issues need fixing before proceeding.');
  }
  
  return results;
}

// Run verification
verifySetup().catch(console.error);