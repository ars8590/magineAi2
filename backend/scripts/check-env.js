// Script to check if all required environment variables are set
// Run: node scripts/check-env.js

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const requiredVars = {
  'PORT': process.env.PORT || '4000 (default)',
  'JWT_SECRET': process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
  'SUPABASE_URL': process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
  'GEMINI_API_KEY': process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing',
  'IMAGEN_API_KEY': process.env.IMAGEN_API_KEY ? '✅ Set (optional)' : '⚠️  Not set (optional)',
  'CORS_ORIGINS': process.env.CORS_ORIGINS || 'http://localhost:3000 (default)'
};

console.log('\n📋 Environment Variables Check:\n');
console.log('----------------------------------------');

let hasErrors = false;

for (const [key, value] of Object.entries(requiredVars)) {
  const status = value.includes('❌') ? '❌' : value.includes('⚠️') ? '⚠️' : '✅';
  console.log(`${status} ${key.padEnd(30)} ${value}`);
  if (value.includes('❌')) {
    hasErrors = true;
  }
}

console.log('----------------------------------------\n');

if (hasErrors) {
  console.log('❌ Some required environment variables are missing!');
  console.log('📝 Please check your backend/.env file and add the missing variables.\n');
  console.log('Required variables:');
  console.log('  - JWT_SECRET (generate with: npm run generate-jwt)');
  console.log('  - SUPABASE_URL (from Supabase dashboard)');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard)');
  console.log('  - GEMINI_API_KEY (from https://makersuite.google.com/app/apikey)\n');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!\n');
  
  // Show values (masked for security)
  if (process.env.SUPABASE_URL) {
    console.log('Supabase URL:', process.env.SUPABASE_URL);
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('Supabase Key:', key.substring(0, 20) + '...' + key.substring(key.length - 10));
  }
  if (process.env.GEMINI_API_KEY) {
    const key = process.env.GEMINI_API_KEY;
    console.log('Gemini Key:', key.substring(0, 10) + '...' + key.substring(key.length - 5));
  }
  console.log('');
}



