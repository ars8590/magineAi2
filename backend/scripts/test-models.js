// Script to test which Gemini models are available
// Run: node scripts/test-models.js

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

const genAI = new GoogleGenerativeAI(apiKey);

// List of models to test
const modelsToTest = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
  'models/gemini-pro',
  'models/gemini-1.5-pro'
];

console.log('🔍 Testing available Gemini models...\n');

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say "Hello" in one word.');
    const response = await result.response;
    const text = response.text();
    console.log(`✅ ${modelName} - WORKS!`);
    return true;
  } catch (error) {
    if (error.status === 404) {
      console.log(`❌ ${modelName} - Not found (404)`);
    } else {
      console.log(`⚠️  ${modelName} - Error: ${error.message}`);
    }
    return false;
  }
}

async function testAllModels() {
  const workingModels = [];
  
  for (const modelName of modelsToTest) {
    const works = await testModel(modelName);
    if (works) {
      workingModels.push(modelName);
    }
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Summary:');
  if (workingModels.length > 0) {
    console.log('✅ Working models:');
    workingModels.forEach(model => console.log(`   - ${model}`));
    console.log(`\n💡 Use one of these models in your code!`);
  } else {
    console.log('❌ No models are working. Check your API key and permissions.');
    console.log('   Make sure your API key has access to Gemini API.');
  }
}

testAllModels().catch(console.error);



