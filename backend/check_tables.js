require('dotenv').config();
const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
  const [tables] = await conn.query("SHOW TABLES LIKE 'fc_%'");
  console.log('fc_* tables found:', tables.length);
  tables.forEach(t => console.log(' -', Object.values(t)[0]));
  await conn.end();
}
check().catch(console.error);
