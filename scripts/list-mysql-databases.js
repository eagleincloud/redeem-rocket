/**
 * List all databases on the MySQL server.
 * Usage: node scripts/list-mysql-databases.js
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const config = {
  host: process.env.MYSQL_HOST || 'hrms-db.comb9vkzwyzp.us-east-1.rds.amazonaws.com',
  user: process.env.MYSQL_USER || 'admin',
  password: process.env.MYSQL_PASSWORD || 'EIC12345',
  database: process.env.MYSQL_DATABASE || 'employee_conduct',
  port: Number(process.env.MYSQL_PORT || '3306'),
  charset: 'utf8mb4',
};

const conn = await mysql.createConnection(config);
const [rows] = await conn.query('SHOW DATABASES');
await conn.end();

console.log('Databases on', config.host + ':\n');
rows.forEach((r) => console.log('  -', r.Database));
console.log('\nTotal:', rows.length);
