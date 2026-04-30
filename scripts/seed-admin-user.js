/**
 * Seed admin user to Supabase
 * Run: node scripts/seed-admin-user.js
 */

import crypto from 'crypto';
import https from 'https';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eomqkeoozxnttqizstzk.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbXFrZW9venhudHRxaXpzdHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzMyODgsImV4cCI6MjA4ODEwOTI4OH0.awCBjq0gvjLEgRXJ3OGnTGRJOfevjIgzi8Hd14Nya6M';

// Simple bcrypt-like hash function for demonstration
// In production, use bcryptjs
async function hashPassword(password) {
  // For now, use SHA256 with salt (NOT PRODUCTION READY)
  // In real code, use: bcryptjs.hash(password, 10)
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `$pbkdf2$${salt}$${hash}`;
}

async function createAdminUser() {
  console.log('🚀 Creating admin user...\n');

  const email = 'admin@example.com';
  const password = 'Admin@123';
  const name = 'Administrator';
  const role = 'super_admin';
  const status = 'active';

  try {
    // Hash password
    const passwordHash = await hashPassword(password);

    // Prepare request
    const url = new URL(`${SUPABASE_URL}/rest/v1/admin_users`);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Prefer': 'return=representation'
      }
    };

    const payload = {
      email,
      name,
      password_hash: passwordHash,
      role,
      status,
      created_at: new Date().toISOString()
    };

    // Send request
    console.log('📤 Sending request to Supabase...');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: ${role}\n`);

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Admin user created successfully!\n');
            console.log('📝 Login Credentials:');
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}\n`);
            console.log('🌐 Access admin portal at: https://www.redeemrocket.in/admin/login');
          } else if (res.statusCode === 409) {
            console.log('⚠️  Admin user already exists');
            console.log(`   Email: ${email}\n`);
            console.log('📝 Login Credentials:');
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}\n`);
          } else {
            console.log(`❌ Error: ${res.statusCode}`);
            console.log(data);
          }
        } catch (err) {
          console.error('Error parsing response:', err);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request failed:', err.message);
      console.log('\n💡 Tip: Make sure SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.');
    });

    req.write(JSON.stringify(payload));
    req.end();

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Run
createAdminUser();
