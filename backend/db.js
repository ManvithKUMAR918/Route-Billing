const mysql = require('mysql2/promise');
require('dotenv').config();

// Connection pool — handles multiple requests at once
const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'transport_billing',
  port:     parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to MySQL database:', process.env.DB_NAME || 'transport_billing');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.log('⚠️  Backend will use mock data where available.');
  });

module.exports = pool;
