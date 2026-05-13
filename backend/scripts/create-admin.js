// Script to create an admin user with hashed password
// Run: node scripts/create-admin.js <username> <password>

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

async function createAdmin() {
  try {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n🔐 Password Hash Generated:');
    console.log(passwordHash);
    console.log('\n📝 SQL to run in Supabase SQL Editor:');
    console.log('----------------------------------------');
    console.log(`INSERT INTO admins (username, password_hash)`);
    console.log(`VALUES ('${username}', '${passwordHash}');`);
    console.log('----------------------------------------\n');
    
    // Optionally insert directly via Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('admins')
      .insert({ username, password_hash: passwordHash })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        console.log('⚠️  Admin user already exists. Use a different username or update the existing one.');
      } else {
        console.error('❌ Error creating admin:', error.message);
      }
    } else {
      console.log('✅ Admin user created successfully!');
      console.log('Username:', data.username);
      console.log('ID:', data.id);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();


