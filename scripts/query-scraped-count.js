/**
 * Query scraped_businesses table: count + 10 sample records.
 * Usage: node scripts/query-scraped-count.js
 * Env: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_PORT (optional)
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';

const config = {
  host: process.env.MYSQL_HOST || 'hrms-db.comb9vkzwyzp.us-east-1.rds.amazonaws.com',
  user: process.env.MYSQL_USER || 'admin',
  password: process.env.MYSQL_PASSWORD || 'EIC12345',
  port: Number(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_DATABASE || 'RedeemRocket',
  charset: 'utf8mb4',
};

async function main() {
  const conn = await mysql.createConnection(config);
  try {
    const [countRows] = await conn.query('SELECT COUNT(*) AS total FROM scraped_businesses');
    const total = countRows[0].total;
    console.log('Table: scraped_businesses');
    console.log('Total records:', total);
    console.log('');

    const [rows] = await conn.query('SELECT * FROM scraped_businesses LIMIT 10');
    console.log('Sample records (10):');
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
