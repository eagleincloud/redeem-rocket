import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  connectionString: 'postgresql://postgres:417BajrangNagar%401@db.eomqkeoozxnttqizstzk.supabase.co:5432/postgres',
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    const migrationPath = path.join(__dirname, 'supabase/migrations/20260416_growth_platform.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 20260416_growth_platform.sql');
    await client.query(migrationSql);

    console.log('\n✓ Migration completed successfully!\n');
    console.log('Created tables:');
    console.log('  ✓ email_provider_configs');
    console.log('  ✓ email_sequences');
    console.log('  ✓ social_accounts');
    console.log('  ✓ social_posts');
    console.log('  ✓ automation_rules');
    console.log('  ✓ lead_connectors');
    console.log('\nAll tables include:');
    console.log('  • UUID primary keys with gen_random_uuid()');
    console.log('  • RLS policies for business_id isolation');
    console.log('  • Optimized indexes for queries');
    console.log('  • Timestamps (created_at, updated_at)');
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
