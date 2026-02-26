import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');

if (!fs.existsSync(envPath)) {
  console.error('Missing .env file. Create it from .env.example first.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split(/\r?\n/);
const env = {};

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx <= 0) continue;
  const key = trimmed.slice(0, idx).trim();
  const value = trimmed.slice(idx + 1).trim();
  env[key] = value;
}

const groups = {
  required_for_core_chat: [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'GEMINI_API_KEY',
  ],
  recommended_for_agents: [
    'CLAUDE_API_KEY',
    'LETTA_API_KEY',
  ],
  search_and_discovery: [
    'SERPER_API_KEY',
    'FIRECRAWL_API_KEY',
  ],
  email_delivery: [
    'MAILJET_API_KEY',
    'MAILJET_SECRET_KEY',
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
  ],
  growth_analytics: [
    'GA4_PROPERTY_ID',
    'SEARCH_CONSOLE_SITE_URL',
  ],
};

const placeholderTokens = ['xxx', 'your-', '<', 'sk_test', 'SG.xxxxx'];

function isConfigured(key) {
  const value = (env[key] || '').trim();
  if (!value) return false;
  const low = value.toLowerCase();
  return !placeholderTokens.some((token) => low.includes(token));
}

let totalMissing = 0;

for (const [group, keys] of Object.entries(groups)) {
  console.log(`\n[${group}]`);
  for (const key of keys) {
    const ok = isConfigured(key);
    if (!ok) totalMissing += 1;
    console.log(` - ${ok ? 'OK ' : 'MISSING'} ${key}`);
  }
}

console.log('\nSummary:');
if (totalMissing === 0) {
  console.log('All listed integration keys are configured.');
} else {
  console.log(`${totalMissing} key(s) missing or placeholder values found.`);
  process.exitCode = 1;
}
