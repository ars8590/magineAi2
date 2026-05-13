// Script to test Gemini API key
// Run: node scripts/test-api-key.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));
console.log('🔑 API Key length:', apiKey.length);
console.log('🔑 API Key starts with:', apiKey.substring(0, 5));
console.log('');

// Test with direct API call
console.log('📡 Testing API key with direct HTTP request...\n');

try {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ API key is valid!');
    console.log('\n📋 Available models:');
    if (data.models && data.models.length > 0) {
      data.models.forEach((model) => {
        console.log(`   - ${model.name} (${model.displayName || 'N/A'})`);
      });
    } else {
      console.log('   No models found in response');
    }
    console.log('\n📄 Full response:', JSON.stringify(data, null, 2));
  } else {
    console.error('❌ API key test failed:', data);
    console.error('Status:', response.status, response.statusText);
  }
} catch (error) {
  console.error('❌ Error testing API key:', error.message);
  console.error('\n💡 Possible issues:');
  console.error('   1. API key is invalid or expired');
  console.error('   2. API key doesn\'t have Gemini API access');
  console.error('   3. Network/firewall issue');
  console.error('   4. API key format is incorrect');
}

