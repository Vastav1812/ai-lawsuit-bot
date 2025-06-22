// test-cases-debug.js
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Adjust if different
const CASES_DIR = '/Users/vastav/ai-lawsuit-bot/cases';

// Test wallet addresses (replace with your actual addresses)
const TEST_ADDRESSES = {
  plaintiff: '0xbDF6990357c7198327fe0988BA00b14C7AaAD438', // Replace with your wallet
  defendant: '0x4264604D4256E79585655293E53F5005FB31dD27'  // Replace with test defendant
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCasesDirectory() {
  log('\n=== TESTING CASES DIRECTORY ===', 'blue');
  
  try {
    // Check if directory exists
    const dirStats = await fs.stat(CASES_DIR);
    log(`✅ Cases directory exists: ${CASES_DIR}`, 'green');
    
    // List all files
    const files = await fs.readdir(CASES_DIR);
    log(`📁 Found ${files.length} files in cases directory`, 'yellow');
    
    // Filter case files
    const caseFiles = files.filter(f => f.startsWith('case_') && f.endsWith('.json'));
    log(`📋 Found ${caseFiles.length} case files`, 'yellow');
    
    // Read and validate each case file
    for (const file of caseFiles.slice(0, 3)) { // Show first 3
      log(`\n--- Checking ${file} ---`, 'magenta');
      const filePath = path.join(CASES_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      try {
        const caseData = JSON.parse(content);
        log(`  ID: ${caseData.id}`, 'green');
        log(`  Plaintiff: ${caseData.plaintiff}`, 'green');
        log(`  Defendant: ${caseData.defendant}`, 'green');
        log(`  Status: ${caseData.status}`, 'green');
        log(`  Filed At: ${caseData.filedAt}`, 'green');
        
        // Check address format
        if (caseData.plaintiff && !caseData.plaintiff.startsWith('0x')) {
          log(`  ⚠️  Invalid plaintiff address format`, 'red');
        }
      } catch (parseError) {
        log(`  ❌ Failed to parse JSON: ${parseError.message}`, 'red');
      }
    }
    
    return { success: true, caseFiles };
  } catch (error) {
    log(`❌ Directory test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testSearchEndpoint(address) {
  log(`\n=== TESTING SEARCH ENDPOINT ===`, 'blue');
  log(`Searching for cases where plaintiff = ${address}`, 'yellow');
  
  try {
    const url = `${API_BASE_URL}/api/cases-wallet/search?plaintiff=${address}`;
    log(`📡 Calling: ${url}`, 'yellow');
    
    const response = await axios.get(url);
    log(`✅ Response status: ${response.status}`, 'green');
    log(`📦 Response data:`, 'green');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.cases && response.data.cases.length > 0) {
      log(`✅ Found ${response.data.cases.length} cases`, 'green');
    } else {
      log(`⚠️  No cases found for this address`, 'yellow');
      
      // Try with lowercase
      const lowerUrl = `${API_BASE_URL}/api/cases-wallet/search?plaintiff=${address.toLowerCase()}`;
      log(`\n🔄 Trying with lowercase address: ${lowerUrl}`, 'yellow');
      const lowerResponse = await axios.get(lowerUrl);
      
      if (lowerResponse.data.cases && lowerResponse.data.cases.length > 0) {
        log(`✅ Found ${lowerResponse.data.cases.length} cases with lowercase address!`, 'green');
        log(`🐛 BUG: Case sensitivity issue detected!`, 'red');
      }
    }
    
    return response.data;
  } catch (error) {
    log(`❌ Search endpoint test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response status: ${error.response.status}`, 'red');
      log(`Response data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return null;
  }
}

async function testListEndpoint() {
  log(`\n=== TESTING LIST ENDPOINT ===`, 'blue');
  
  try {
    const url = `${API_BASE_URL}/api/cases-wallet/`;
    log(`📡 Calling: ${url}`, 'yellow');
    
    const response = await axios.get(url);
    log(`✅ Response status: ${response.status}`, 'green');
    log(`📦 Total cases: ${response.data.pagination.total}`, 'green');
    
    if (response.data.cases.length > 0) {
      log(`\nFirst case:`, 'yellow');
      console.log(JSON.stringify(response.data.cases[0], null, 2));
    }
    
    return response.data;
  } catch (error) {
    log(`❌ List endpoint test failed: ${error.message}`, 'red');
    return null;
  }
}

async function testSpecificCase(caseId) {
  log(`\n=== TESTING SPECIFIC CASE ENDPOINT ===`, 'blue');
  
  try {
    const url = `${API_BASE_URL}/api/cases-wallet/${caseId}`;
    log(`📡 Calling: ${url}`, 'yellow');
    
    const response = await axios.get(url);
    log(`✅ Response status: ${response.status}`, 'green');
    log(`📦 Case data:`, 'green');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    log(`❌ Specific case test failed: ${error.message}`, 'red');
    return null;
  }
}

async function compareAddresses() {
  log(`\n=== COMPARING ADDRESSES IN FILES ===`, 'blue');
  
  try {
    const files = await fs.readdir(CASES_DIR);
    const caseFiles = files.filter(f => f.startsWith('case_') && f.endsWith('.json'));
    
    const addresses = new Set();
    
    for (const file of caseFiles) {
      const filePath = path.join(CASES_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      const caseData = JSON.parse(content);
      
      if (caseData.plaintiff) {
        addresses.add(caseData.plaintiff);
      }
    }
    
    log(`\nUnique plaintiff addresses found:`, 'yellow');
    addresses.forEach(addr => {
      log(`  - ${addr}`, 'green');
    });
    
    return Array.from(addresses);
  } catch (error) {
    log(`❌ Address comparison failed: ${error.message}`, 'red');
    return [];
  }
}

async function testFileCase() {
  log(`\n=== TESTING FILE CASE ENDPOINT ===`, 'blue');
  
  try {
    const testCase = {
      defendant: TEST_ADDRESSES.defendant,
      claimType: 'API_FRAUD',
      evidence: 'Test evidence for debugging purposes. This is a test case to verify the system is working correctly.',
      requestedDamages: '0.1'
    };
    
    log(`📝 Filing test case...`, 'yellow');
    console.log(JSON.stringify(testCase, null, 2));
    
    // Note: This will fail without proper payment headers
    const url = `${API_BASE_URL}/api/cases-wallet/file`;
    log(`\n⚠️  Note: File endpoint requires payment headers`, 'yellow');
    log(`Would call: POST ${url}`, 'yellow');
    
  } catch (error) {
    log(`❌ File case test failed: ${error.message}`, 'red');
  }
}

async function runAllTests() {
  log('🚀 STARTING CASE SYSTEM DIAGNOSTIC', 'magenta');
  log(`API URL: ${API_BASE_URL}`, 'yellow');
  log(`Cases Directory: ${CASES_DIR}`, 'yellow');
  log(`Test Plaintiff: ${TEST_ADDRESSES.plaintiff}`, 'yellow');
  
  // Test 1: Check cases directory
  const dirTest = await testCasesDirectory();
  
  // Test 2: Get all unique addresses
  const addresses = await compareAddresses();
  
  // Test 3: Test search endpoint with test address
  await testSearchEndpoint(TEST_ADDRESSES.plaintiff);
  
  // Test 4: Test list endpoint
  const listData = await testListEndpoint();
  
  // Test 5: If we found cases, test specific case endpoint
  if (dirTest.caseFiles && dirTest.caseFiles.length > 0) {
    const firstCaseId = dirTest.caseFiles[0].replace('case_', '').replace('.json', '');
    await testSpecificCase(firstCaseId);
  }
  
  // Test 6: Show how to file a case
  await testFileCase();
  
  // Summary
  log(`\n=== DIAGNOSTIC SUMMARY ===`, 'magenta');
  log(`✅ Cases directory accessible: ${dirTest.success}`, dirTest.success ? 'green' : 'red');
  log(`📁 Case files found: ${dirTest.caseFiles?.length || 0}`, 'yellow');
  log(`👥 Unique plaintiffs: ${addresses.length}`, 'yellow');
  log(`🔍 Search endpoint working: ${listData ? 'Yes' : 'No'}`, listData ? 'green' : 'red');
  
  log(`\n💡 COMMON ISSUES TO CHECK:`, 'blue');
  log(`1. Wallet address case sensitivity (0x vs 0X)`, 'yellow');
  log(`2. Address mismatch between frontend and stored cases`, 'yellow');
  log(`3. Backend server running on correct port`, 'yellow');
  log(`4. CORS issues between frontend and backend`, 'yellow');
  log(`5. Payment headers not being sent correctly`, 'yellow');
}

// Run the tests
runAllTests().catch(console.error);