const mysql = require('mysql2/promise');
require('dotenv').config();

// Build pool config — supports both local MySQL and cloud providers
// (PlanetScale, Railway, Aiven, TiDB Cloud, etc.)
const poolConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  database: process.env.DB_NAME     || 'transport_billing',
  port:     parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Cloud MySQL providers (PlanetScale, Railway, Aiven) require SSL.
// Set DB_SSL=true in Vercel environment variables to enable it.
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

// Test the connection on startup (non-fatal — app still boots without DB)
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to MySQL database:', process.env.DB_NAME || 'transport_billing');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.log('⚠️  Check your DB_* environment variables in Vercel.');
  });

module.exports = pool;
