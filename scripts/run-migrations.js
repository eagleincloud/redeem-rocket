import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigrations() {
  const client = await pool.connect();
  try {
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    
    // Read migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && (f.includes('20240020') || f.includes('20240021')))
      .sort();

    console.log(`Found ${migrationFiles.length} migrations to run:`);
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      console.log(`\n▶ Running: ${file}`);
      try {
        await client.query(sql);
        console.log(`✓ ${file} completed successfully`);
      } catch (err) {
        console.error(`✗ ${file} failed:`, err.message);
        throw err;
      }
    }
    
    console.log('\n✓ All migrations completed successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
