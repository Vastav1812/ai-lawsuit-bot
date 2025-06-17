// scripts/demo-settlement-flow.js
import axios from 'axios';

const API_URL = 'http://localhost:3000';

// Helper to create payment header
function createPaymentHeader(amount) {
  const paymentData = {
    from: '0x1234567890abcdef1234567890abcdef12345678',
    amount: amount,
    timestamp: new Date().toISOString()
  };
  return Buffer.from(JSON.stringify(paymentData)).toString('base64');
}

async function demoSettlementFlow() {
  console.log('🎭 AI Lawsuit Settlement Demo\n');
  
  try {
    // 1. File a case
    console.log('1️⃣ Filing a case...');
    const caseResponse = await axios.post(
      `${API_URL}/api/cases/file`,
      {
        defendant: '0xabcdef1234567890abcdef1234567890abcdef12',
        claimType: 'API_FRAUD',
        evidence: {
          promised: '99% accuracy',
          delivered: '60% accuracy',
          proofUrl: 'ipfs://QmProofHash'
        },
        requestedDamages: '0.1'
      },
      {
        headers: { 'X-PAYMENT': createPaymentHeader('$10.00') }
      }
    );
    
    const caseId = caseResponse.data.caseId;
    console.log('✅ Case filed:', caseId);
    console.log('   Evidence hash:', caseResponse.data.evidenceHash);
    console.log('   Next steps:', caseResponse.data.nextSteps);
    
    // 2. Get AI judgment
    console.log('\n2️⃣ Getting AI judgment...');
    const judgmentResponse = await axios.post(
      `${API_URL}/api/cases/${caseId}/judge`,
      {},
      {
        headers: { 
          'X-PAYMENT': createPaymentHeader('$5.00'),
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('⚖️ Judgment received:');
    console.log('   Verdict:', judgmentResponse.data.judgment.verdict.toUpperCase());
    console.log('   Awarded damages:', judgmentResponse.data.judgment.awardedDamages, 'ETH');
    console.log('   Reasoning:', judgmentResponse.data.judgment.reasoning);
    console.log('   Precedents cited:', judgmentResponse.data.judgment.precedents);
    console.log('   Verdict hash:', judgmentResponse.data.verdictHash);
    
    // 3. Search precedents
    console.log('\n3️⃣ Searching similar precedents...');
    const precedentResponse = await axios.get(
      `${API_URL}/api/precedents/search?type=API_FRAUD`,
      {
        headers: { 'X-PAYMENT': createPaymentHeader('$0.50') }
      }
    );
    
    console.log('📚 Found', precedentResponse.data.count, 'similar cases:');
    precedentResponse.data.results.forEach(precedent => {
      console.log(`   - Case ${precedent.caseId}: ${precedent.summary}`);
      console.log(`     Verdict: ${precedent.verdict}, Citations: ${precedent.citationCount}`);
    });
    
    // 4. Generate analytics report
    console.log('\n4️⃣ Generating analytics report...');
    const analyticsResponse = await axios.post(
      `${API_URL}/api/analytics/report`,
      {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        includeDetails: true
      },
      {
        headers: { 'X-PAYMENT': createPaymentHeader('$15.00') }
      }
    );
    
    console.log('📊 Analytics Summary:');
    console.log('   Total cases:', analyticsResponse.data.report.summary.totalCases);
    console.log('   Guilty verdicts:', analyticsResponse.data.report.summary.guiltyVerdicts);
    console.log('   Total damages awarded:', analyticsResponse.data.report.summary.totalDamagesAwarded);
    console.log('   Most common case type:', analyticsResponse.data.report.summary.mostCommonCaseType);
    console.log('   Revenue generated:', analyticsResponse.data.report.revenueAnalysis.totalRevenue);
    
    // 5. Demo wallet functionality (if implemented)
    console.log('\n5️⃣ Settlement Information:');
    if (judgmentResponse.data.judgment.verdict === 'guilty') {
      console.log('💰 Settlement Required:');
      console.log('   Defendant must pay:', judgmentResponse.data.judgment.awardedDamages, 'ETH');
      console.log('   Deadline: Within 7 days');
      console.log('   Payment distribution:');
      console.log('   - 75% to plaintiff');
      console.log('   - 15% to court treasury');
      console.log('   - 5% to jury pool');
      console.log('   - 5% to precedent fund');
    }
    
    // 6. Summary
    console.log('\n✅ Demo Complete!');
    console.log('Total fees paid:');
    console.log('   - Case filing: $10.00');
    console.log('   - AI judgment: $5.00');
    console.log('   - Precedent search: $0.50');
    console.log('   - Analytics report: $15.00');
    console.log('   Total: $30.50');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the demo
console.log('Starting AI Lawsuit Settlement Demo...\n');
console.log('Server:', API_URL);
console.log('Network: Base Sepolia\n');

demoSettlementFlow();