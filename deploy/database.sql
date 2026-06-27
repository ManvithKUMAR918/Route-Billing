
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `admissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `academic_year` varchar(20) DEFAULT '2026-27',
  `admission_date` date DEFAULT NULL,
  `class` varchar(50) DEFAULT NULL,
  `section` varchar(20) DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `admissions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `admissions` WRITE;
/*!40000 ALTER TABLE `admissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `admissions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `allergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allergies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `allergen` varchar(100) NOT NULL,
  `severity` enum('mild','moderate','severe') DEFAULT 'mild',
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `allergies_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `allergies` WRITE;
/*!40000 ALTER TABLE `allergies` DISABLE KEYS */;
/*!40000 ALTER TABLE `allergies` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late','excused') DEFAULT 'present',
  `marked_by` int DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `marked_by` (`marked_by`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`marked_by`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `centres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `centres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `address` text,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `principal_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `centres` WRITE;
/*!40000 ALTER TABLE `centres` DISABLE KEYS */;
INSERT INTO `centres` VALUES (1,'FirstCry Intellitots Pune','FC Road, Pune 411004','020-12345678','info@firstcryintellitots.com','Mrs. Sharma','2026-06-10 09:22:05');
/*!40000 ALTER TABLE `centres` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `classroom_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classroom_students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `classroom_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `classroom_id` (`classroom_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `classroom_students_ibfk_1` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`),
  CONSTRAINT `classroom_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `classroom_students` WRITE;
/*!40000 ALTER TABLE `classroom_students` DISABLE KEYS */;
/*!40000 ALTER TABLE `classroom_students` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `classrooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classrooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `class` varchar(50) DEFAULT NULL,
  `section` varchar(20) DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `capacity` int DEFAULT '30',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `classrooms_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `classrooms` WRITE;
/*!40000 ALTER TABLE `classrooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `classrooms` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `communication_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `communication_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `type` enum('call','sms','whatsapp','email','meeting','note') DEFAULT 'call',
  `direction` enum('inbound','outbound') DEFAULT 'outbound',
  `summary` text,
  `outcome` varchar(200) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `communication_history_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  CONSTRAINT `communication_history_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `communication_history` WRITE;
/*!40000 ALTER TABLE `communication_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `communication_history` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `curriculum_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curriculum_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `lesson_plan_id` int DEFAULT NULL,
  `activity_name` varchar(200) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `skill_area` varchar(100) DEFAULT NULL,
  `outcome` text,
  `rating` enum('excellent','good','satisfactory','needs_improvement') DEFAULT 'good',
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `lesson_plan_id` (`lesson_plan_id`),
  CONSTRAINT `curriculum_activities_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `curriculum_activities_ibfk_2` FOREIGN KEY (`lesson_plan_id`) REFERENCES `lesson_plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `curriculum_activities` WRITE;
/*!40000 ALTER TABLE `curriculum_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `curriculum_activities` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `enquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enquiries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(100) NOT NULL,
  `parent_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `class` varchar(50) DEFAULT NULL,
  `address` text,
  `route_requested` varchar(100) DEFAULT NULL,
  `source` enum('parent_portal','teacher_dashboard','centre_admin','counsellor','phone_call','walk_in') DEFAULT 'parent_portal',
  `status` enum('pending','in_progress','resolved') DEFAULT 'pending',
  `owner` varchar(100) DEFAULT 'Admin',
  `priority` enum('high','medium','low') DEFAULT 'medium',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `enquiries` WRITE;
/*!40000 ALTER TABLE `enquiries` DISABLE KEYS */;
INSERT INTO `enquiries` VALUES (1,'New Student - Isha Roy','Amit Roy','9876540001','amit@email.com','Grade 1',NULL,'Route A - North','parent_portal','resolved','Admin','high',NULL,'2026-06-10 09:22:06','2026-06-16 07:44:41'),(2,'New Student - Sam Menon','Rajan Menon','9876540002','rajan@email.com','Grade 2',NULL,'Route B - South','teacher_dashboard','in_progress','Ms. Priya','medium',NULL,'2026-06-10 09:22:06','2026-06-10 09:22:06');
/*!40000 ALTER TABLE `enquiries` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` enum('Fuel','Driver Salary','Maintenance','Insurance','Tolls & Parking','Cleaning','Other') NOT NULL,
  `description` text NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `route` varchar(100) DEFAULT NULL,
  `vendor` varchar(100) DEFAULT NULL,
  `approved_by` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,'Fuel','Route A diesel fill',2500.00,'2026-06-01','Route A - North',NULL,'Admin',NULL,'2026-06-10 09:22:06'),(2,'Maintenance','Bus MH12AB1234 service',1800.00,'2026-06-03','All Routes',NULL,'Centre Head',NULL,'2026-06-10 09:22:06'),(3,'Driver Salary','Ramu Yadav - June',8000.00,'2026-06-01','Route A - North',NULL,'Admin',NULL,'2026-06-10 09:22:06'),(4,'Driver Salary','Sham Kumar - June',8000.00,'2026-06-01','Route B - South',NULL,'Admin',NULL,'2026-06-10 09:22:06'),(5,'Fuel','Route B diesel fill',2200.00,'2026-06-05','Route B - South',NULL,'Admin',NULL,'2026-06-10 09:22:06');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `fees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `fee_type` varchar(100) DEFAULT 'transport',
  `amount` decimal(10,2) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `paid_date` date DEFAULT NULL,
  `status` enum('pending','paid','overdue','waived') DEFAULT 'pending',
  `receipt_no` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `fees_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `fees` WRITE;
/*!40000 ALTER TABLE `fees` DISABLE KEYS */;
/*!40000 ALTER TABLE `fees` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `followups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `followups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `enquiry_id` int DEFAULT NULL,
  `student_name` varchar(100) DEFAULT NULL,
  `counsellor` varchar(100) DEFAULT NULL,
  `action_taken` text NOT NULL,
  `action_type` enum('call','message','meeting','email','admin') DEFAULT 'call',
  `status` enum('pending','completed') DEFAULT 'pending',
  `next_action` text,
  `next_action_date` date DEFAULT NULL,
  `priority` enum('high','medium','low') DEFAULT 'medium',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `enquiry_id` (`enquiry_id`),
  CONSTRAINT `followups_ibfk_1` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `followups` WRITE;
/*!40000 ALTER TABLE `followups` DISABLE KEYS */;
/*!40000 ALTER TABLE `followups` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `lesson_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lesson_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `classroom_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `week_of` date DEFAULT NULL,
  `objectives` text,
  `activities` text,
  `materials` text,
  `status` enum('draft','approved','completed') DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `classroom_id` (`classroom_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `lesson_plans_ibfk_1` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`),
  CONSTRAINT `lesson_plans_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `lesson_plans` WRITE;
/*!40000 ALTER TABLE `lesson_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `lesson_plans` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `meals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `date` date DEFAULT NULL,
  `meal_type` enum('breakfast','snack','lunch','afternoon_snack') DEFAULT 'lunch',
  `food_items` text,
  `quantity_eaten` enum('all','most','half','little','none') DEFAULT 'all',
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `meals_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `meals` WRITE;
/*!40000 ALTER TABLE `meals` DISABLE KEYS */;
/*!40000 ALTER TABLE `meals` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipient` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `student_name` varchar(100) DEFAULT NULL,
  `message_type` enum('reminder','confirmation','overdue_alert','followup') DEFAULT 'reminder',
  `channel` enum('whatsapp','sms','email') DEFAULT 'whatsapp',
  `content` text NOT NULL,
  `status` enum('sent','pending','failed') DEFAULT 'pending',
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(100) DEFAULT 'System',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,'Rajesh Sharma','9876543210','Aarav Sharma','reminder','whatsapp','Dear Rajesh Sir, This is a reminder that transport fee of ├ö├⌐Γòú1500 for June 2026 is due. ├ö├ç├╢ FirstCry Intellitots','sent','2026-06-05 03:30:00','System','2026-06-10 09:22:06'),(2,'Vijay Nair','9876543214','Karan Nair','overdue_alert','sms','URGENT: Transport fee of ├ö├⌐Γòú1800 for Karan Nair (June 2026) is overdue. Please contact us. ├ö├ç├╢ FirstCry Intellitots','sent','2026-06-08 05:00:00','Admin','2026-06-10 09:22:06');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `milestones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `milestone_name` varchar(200) NOT NULL,
  `category` enum('cognitive','social','physical','language','emotional') DEFAULT 'cognitive',
  `achieved_date` date DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `milestones_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `milestones` WRITE;
/*!40000 ALTER TABLE `milestones` DISABLE KEYS */;
/*!40000 ALTER TABLE `milestones` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `parents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text,
  `occupation` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `parents` WRITE;
/*!40000 ALTER TABLE `parents` DISABLE KEYS */;
INSERT INTO `parents` VALUES (1,'Rajesh Sharma','9876543210','rajesh@email.com','MG Road, Pune',NULL,'2026-06-10 09:22:05'),(2,'Mehul Patel','9876543211','mehul@email.com','SB Road, Pune',NULL,'2026-06-10 09:22:05'),(3,'Ravi Gupta','9876543212','ravi@email.com','Camp, Pune',NULL,'2026-06-10 09:22:05'),(4,'Suresh Verma','9876543213','suresh@email.com','Kothrud, Pune',NULL,'2026-06-10 09:22:05'),(5,'Vijay Nair','9876543214','vijay@email.com','Baner, Pune',NULL,'2026-06-10 09:22:05');
/*!40000 ALTER TABLE `parents` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `classroom_id` int DEFAULT NULL,
  `url` text NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `tagged_activity` varchar(100) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `classroom_id` (`classroom_id`),
  CONSTRAINT `photos_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `photos_ibfk_2` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `photos` WRITE;
/*!40000 ALTER TABLE `photos` DISABLE KEYS */;
/*!40000 ALTER TABLE `photos` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `routines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `routines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `date` date DEFAULT NULL,
  `nap_time` varchar(50) DEFAULT NULL,
  `nap_duration_mins` int DEFAULT NULL,
  `mood` enum('happy','neutral','cranky','tired') DEFAULT 'happy',
  `potty_count` int DEFAULT '0',
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `routines_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `routines_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `routines` WRITE;
/*!40000 ALTER TABLE `routines` DISABLE KEYS */;
/*!40000 ALTER TABLE `routines` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admission_no` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `photo_url` text,
  `parent_id` int DEFAULT NULL,
  `class` varchar(50) DEFAULT NULL,
  `section` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive','exit') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admission_no` (`admission_no`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'ADM001','Aarav Sharma','2020-05-15','male',NULL,NULL,1,'Grade 1','A','9876543210','active','2026-06-10 09:22:06'),(2,'ADM002','Priya Patel','2019-08-22','female',NULL,NULL,2,'Grade 2','B','9876543211','active','2026-06-10 09:22:06'),(3,'ADM003','Rohan Gupta','2021-01-10','male',NULL,NULL,3,'Grade 1','A','9876543212','active','2026-06-10 09:22:06'),(4,'ADM004','Sneha Verma','2020-11-30','female',NULL,NULL,4,'Grade 1','B','9876543213','active','2026-06-10 09:22:06'),(5,'ADM005','Karan Nair','2019-07-05','male',NULL,NULL,5,'Grade 2','A','9876543214','active','2026-06-10 09:22:06');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `teacher_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `priority` enum('high','medium','low') DEFAULT 'medium',
  `due_date` date DEFAULT NULL,
  `status` enum('pending','in_progress','done') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `teacher_tasks_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `teacher_tasks` WRITE;
/*!40000 ALTER TABLE `teacher_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `teacher_tasks` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('teacher','admin','centre_head','counsellor') DEFAULT 'teacher',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (1,'Ms. Priya','9800000001','priya@intellitots.com','teacher','2026-06-10 09:22:05'),(2,'Mr. Rahul','9800000002','rahul@intellitots.com','counsellor','2026-06-10 09:22:05'),(3,'Mrs. Sharma','9800000003','sharma@intellitots.com','centre_head','2026-06-10 09:22:05'),(4,'Admin','9800000004','admin@intellitots.com','admin','2026-06-10 09:22:05');
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transport_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `student_name` varchar(100) NOT NULL,
  `class` varchar(50) DEFAULT NULL,
  `route_name` varchar(100) DEFAULT NULL,
  `pickup_point` varchar(200) DEFAULT NULL,
  `drop_point` varchar(200) DEFAULT NULL,
  `monthly_fee` decimal(10,2) NOT NULL,
  `vehicle_no` varchar(30) DEFAULT NULL,
  `driver_name` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `status` enum('active','inactive','exit') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `transport_assignments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transport_assignments` WRITE;
/*!40000 ALTER TABLE `transport_assignments` DISABLE KEYS */;
INSERT INTO `transport_assignments` VALUES (1,1,'Aarav Sharma','Grade 1 A','Route A - North','MG Road Bus Stop','School Gate',1500.00,'MH12AB1234','Ramu Yadav',NULL,'active','2026-06-10 09:22:06'),(2,2,'Priya Patel','Grade 2 B','Route B - South','SB Road Corner','School Gate',1200.00,'MH12CD5678','Sham Kumar',NULL,'active','2026-06-10 09:22:06'),(3,3,'Rohan Gupta','Grade 1 A','Route A - North','Camp Circle','School Gate',1500.00,'MH12AB1234','Ramu Yadav',NULL,'active','2026-06-10 09:22:06'),(4,4,'Sneha Verma','Grade 1 B','Route B - South','Kothrud Stop','School Gate',1200.00,'MH12CD5678','Sham Kumar',NULL,'active','2026-06-10 09:22:06'),(5,5,'Karan Nair','Grade 2 A','Route C - East','Baner Road','School Gate',1800.00,'MH12AB1234','Ramu Yadav',NULL,'inactive','2026-06-10 09:22:06'),(6,NULL,'raghav','1a','bhongir','bus stop','school',1500.00,'TS1028A','ramu','2026-06-16','active','2026-06-16 07:46:42');
/*!40000 ALTER TABLE `transport_assignments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transport_dues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_dues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `student_name` varchar(100) NOT NULL,
  `route_name` varchar(100) DEFAULT NULL,
  `due_amount` decimal(10,2) NOT NULL,
  `due_month` varchar(30) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','partial','paid') DEFAULT 'pending',
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `transport_dues_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transport_dues` WRITE;
/*!40000 ALTER TABLE `transport_dues` DISABLE KEYS */;
INSERT INTO `transport_dues` VALUES (1,4,'Sneha Verma','Route B - South',900.00,'June 2026','2026-06-15','partial',NULL,'2026-06-10 09:22:06'),(2,5,'Karan Nair','Route C - East',1800.00,'June 2026','2026-06-10','pending',NULL,'2026-06-10 09:22:06');
/*!40000 ALTER TABLE `transport_dues` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transport_exits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_exits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `student_name` varchar(100) NOT NULL,
  `class` varchar(50) DEFAULT NULL,
  `admission_no` varchar(30) DEFAULT NULL,
  `parent_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `exit_reason` varchar(200) DEFAULT NULL,
  `exit_date` date NOT NULL,
  `transport_end_date` date DEFAULT NULL,
  `outstanding_dues` decimal(10,2) DEFAULT '0.00',
  `refund_amount` decimal(10,2) DEFAULT '0.00',
  `refund_status` enum('pending','processed') DEFAULT 'pending',
  `recorded_by` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `transport_exits_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transport_exits` WRITE;
/*!40000 ALTER TABLE `transport_exits` DISABLE KEYS */;
INSERT INTO `transport_exits` VALUES (1,5,'Karan Nair','Grade 2 A','ADM005','Vijay Nair','9876543214','Relocated to another city','2026-06-05','2026-06-05',0.00,300.00,'processed','Admin',NULL,'2026-06-10 09:22:06');
/*!40000 ALTER TABLE `transport_exits` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transport_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `student_name` varchar(100) NOT NULL,
  `class` varchar(50) DEFAULT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_mode` enum('cash','online','upi','cheque') DEFAULT 'cash',
  `month_paid` varchar(30) DEFAULT NULL,
  `receipt_number` varchar(50) DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `transport_payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transport_payments` WRITE;
/*!40000 ALTER TABLE `transport_payments` DISABLE KEYS */;
INSERT INTO `transport_payments` VALUES (1,1,'Aarav Sharma','Grade 1 A',1500.00,'2026-06-01','cash','June 2026','REC001',NULL,'2026-06-10 09:22:06'),(2,2,'Priya Patel','Grade 2 B',1200.00,'2026-06-02','online','June 2026','REC002',NULL,'2026-06-10 09:22:06'),(3,3,'Rohan Gupta','Grade 1 A',900.00,'2026-06-03','upi','June 2026','REC003',NULL,'2026-06-10 09:22:06'),(4,4,'Sneha Verma','Grade 1 B',900.00,'2026-06-04','cash','June 2026','REC004',NULL,'2026-06-10 09:22:06');
/*!40000 ALTER TABLE `transport_payments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transport_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_routes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `route_name` varchar(100) NOT NULL,
  `area` varchar(100) DEFAULT NULL,
  `vehicle_id` int DEFAULT NULL,
  `driver_name` varchar(100) DEFAULT NULL,
  `departure_time` time DEFAULT NULL,
  `return_time` time DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `transport_routes_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `transport_vehicles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transport_routes` WRITE;
/*!40000 ALTER TABLE `transport_routes` DISABLE KEYS */;
INSERT INTO `transport_routes` VALUES (1,'Route A - North','MG Road, FC Road area',1,'Ramu Yadav','07:30:00','13:30:00','active'),(2,'Route B - South','SB Road, Kothrud area',2,'Sham Kumar','07:45:00','13:45:00','active'),(3,'Route C - East','Camp, Baner area',1,'Ramu Yadav','08:00:00','14:00:00','active');
/*!40000 ALTER TABLE `transport_routes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transport_vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicle_no` varchar(30) NOT NULL,
  `vehicle_type` varchar(50) DEFAULT 'bus',
  `driver_name` varchar(100) DEFAULT NULL,
  `driver_phone` varchar(20) DEFAULT NULL,
  `capacity` int DEFAULT '30',
  `insurance_expiry` date DEFAULT NULL,
  `last_service_date` date DEFAULT NULL,
  `status` enum('active','inactive','maintenance') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transport_vehicles` WRITE;
/*!40000 ALTER TABLE `transport_vehicles` DISABLE KEYS */;
INSERT INTO `transport_vehicles` VALUES (1,'MH12AB1234','bus','Ramu Yadav','9900000001',30,NULL,NULL,'active','2026-06-10 09:22:06'),(2,'MH12CD5678','bus','Sham Kumar','9900000002',25,NULL,NULL,'active','2026-06-10 09:22:06');
/*!40000 ALTER TABLE `transport_vehicles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

