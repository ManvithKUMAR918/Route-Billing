require('dotenv').config();
const mysql = require('mysql2/promise');

async function addStudentsTable() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  console.log('✅ Connected to Railway MySQL\n');

  const sql = `CREATE TABLE IF NOT EXISTS fc_students (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    name         VARCHAR(100) NOT NULL,
    admission_no VARCHAR(30)  UNIQUE,
    class        VARCHAR(50),
    section      VARCHAR(10)  DEFAULT '',
    phone        VARCHAR(20),
    parent_name  VARCHAR(100),
    email        VARCHAR(100),
    address      TEXT,
    route_name   VARCHAR(100),
    pickup_point VARCHAR(200),
    monthly_fee  DECIMAL(10,2) DEFAULT 0,
    status       ENUM('active','inactive','exit') DEFAULT 'active',
    enquiry_id   INT,
    joined_date  DATE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_name   (name)
  )`;

  try {
    await conn.query(sql);
    console.log('  ✓ fc_students — created/verified');
  } catch (err) {
    console.error('  ✗ fc_students —', err.message);
  }

  const [tables] = await conn.query("SHOW TABLES LIKE 'fc_%'");
  console.log(`\n✅ Total fc_* tables: ${tables.length}`);
  tables.forEach(t => console.log('   -', Object.values(t)[0]));

  await conn.end();
}

addStudentsTable().catch(console.error);
