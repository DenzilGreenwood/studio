// Simple test script to check API
const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        type: 'interest-notification',
        data: { email: 'test@example.com' }
      })
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
