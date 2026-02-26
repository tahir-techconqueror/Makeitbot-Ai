/**
 * Test script to verify onboarding fallback works without Firebase credentials
 * Run: node test-onboarding-fallback.js
 */

const http = require('http');

const formData = new URLSearchParams({
  role: 'brand',
  marketState: 'CA',
  manualBrandName: 'Test Brand',
  chatbotPersonality: 'friendly',
  chatbotTone: 'professional',
  chatbotSellingPoints: 'quality,service',
  posProvider: 'none'
}).toString();

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/onboarding',  // Adjust if endpoint differs
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(formData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n✓ Onboarding endpoint responded');
    console.log('Status:', res.statusCode);
    console.log('\nResponse:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (!json.error) {
        console.log('\n✓ SUCCESS: Onboarding completed without error!');
        console.log('  This means the local fallback worked correctly.');
      } else {
        console.log('\n✗ FAILED: ' + json.message);
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (err) => {
  console.error('✗ Request failed:', err.message);
  console.log('\nMake sure dev server is running on port 3000');
  console.log('Run: npm run dev');
});

console.log('Testing onboarding fallback...\nMaking POST request to localhost:3000/api/onboarding\n');
req.write(formData);
req.end();
