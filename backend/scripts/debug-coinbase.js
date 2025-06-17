// scripts/debug-coinbase.js
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugCoinbase() {
    console.log('🔍 Coinbase SDK Debug Tool\n');
    
    // 1. Check environment
    console.log('1️⃣ Environment Check:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   COINBASE_API_KEY_PATH:', process.env.COINBASE_API_KEY_PATH);
    console.log('   NETWORK:', process.env.NETWORK);
    
    // 2. Check API key file
    console.log('\n2️⃣ API Key File Check:');
    const keyPath = path.resolve(process.env.COINBASE_API_KEY_PATH);
    console.log('   Full path:', keyPath);
    console.log('   File exists:', fs.existsSync(keyPath));
    
    if (!fs.existsSync(keyPath)) {
        console.error('❌ API key file not found!');
        process.exit(1);
    }
    
    // 3. Validate key file content
    console.log('\n3️⃣ Key File Content Validation:');
    try {
        const keyContent = fs.readFileSync(keyPath, 'utf8');
        const keyData = JSON.parse(keyContent);
        
        console.log('   ✓ JSON is valid');
        console.log('   Key structure:');
        console.log('     - name:', keyData.name ? '✓ Present' : '✗ Missing');
        console.log('     - privateKey:', keyData.privateKey ? '✓ Present' : '✗ Missing');
        
        if (keyData.name) {
            console.log('     - Key ID format:', keyData.name);
            // Extract organization ID
            const match = keyData.name.match(/organizations\/([^\/]+)/);
            if (match) {
                console.log('     - Organization ID:', match[1]);
            }
        }
        
        if (keyData.privateKey) {
            console.log('     - Key type:', keyData.privateKey.includes('BEGIN EC PRIVATE KEY') ? 'EC Private Key ✓' : 'Unknown format ✗');
        }
        
    } catch (error) {
        console.error('❌ Error reading key file:', error.message);
        process.exit(1);
    }
    
    // 4. Test SDK initialization methods
    console.log('\n4️⃣ Testing SDK Initialization Methods:');
    
    // Method 1: Using configureFromJson
    console.log('\n   Method 1: configureFromJson()');
    try {
        Coinbase.configureFromJson(keyPath);
        console.log('   ✅ configureFromJson succeeded');
    } catch (error) {
        console.log('   ❌ configureFromJson failed:', error.message);
    }
    
    // Method 2: Direct initialization
    console.log('\n   Method 2: Direct new Coinbase()');
    try {
        const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const coinbase = new Coinbase({
            apiKeyName: keyData.name,
            privateKey: keyData.privateKey
        });
        console.log('   ✅ Direct initialization succeeded');
    } catch (error) {
        console.log('   ❌ Direct initialization failed:', error.message);
    }
    
    // 5. Test API calls
    console.log('\n5️⃣ Testing API Calls:');
    
    try {
        // Initialize SDK
        Coinbase.configureFromJson(keyPath);
        
        // Test 1: List wallets
        console.log('\n   Test 1: Listing wallets...');
        try {
            const wallets = await Wallet.list();
            console.log('   ✅ List wallets succeeded');
            console.log('   Number of wallets:', wallets.length);
        } catch (error) {
            console.log('   ❌ List wallets failed:', error.message);
            if (error.httpCode) {
                console.log('   HTTP Code:', error.httpCode);
                console.log('   API Code:', error.apiCode);
                console.log('   API Message:', error.apiMessage);
            }
        }
        
        // Test 2: Create wallet
        console.log('\n   Test 2: Creating test wallet...');
        try {
            const seed = Buffer.from('debug-test-' + Date.now()).toString('hex');
            const wallet = await Wallet.createWithSeed({
                networkId: 'base-sepolia',
                seed: seed
            });
            console.log('   ✅ Wallet creation succeeded');
            console.log('   Wallet ID:', wallet.getId());
            console.log('   Default address:', wallet.getDefaultAddress().toString());
        } catch (error) {
            console.log('   ❌ Wallet creation failed:', error.message);
            if (error.httpCode) {
                console.log('   HTTP Code:', error.httpCode);
                console.log('   API Code:', error.apiCode);
                console.log('   API Message:', error.apiMessage);
                console.log('   Full error:', JSON.stringify(error, null, 2));
            }
        }
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
    }
    
    // 6. Recommendations
    console.log('\n6️⃣ Troubleshooting Recommendations:');
    console.log('\nIf you\'re getting 401 errors:');
    console.log('1. Regenerate your API key at: https://portal.cdp.coinbase.com/settings/api-keys');
    console.log('2. Make sure to select these scopes when creating the key:');
    console.log('   - wallet:accounts:create');
    console.log('   - wallet:accounts:read');
    console.log('   - wallet:addresses:create');
    console.log('   - wallet:addresses:read');
    console.log('   - wallet:user:read');
    console.log('3. Select "Base Sepolia" as the default network');
    console.log('4. Download the new JSON file and replace coinbase_cloud_api_key.json');
}

// Run debug
debugCoinbase().catch(console.error);