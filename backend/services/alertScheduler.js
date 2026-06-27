const cron = require('node-cron');
const db = require('../db');
const { sendWhatsApp } = require('./whatsappService');
const templates = require('./messageTemplates');

// Job 1 - 3 Days Before Due Date (runs daily at 9 AM)
async function sendUpcomingDueReminders() {
  console.log('[Scheduler] Running Job 1: 3 Days Before Due Date Alert check...');
  try {
    const query = `
      SELECT tf.*, s.name AS student_name 
      FROM transport_fees tf 
      JOIN students s ON tf.student_id = s.id 
      WHERE tf.payment_status = 'pending' 
        AND tf.due_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
        AND (tf.last_alert_sent IS NULL OR tf.last_alert_sent < DATE_SUB(NOW(), INTERVAL 24 HOUR))
    `;
    const [fees] = await db.query(query);
    console.log(`[Scheduler] Job 1: Found ${fees.length} students due in 3 days.`);
    
    for (const fee of fees) {
      const msg = templates.upcomingDueMessage(fee.parent_name, fee.student_name, fee.monthly_fee, fee.due_date, fee.route_name);
      const res = await sendWhatsApp(fee.parent_phone, msg);
      
      const status = res.success ? 'sent' : 'failed';
      await db.query('UPDATE transport_fees SET last_alert_sent = NOW() WHERE id = ?', [fee.id]);
      await db.query(
        'INSERT INTO whatsapp_logs (student_id, parent_phone, message_type, message_body, status, sent_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [fee.student_id, fee.parent_phone, 'due_reminder', msg, status]
      );
    }
  } catch (err) {
    console.error('[Scheduler] Job 1 Error:', err.message);
  }
}

// Job 2 - On Due Date (runs daily at 8 AM)
async function sendDueTodayReminders() {
  console.log('[Scheduler] Running Job 2: On Due Date Alert check...');
  try {
    const query = `
      SELECT tf.*, s.name AS student_name 
      FROM transport_fees tf 
      JOIN students s ON tf.student_id = s.id 
      WHERE tf.payment_status = 'pending' 
        AND tf.due_date = CURDATE()
        AND (tf.last_alert_sent IS NULL OR tf.last_alert_sent < DATE_SUB(NOW(), INTERVAL 24 HOUR))
    `;
    const [fees] = await db.query(query);
    console.log(`[Scheduler] Job 2: Found ${fees.length} students due today.`);
    
    for (const fee of fees) {
      const msg = templates.dueTodayMessage(fee.parent_name, fee.student_name, fee.monthly_fee, fee.route_name);
      const res = await sendWhatsApp(fee.parent_phone, msg);
      
      const status = res.success ? 'sent' : 'failed';
      await db.query('UPDATE transport_fees SET last_alert_sent = NOW() WHERE id = ?', [fee.id]);
      await db.query(
        'INSERT INTO whatsapp_logs (student_id, parent_phone, message_type, message_body, status, sent_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [fee.student_id, fee.parent_phone, 'payment_due_today', msg, status]
      );
    }
  } catch (err) {
    console.error('[Scheduler] Job 2 Error:', err.message);
  }
}

// Job 3 - Overdue Check (runs daily at 10 AM)
async function checkOverdueFees() {
  console.log('[Scheduler] Running Job 3: Overdue Check...');
  try {
    await db.query("UPDATE transport_fees SET payment_status = 'overdue' WHERE payment_status = 'pending' AND due_date < CURDATE()");
    
    const query = `
      SELECT tf.*, s.name AS student_name 
      FROM transport_fees tf 
      JOIN students s ON tf.student_id = s.id 
      WHERE tf.payment_status = 'overdue'
        AND (tf.last_alert_sent IS NULL OR tf.last_alert_sent < DATE_SUB(NOW(), INTERVAL 24 HOUR))
    `;
    const [fees] = await db.query(query);
    console.log(`[Scheduler] Job 3: Found ${fees.length} students with overdue fees.`);
    
    for (const fee of fees) {
      const msg = templates.overdueMessage(fee.parent_name, fee.student_name, fee.monthly_fee, fee.due_date, fee.route_name);
      const res = await sendWhatsApp(fee.parent_phone, msg);
      
      const status = res.success ? 'sent' : 'failed';
      await db.query('UPDATE transport_fees SET last_alert_sent = NOW() WHERE id = ?', [fee.id]);
      await db.query(
        'INSERT INTO whatsapp_logs (student_id, parent_phone, message_type, message_body, status, sent_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [fee.student_id, fee.parent_phone, 'overdue_alert', msg, status]
      );
    }
  } catch (err) {
    console.error('[Scheduler] Job 3 Error:', err.message);
  }
}

function initScheduler() {
  cron.schedule('0 9 * * *', sendUpcomingDueReminders);
  cron.schedule('0 8 * * *', sendDueTodayReminders);
  cron.schedule('0 10 * * *', checkOverdueFees);
  
  console.log('⏰ WhatsApp alert cron scheduler initialized:');
  console.log('   - 3 Days Before Due Date Reminder (9 AM)');
  console.log('   - Due Today Reminder (8 AM)');
  console.log('   - Overdue Warning Check (10 AM)');
}

module.exports = {
  initScheduler,
  sendUpcomingDueReminders,
  sendDueTodayReminders,
  checkOverdueFees
};
