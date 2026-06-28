require('dotenv').config();
const mysql = require('mysql2/promise');

const TABLES = [
  `CREATE TABLE IF NOT EXISTS fc_enquiries (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    student_name  VARCHAR(100) NOT NULL,
    parent_name   VARCHAR(100),
    phone         VARCHAR(20)  NOT NULL,
    email         VARCHAR(100),
    class         VARCHAR(50),
    address       TEXT,
    route_requested VARCHAR(100),
    source        VARCHAR(50)  DEFAULT 'parent_portal',
    owner         VARCHAR(100) DEFAULT 'Admin',
    notes         TEXT,
    priority      ENUM('high','medium','low') DEFAULT 'medium',
    status        ENUM('pending','in_progress','resolved') DEFAULT 'pending',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_phone  (phone)
  )`,
  `CREATE TABLE IF NOT EXISTS fc_followups (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    student_name     VARCHAR(100) NOT NULL,
    counsellor       VARCHAR(100) DEFAULT 'Admin',
    action_taken     TEXT NOT NULL,
    action_type      VARCHAR(50) DEFAULT 'call',
    next_action      TEXT,
    next_action_date DATE,
    priority         ENUM('high','medium','low') DEFAULT 'medium',
    status           ENUM('pending','completed') DEFAULT 'pending',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
  )`,
  `CREATE TABLE IF NOT EXISTS fc_transport (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    student_name VARCHAR(100) NOT NULL,
    class        VARCHAR(50),
    route_name   VARCHAR(100) NOT NULL,
    pickup_point VARCHAR(200),
    drop_point   VARCHAR(200),
    monthly_fee  DECIMAL(10,2) NOT NULL DEFAULT 0,
    vehicle_no   VARCHAR(50),
    driver_name  VARCHAR(100),
    status       ENUM('active','inactive','exit') DEFAULT 'active',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_route  (route_name)
  )`,
  `CREATE TABLE IF NOT EXISTS fc_payments (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    student_name   VARCHAR(100) NOT NULL,
    class          VARCHAR(50),
    amount_paid    DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_date   DATE,
    payment_mode   ENUM('cash','online','upi','cheque') DEFAULT 'cash',
    month_paid     VARCHAR(20),
    receipt_number VARCHAR(30) UNIQUE,
    remarks        TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_month   (month_paid),
    INDEX idx_student (student_name)
  )`,
  `CREATE TABLE IF NOT EXISTS fc_dues (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    student_name VARCHAR(100) NOT NULL,
    route_name   VARCHAR(100),
    due_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
    due_month    VARCHAR(20),
    due_date     DATE,
    remarks      TEXT,
    status       ENUM('pending','partial','paid') DEFAULT 'pending',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status  (status),
    INDEX idx_student (student_name)
  )`,
  `CREATE TABLE IF NOT EXISTS fc_expenses (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    category    VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
    date        DATE NOT NULL,
    route       VARCHAR(100),
    vendor      VARCHAR(200),
    approved_by VARCHAR(100) DEFAULT 'Admin',
    notes       TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_date     (date)
  )`,
  `CREATE TABLE IF NOT EXISTS fc_exits (
    id                 INT PRIMARY KEY AUTO_INCREMENT,
    student_name       VARCHAR(100) NOT NULL,
    class              VARCHAR(50),
    admission_no       VARCHAR(50),
    parent_name        VARCHAR(100),
    phone              VARCHAR(20),
    exit_reason        VARCHAR(200),
    exit_date          DATE,
    transport_end_date DATE,
    outstanding_dues   DECIMAL(10,2) DEFAULT 0,
    refund_amount      DECIMAL(10,2) DEFAULT 0,
    refund_status      ENUM('pending','processed') DEFAULT 'pending',
    recorded_by        VARCHAR(100) DEFAULT 'Admin',
    notes              TEXT,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student (student_name)
  )`,
  `CREATE TABLE IF NOT EXISTS fc_messages (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    student_name VARCHAR(100),
    parent_name  VARCHAR(100),
    phone        VARCHAR(20),
    message_type ENUM('Payment Reminder','Fee Confirmation','Custom') DEFAULT 'Payment Reminder',
    message_body TEXT,
    sent_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status       ENUM('Sent','Failed') DEFAULT 'Sent',
    sent_by      VARCHAR(100) DEFAULT 'Admin',
    INDEX idx_type    (message_type),
    INDEX idx_sent_at (sent_at)
  )`,
];

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  console.log('✅ Connected to Railway MySQL\n');

  for (const sql of TABLES) {
    const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
    const tableName = match ? match[1] : 'unknown';
    try {
      await conn.query(sql);
      console.log(`  ✓ ${tableName} — created/verified`);
    } catch (err) {
      console.error(`  ✗ ${tableName} — ${err.message}`);
    }
  }

  // Verify
  const [tables] = await conn.query("SHOW TABLES LIKE 'fc_%'");
  console.log(`\n🎉 Migration complete! ${tables.length} fc_* tables in database:`);
  tables.forEach(t => console.log('   -', Object.values(t)[0]));

  await conn.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
