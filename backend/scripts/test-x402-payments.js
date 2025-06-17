// backend/scripts/test-x402-payments.js
import axios from 'axios';
import { createPaymentHeader } from '@coinbase/x402-js';

const API_URL = 'http://localhost:3000';

async function testPaymentEndpoints() {
  console.log('🧪 Testing x402 Payment Integration...\n');
  
  // Test 1: Try to access paid endpoint without payment
  console.log('Test 1: Access without payment');
  try {
    const response = await axios.post(`${API_URL}/api/cases/file`, {
      defendant: '0x456',
      claimType: 'API_FRAUD',
      evidence: { test: true },
      requestedDamages: '1.0'
    });
  } catch (error) {
    if (error.response?.status === 402) {
      console.log('✅ Correctly returned 402 Payment Required');
      console.log('   Message:', error.response.data.message);
    }
  }
  
  // Test 2: Access free endpoint
  console.log('\nTest 2: Access free endpoint');
  try {
    const response = await axios.get(`${API_URL}/api/info`);
    console.log('✅ Free endpoint accessible');
    console.log('   Pricing:', response.data.pricing);
  } catch (error) {
    console.error('❌ Free endpoint failed:', error.message);
  }
  
  // Test 3: Simulate payment (mock)
  console.log('\nTest 3: Simulate payment header');
  const mockPaymentData = {
    from: '0x123abc',
    amount: '10.00',
    currency: 'USD',
    timestamp: new Date().toISOString()
  };
  
  const paymentHeader = Buffer.from(JSON.stringify(mockPaymentData)).toString('base64');
  
  try {
    const response = await axios.post(`${API_URL}/api/cases/file`, 
      {
        defendant: '0x456def',
        claimType: 'API_FRAUD',
        evidence: { 
          promised: '99% accuracy',
          delivered: '60% accuracy'
        },
        requestedDamages: '1.0'
      },
      {
        headers: {
          'X-PAYMENT': paymentHeader
        }
      }
    );
    
    console.log('✅ Payment accepted, case filed');
    console.log('   Case ID:', response.data.caseId);
    console.log('   Payment received:', response.data.paymentReceived);
  } catch (error) {
    console.error('❌ Payment test failed:', error.response?.data || error.message);
  }
  
  console.log('\n✅ x402 Payment integration test complete!');
}

testPaymentEndpoints().catch(console.error);