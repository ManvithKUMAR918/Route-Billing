-- =============================================================
-- Transport Fee & Route Billing System — Full Database Schema
-- FirstCry Intellitots | Day 9 Deliverable
-- Covers: children, parents, admissions, enquiries, classrooms,
-- attendance, routines, allergies, meals, photos, lesson plans,
-- curriculum activities, milestones, teacher tasks, feedback,
-- fees, occupancy, transport, supplies, communication history
-- =============================================================

-- Drop existing tables (safe reset)
DROP TABLE IF EXISTS communication_history;
DROP TABLE IF EXISTS followups;
DROP TABLE IF EXISTS enquiries;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS transport_dues;
DROP TABLE IF EXISTS transport_payments;
DROP TABLE IF EXISTS transport_exits;
DROP TABLE IF EXISTS transport_assignments;
DROP TABLE IF EXISTS transport_routes;
DROP TABLE IF EXISTS transport_vehicles;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS fees;
DROP TABLE IF EXISTS teacher_tasks;
DROP TABLE IF EXISTS milestones;
DROP TABLE IF EXISTS curriculum_activities;
DROP TABLE IF EXISTS lesson_plans;
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS meals;
DROP TABLE IF EXISTS allergies;
DROP TABLE IF EXISTS routines;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS classroom_students;
DROP TABLE IF EXISTS classrooms;
DROP TABLE IF EXISTS admissions;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS parents;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS centres;

-- =============================================================
-- CORE SETUP
-- =============================================================

CREATE TABLE centres (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  principal_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  occupation VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teachers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  role ENUM('teacher', 'admin', 'centre_head', 'counsellor') DEFAULT 'teacher',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- STUDENTS & ADMISSIONS
-- =============================================================

CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admission_no VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  dob DATE,
  gender ENUM('male', 'female', 'other'),
  blood_group VARCHAR(10),
  photo_url TEXT,
  parent_id INT,
  class VARCHAR(50),
  section VARCHAR(20),
  phone VARCHAR(20),
  status ENUM('active', 'inactive', 'exit') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL
);

CREATE TABLE admissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  academic_year VARCHAR(20) DEFAULT '2026-27',
  admission_date DATE,
  class VARCHAR(50),
  section VARCHAR(20),
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- =============================================================
-- CLASSROOMS & ATTENDANCE
-- =============================================================

CREATE TABLE classrooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  class VARCHAR(50),
  section VARCHAR(20),
  teacher_id INT,
  capacity INT DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

CREATE TABLE classroom_students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  classroom_id INT,
  student_id INT,
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'present',
  marked_by INT,
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (marked_by) REFERENCES teachers(id)
);

-- =============================================================
-- HEALTH & DAILY ROUTINES
-- =============================================================

CREATE TABLE allergies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  allergen VARCHAR(100) NOT NULL,
  severity ENUM('mild', 'moderate', 'severe') DEFAULT 'mild',
  notes TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE routines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  date DATE,
  nap_time VARCHAR(50),
  nap_duration_mins INT,
  mood ENUM('happy', 'neutral', 'cranky', 'tired') DEFAULT 'happy',
  potty_count INT DEFAULT 0,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (created_by) REFERENCES teachers(id)
);

CREATE TABLE meals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  date DATE,
  meal_type ENUM('breakfast', 'snack', 'lunch', 'afternoon_snack') DEFAULT 'lunch',
  food_items TEXT,
  quantity_eaten ENUM('all', 'most', 'half', 'little', 'none') DEFAULT 'all',
  notes VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- =============================================================
-- LEARNING & CURRICULUM
-- =============================================================

CREATE TABLE lesson_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  classroom_id INT,
  teacher_id INT,
  title VARCHAR(200) NOT NULL,
  subject VARCHAR(100),
  week_of DATE,
  objectives TEXT,
  activities TEXT,
  materials TEXT,
  status ENUM('draft', 'approved', 'completed') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE curriculum_activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  lesson_plan_id INT,
  activity_name VARCHAR(200),
  date DATE,
  skill_area VARCHAR(100),
  outcome TEXT,
  rating ENUM('excellent', 'good', 'satisfactory', 'needs_improvement') DEFAULT 'good',
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id)
);

CREATE TABLE milestones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  milestone_name VARCHAR(200) NOT NULL,
  category ENUM('cognitive', 'social', 'physical', 'language', 'emotional') DEFAULT 'cognitive',
  achieved_date DATE,
  notes TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  classroom_id INT,
  url TEXT NOT NULL,
  caption VARCHAR(255),
  tagged_activity VARCHAR(100),
  date DATE,
  uploaded_by INT,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
);

-- =============================================================
-- TEACHER TASKS & FEEDBACK
-- =============================================================

CREATE TABLE teacher_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id INT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
  due_date DATE,
  status ENUM('pending', 'in_progress', 'done') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- =============================================================
-- TRANSPORT MODULE (PRIMARY)
-- =============================================================

CREATE TABLE transport_vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_no VARCHAR(30) NOT NULL,
  vehicle_type VARCHAR(50) DEFAULT 'bus',
  driver_name VARCHAR(100),
  driver_phone VARCHAR(20),
  capacity INT DEFAULT 30,
  insurance_expiry DATE,
  last_service_date DATE,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transport_routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_name VARCHAR(100) NOT NULL,
  area VARCHAR(100),
  vehicle_id INT,
  driver_name VARCHAR(100),
  departure_time TIME,
  return_time TIME,
  status ENUM('active', 'inactive') DEFAULT 'active',
  FOREIGN KEY (vehicle_id) REFERENCES transport_vehicles(id)
);

CREATE TABLE transport_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  student_name VARCHAR(100) NOT NULL,
  class VARCHAR(50),
  route_name VARCHAR(100),
  pickup_point VARCHAR(200),
  drop_point VARCHAR(200),
  monthly_fee DECIMAL(10,2) NOT NULL,
  vehicle_no VARCHAR(30),
  driver_name VARCHAR(100),
  start_date DATE,
  status ENUM('active', 'inactive', 'exit') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE transport_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  student_name VARCHAR(100) NOT NULL,
  class VARCHAR(50),
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode ENUM('cash', 'online', 'upi', 'cheque') DEFAULT 'cash',
  month_paid VARCHAR(30),
  receipt_number VARCHAR(50),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE transport_dues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  student_name VARCHAR(100) NOT NULL,
  route_name VARCHAR(100),
  due_amount DECIMAL(10,2) NOT NULL,
  due_month VARCHAR(30),
  due_date DATE,
  status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE transport_exits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  student_name VARCHAR(100) NOT NULL,
  class VARCHAR(50),
  admission_no VARCHAR(30),
  parent_name VARCHAR(100),
  phone VARCHAR(20),
  exit_reason VARCHAR(200),
  exit_date DATE NOT NULL,
  transport_end_date DATE,
  outstanding_dues DECIMAL(10,2) DEFAULT 0,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_status ENUM('pending', 'processed') DEFAULT 'pending',
  recorded_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- =============================================================
-- FEES & EXPENSES
-- =============================================================

CREATE TABLE fees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  fee_type VARCHAR(100) DEFAULT 'transport',
  amount DECIMAL(10,2),
  due_date DATE,
  paid_date DATE,
  status ENUM('pending', 'paid', 'overdue', 'waived') DEFAULT 'pending',
  receipt_no VARCHAR(50),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category ENUM('Fuel', 'Driver Salary', 'Maintenance', 'Insurance', 'Tolls & Parking', 'Cleaning', 'Other') NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  route VARCHAR(100),
  vendor VARCHAR(100),
  approved_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- ENQUIRIES & COMMUNICATION
-- =============================================================

CREATE TABLE enquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_name VARCHAR(100) NOT NULL,
  parent_name VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  class VARCHAR(50),
  address TEXT,
  route_requested VARCHAR(100),
  source ENUM('parent_portal', 'teacher_dashboard', 'centre_admin', 'counsellor', 'phone_call', 'walk_in') DEFAULT 'parent_portal',
  status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
  owner VARCHAR(100) DEFAULT 'Admin',
  priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE followups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enquiry_id INT,
  student_name VARCHAR(100),
  counsellor VARCHAR(100),
  action_taken TEXT NOT NULL,
  action_type ENUM('call', 'message', 'meeting', 'email', 'admin') DEFAULT 'call',
  status ENUM('pending', 'completed') DEFAULT 'pending',
  next_action TEXT,
  next_action_date DATE,
  priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE SET NULL
);

CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient VARCHAR(100),
  phone VARCHAR(20),
  student_name VARCHAR(100),
  message_type ENUM('reminder', 'confirmation', 'overdue_alert', 'followup') DEFAULT 'reminder',
  channel ENUM('whatsapp', 'sms', 'email') DEFAULT 'whatsapp',
  content TEXT NOT NULL,
  status ENUM('sent', 'pending', 'failed') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  created_by VARCHAR(100) DEFAULT 'System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE communication_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  parent_id INT,
  type ENUM('call', 'sms', 'whatsapp', 'email', 'meeting', 'note') DEFAULT 'call',
  direction ENUM('inbound', 'outbound') DEFAULT 'outbound',
  summary TEXT,
  outcome VARCHAR(200),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL
);

-- =============================================================
-- SAMPLE DATA
-- =============================================================

INSERT INTO centres (name, address, phone, email, principal_name)
VALUES ('FirstCry Intellitots Pune', 'FC Road, Pune 411004', '020-12345678', 'info@firstcryintellitots.com', 'Mrs. Sharma');

INSERT INTO parents (name, phone, email, address) VALUES
('Rajesh Sharma', '9876543210', 'rajesh@email.com', 'MG Road, Pune'),
('Mehul Patel', '9876543211', 'mehul@email.com', 'SB Road, Pune'),
('Ravi Gupta', '9876543212', 'ravi@email.com', 'Camp, Pune'),
('Suresh Verma', '9876543213', 'suresh@email.com', 'Kothrud, Pune'),
('Vijay Nair', '9876543214', 'vijay@email.com', 'Baner, Pune');

INSERT INTO teachers (name, phone, email, role) VALUES
('Ms. Priya', '9800000001', 'priya@intellitots.com', 'teacher'),
('Mr. Rahul', '9800000002', 'rahul@intellitots.com', 'counsellor'),
('Mrs. Sharma', '9800000003', 'sharma@intellitots.com', 'centre_head'),
('Admin', '9800000004', 'admin@intellitots.com', 'admin');

INSERT INTO students (admission_no, name, dob, gender, parent_id, class, section, phone) VALUES
('ADM001', 'Aarav Sharma', '2020-05-15', 'male', 1, 'Grade 1', 'A', '9876543210'),
('ADM002', 'Priya Patel', '2019-08-22', 'female', 2, 'Grade 2', 'B', '9876543211'),
('ADM003', 'Rohan Gupta', '2021-01-10', 'male', 3, 'Grade 1', 'A', '9876543212'),
('ADM004', 'Sneha Verma', '2020-11-30', 'female', 4, 'Grade 1', 'B', '9876543213'),
('ADM005', 'Karan Nair', '2019-07-05', 'male', 5, 'Grade 2', 'A', '9876543214');

INSERT INTO transport_vehicles (vehicle_no, driver_name, driver_phone, capacity, status) VALUES
('MH12AB1234', 'Ramu Yadav', '9900000001', 30, 'active'),
('MH12CD5678', 'Sham Kumar', '9900000002', 25, 'active');

INSERT INTO transport_routes (route_name, area, vehicle_id, driver_name, departure_time, return_time) VALUES
('Route A - North', 'MG Road, FC Road area', 1, 'Ramu Yadav', '07:30:00', '13:30:00'),
('Route B - South', 'SB Road, Kothrud area', 2, 'Sham Kumar', '07:45:00', '13:45:00'),
('Route C - East', 'Camp, Baner area', 1, 'Ramu Yadav', '08:00:00', '14:00:00');

INSERT INTO transport_assignments (student_id, student_name, class, route_name, pickup_point, drop_point, monthly_fee, vehicle_no, driver_name, status) VALUES
(1, 'Aarav Sharma', 'Grade 1 A', 'Route A - North', 'MG Road Bus Stop', 'School Gate', 1500, 'MH12AB1234', 'Ramu Yadav', 'active'),
(2, 'Priya Patel', 'Grade 2 B', 'Route B - South', 'SB Road Corner', 'School Gate', 1200, 'MH12CD5678', 'Sham Kumar', 'active'),
(3, 'Rohan Gupta', 'Grade 1 A', 'Route A - North', 'Camp Circle', 'School Gate', 1500, 'MH12AB1234', 'Ramu Yadav', 'active'),
(4, 'Sneha Verma', 'Grade 1 B', 'Route B - South', 'Kothrud Stop', 'School Gate', 1200, 'MH12CD5678', 'Sham Kumar', 'active'),
(5, 'Karan Nair', 'Grade 2 A', 'Route C - East', 'Baner Road', 'School Gate', 1800, 'MH12AB1234', 'Ramu Yadav', 'inactive');

INSERT INTO transport_payments (student_id, student_name, class, amount_paid, payment_date, payment_mode, month_paid, receipt_number) VALUES
(1, 'Aarav Sharma', 'Grade 1 A', 1500, '2026-06-01', 'cash', 'June 2026', 'REC001'),
(2, 'Priya Patel', 'Grade 2 B', 1200, '2026-06-02', 'online', 'June 2026', 'REC002'),
(3, 'Rohan Gupta', 'Grade 1 A', 900, '2026-06-03', 'upi', 'June 2026', 'REC003'),
(4, 'Sneha Verma', 'Grade 1 B', 900, '2026-06-04', 'cash', 'June 2026', 'REC004');

INSERT INTO transport_dues (student_id, student_name, route_name, due_amount, due_month, due_date, status) VALUES
(4, 'Sneha Verma', 'Route B - South', 900, 'June 2026', '2026-06-15', 'partial'),
(5, 'Karan Nair', 'Route C - East', 1800, 'June 2026', '2026-06-10', 'pending');

INSERT INTO transport_exits (student_id, student_name, class, admission_no, parent_name, phone, exit_reason, exit_date, transport_end_date, outstanding_dues, refund_amount, refund_status, recorded_by)
VALUES (5, 'Karan Nair', 'Grade 2 A', 'ADM005', 'Vijay Nair', '9876543214', 'Relocated to another city', '2026-06-05', '2026-06-05', 0, 300, 'processed', 'Admin');

INSERT INTO expenses (category, description, amount, date, route, approved_by) VALUES
('Fuel', 'Route A diesel fill', 2500, '2026-06-01', 'Route A - North', 'Admin'),
('Maintenance', 'Bus MH12AB1234 service', 1800, '2026-06-03', 'All Routes', 'Centre Head'),
('Driver Salary', 'Ramu Yadav - June', 8000, '2026-06-01', 'Route A - North', 'Admin'),
('Driver Salary', 'Sham Kumar - June', 8000, '2026-06-01', 'Route B - South', 'Admin'),
('Fuel', 'Route B diesel fill', 2200, '2026-06-05', 'Route B - South', 'Admin');

INSERT INTO enquiries (student_name, parent_name, phone, email, class, route_requested, source, status, owner, priority) VALUES
('New Student - Isha Roy', 'Amit Roy', '9876540001', 'amit@email.com', 'Grade 1', 'Route A - North', 'parent_portal', 'pending', 'Admin', 'high'),
('New Student - Sam Menon', 'Rajan Menon', '9876540002', 'rajan@email.com', 'Grade 2', 'Route B - South', 'teacher_dashboard', 'in_progress', 'Ms. Priya', 'medium');

INSERT INTO messages (recipient, phone, student_name, message_type, channel, content, status, sent_at, created_by) VALUES
('Rajesh Sharma', '9876543210', 'Aarav Sharma', 'reminder', 'whatsapp', 'Dear Rajesh Sir, This is a reminder that transport fee of ₹1500 for June 2026 is due. — FirstCry Intellitots', 'sent', '2026-06-05 09:00:00', 'System'),
('Vijay Nair', '9876543214', 'Karan Nair', 'overdue_alert', 'sms', 'URGENT: Transport fee of ₹1800 for Karan Nair (June 2026) is overdue. Please contact us. — FirstCry Intellitots', 'sent', '2026-06-08 10:30:00', 'Admin');

-- =============================================================
-- WHATSAPP AUTO-ALERTS SYSTEM
-- =============================================================

CREATE TABLE IF NOT EXISTS transport_fees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  parent_name VARCHAR(100),
  parent_phone VARCHAR(15),
  route_name VARCHAR(100),
  pickup_point VARCHAR(100),
  drop_point VARCHAR(100),
  monthly_fee DECIMAL(10,2),
  due_date DATE,
  payment_status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  last_alert_sent DATETIME,
  created_at DATETIME DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  parent_phone VARCHAR(15),
  message_type VARCHAR(50),
  message_body TEXT,
  status ENUM('sent', 'failed'),
  sent_at DATETIME DEFAULT NOW()
);

