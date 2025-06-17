// scripts/test-judge.js
import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testJudge() {
    try {
        // Use the case ID from your last run
        const caseId = '1749367804175'; // Update this with your actual case ID
        
        console.log('Testing judge endpoint for case:', caseId);
        
        const paymentHeader = Buffer.from(JSON.stringify({
            from: '0x123',
            amount: '$5.00'
        })).toString('base64');
        
        const response = await axios.post(
            `${API_URL}/api/cases/${caseId}/judge`,
            {},
            {
                headers: { 
                    'X-PAYMENT': paymentHeader,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            }
        );
        
        console.log('Success:', response.data);
        
    } catch (error) {
        if (error.code === 'ECONNRESET') {
            console.error('Connection reset - server crashed');
        } else if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testJudge();