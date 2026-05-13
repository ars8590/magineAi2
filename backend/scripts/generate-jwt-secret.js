// Script to generate a secure JWT secret
// Run: node scripts/generate-jwt-secret.js

import crypto from 'crypto';

// Generate a secure random 64-character hex string
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 Generated JWT Secret:');
console.log('----------------------------------------');
console.log(jwtSecret);
console.log('----------------------------------------\n');
console.log('📝 Add this to your backend/.env file:');
console.log(`JWT_SECRET=${jwtSecret}\n`);


