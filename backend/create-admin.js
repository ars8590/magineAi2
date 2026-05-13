require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin rights if needed, or anon if RLS allows

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin(username, password) {
    const passwordHash = bcrypt.hashSync(password, 10);

    // Check if admin exists
    const { data: existing } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .single();

    if (existing) {
        console.log(`Admin '${username}' already exists.`);
        return;
    }

    const { data, error } = await supabase
        .from('admins')
        .insert({
            username,
            password_hash: passwordHash,
            role: 'superadmin' // Assuming a role column based on typical setups, can remove if not in schema
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating admin:', error);
    } else {
        console.log(`Admin '${username}' created successfully.`);
        console.log(`ID: ${data.id}`);
    }
}

// Default admin
createAdmin('admin', 'admin123');
