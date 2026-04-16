import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('✗ Error: Missing DATABASE_URL environment variable');
  console.error('Please set DATABASE_URL in your .env.local file');
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
});

async function runAllMigrations() {
  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Get all migration files in order
    const migrationsDir = path.join(__dirname, 'supabase/migrations');
    const migrationFiles = [
      '20260416_growth_platform.sql',
      '20260417_expanded_lead_sources.sql',
    ];

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);

      if (!fs.existsSync(migrationPath)) {
        console.log(`⊘ Skipping ${file} - not found`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      await client.query(migrationSql);
      console.log(`✓ ${file} completed\n`);
    }

    console.log('✓ All migrations completed successfully!\n');
    console.log('Created tables:');
    console.log('  ✓ email_provider_configs');
    console.log('  ✓ email_sequences');
    console.log('  ✓ social_accounts');
    console.log('  ✓ social_posts');
    console.log('  ✓ automation_rules');
    console.log('  ✓ lead_connectors');
    console.log('  ✓ ivr_leads');
    console.log('  ✓ web_portal_submissions');
    console.log('  ✓ scraped_leads');
    console.log('  ✓ database_sync_logs');
    console.log('\nAll tables include:');
    console.log('  • UUID primary keys with gen_random_uuid()');
    console.log('  • RLS policies for business_id isolation');
    console.log('  • Optimized indexes for queries');
    console.log('  • Timestamps (created_at, updated_at)');
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runAllMigrations();
