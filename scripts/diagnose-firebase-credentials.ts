/**
 * Diagnostic script to help debug Firebase credentials issues
 * 
 * Run with: npx tsx scripts/diagnose-firebase-credentials.ts
 */

import 'dotenv/config';

console.log('=== Firebase Credentials Diagnostic ===\n');

// Check each possible env var
const envVars = [
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'FIREBASE_ADMIN_BASE64', 
  'FIREBASE_ADMIN_JSON',
  'FIREBASE_PROJECT_ID'
];

for (const varName of envVars) {
  const value = process.env[varName];
  console.log(`\n${varName}:`);
  if (!value) {
    console.log('  NOT SET');
    continue;
  }
  
  console.log(`  Length: ${value.length} chars`);
  console.log(`  First 50 chars: ${value.substring(0, 50)}`);
  
  // Check if it's valid JSON
  try {
    JSON.parse(value);
    console.log('  ✅ Valid JSON');
  } catch (e) {
    console.log('  ❌ NOT valid JSON');
    
    // Try base64 decode
    try {
      const decoded = Buffer.from(value, 'base64').toString('utf8');
      console.log(`  Base64 decode attempt:`);
      console.log(`    Decoded first 100 chars: ${decoded.substring(0, 100)}`);
      
      // Check if decoded is valid JSON
      try {
        JSON.parse(decoded);
        console.log('  ✅ Base64 decoded IS valid JSON');
      } catch (e2) {
        console.log('  ❌ Base64 decoded is NOT valid JSON either');
      }
    } catch (e2) {
      console.log('  ❌ NOT valid Base64');
    }
  }
}

console.log('\n=== Solutions ===\n');

console.log('Option 1: Set as raw JSON (recommended for .env.local):');
console.log('  FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}\n');

console.log('Option 2: Set as Base64 encoded JSON:');
console.log('  Base64 encode your service-account.json file and set:');
console.log('  FIREBASE_ADMIN_BASE64=<base64-encoded-json>\n');

console.log('Option 3: Place service-account.json in project root');
console.log('  The app will automatically load it if env var is not set\n');

console.log('To generate base64 from your service-account.json:');
console.log('  [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content service-account.json -Raw)))');
