import bcrypt from 'bcryptjs';
import https from 'https';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eomqkeoozxnttqizstzk.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbXFrZW9venhudHRxaXpzdHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzMyODgsImV4cCI6MjA4ODEwOTI4OH0.awCBjq0gvjLEgRXJ3OGnTGRJOfevjIgzi8Hd14Nya6M';

// Hash password using bcryptjs (same method as passwordUtils.ts)
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function createAdminUser() {
  console.log('🚀 Creating admin user...\n');

  const email = 'admin@example.com';
  const password = 'Admin@123';
  const name = 'Administrator';
  const role = 'super_admin';
  const status = 'active';

  try {
    // Hash password using bcryptjs
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
            console.log('🌐 Access admin portal at: https://www.redeemrocket.in/admin');
            console.log('   or locally: http://localhost:5173/admin\n');
            console.log('ℹ️  Note: Using bcryptjs hashing (compatible with app auth)');
          } else if (res.statusCode === 409) {
            console.log('⚠️  Admin user already exists');
            console.log(`   Email: ${email}\n`);
            console.log('📝 Login Credentials:');
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}\n`);
            console.log('💡 If login fails, delete the user from Supabase and run this script again.');
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
