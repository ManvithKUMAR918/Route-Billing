const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendWhatsApp } = require('../services/whatsappService');
const templates = require('../services/messageTemplates');

// 1. GET /api/transport/alert-students
router.get('/alert-students', async (req, res) => {
  try {
    const query = `
      SELECT tf.*, s.name AS student_name 
      FROM transport_fees tf
      JOIN students s ON tf.student_id = s.id
      ORDER BY tf.due_date DESC, tf.id DESC
    `;
    const [rows] = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching alert students:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. POST /api/transport/mark-paid
router.post('/mark-paid', async (req, res) => {
  const { student_id, paid_amount, paid_date } = req.body;
  
  if (!student_id || !paid_amount || !paid_date) {
    return res.status(400).json({ success: false, message: 'Missing student_id, paid_amount, or paid_date' });
  }

  try {
    // Fetch current outstanding fee details
    const [fees] = await db.query(
      `SELECT tf.*, s.name AS student_name, s.class AS student_class 
       FROM transport_fees tf 
       JOIN students s ON tf.student_id = s.id 
       WHERE tf.student_id = ? AND tf.payment_status != 'paid'`,
      [student_id]
    );

    if (fees.length === 0) {
      return res.status(404).json({ success: false, message: 'No outstanding pending/overdue transport fee found for this student.' });
    }

    const fee = fees[0];

    // 1. Update payment status in transport_fees
    await db.query(
      "UPDATE transport_fees SET payment_status = 'paid', last_alert_sent = NOW() WHERE id = ?",
      [fee.id]
    );

    // 2. Add to transport_payments for unified accounting reporting
    const receiptNumber = 'REC_WA_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const monthPaid = new Date(paid_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    await db.query(
      `INSERT INTO transport_payments 
       (student_id, student_name, class, amount_paid, payment_date, payment_mode, month_paid, receipt_number, remarks) 
       VALUES (?, ?, ?, ?, ?, 'online', ?, ?, 'Recorded via WhatsApp Alerts dashboard')`,
      [fee.student_id, fee.student_name, fee.student_class || 'N/A', paid_amount, paid_date, monthPaid, receiptNumber]
    );

    // 3. Trigger confirmation message
    const msg = templates.paymentConfirmedMessage(fee.parent_name, fee.student_name, paid_amount, paid_date);
    const alertResult = await sendWhatsApp(fee.parent_phone, msg);
    
    // Log to whatsapp_logs
    const logStatus = alertResult.success ? 'sent' : 'failed';
    await db.query(
      `INSERT INTO whatsapp_logs 
       (student_id, parent_phone, message_type, message_body, status, sent_at) 
       VALUES (?, ?, 'payment_confirmed', ?, ?, NOW())`,
      [fee.student_id, fee.parent_phone, msg, logStatus]
    );

    res.json({ success: true, message: 'Payment recorded and WhatsApp confirmation sent' });
  } catch (err) {
    console.error('Error marking payment paid:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. POST /api/transport/send-manual-alert
router.post('/send-manual-alert', async (req, res) => {
  const { student_id, alert_type } = req.body;

  if (!student_id || !alert_type) {
    return res.status(400).json({ success: false, message: 'Missing student_id or alert_type' });
  }

  try {
    // Fetch latest transport fee details for this student
    const [fees] = await db.query(
      `SELECT tf.*, s.name AS student_name 
       FROM transport_fees tf 
       JOIN students s ON tf.student_id = s.id 
       WHERE tf.student_id = ? 
       ORDER BY tf.id DESC LIMIT 1`,
      [student_id]
    );

    if (fees.length === 0) {
      return res.status(404).json({ success: false, message: 'No transport fee record found for this student.' });
    }

    const fee = fees[0];
    let msg = '';
    let dbType = 'due_reminder';

    if (alert_type === 'upcoming') {
      msg = templates.upcomingDueMessage(fee.parent_name, fee.student_name, fee.monthly_fee, fee.due_date, fee.route_name);
      dbType = 'due_reminder';
    } else if (alert_type === 'due_today') {
      msg = templates.dueTodayMessage(fee.parent_name, fee.student_name, fee.monthly_fee, fee.route_name);
      dbType = 'payment_due_today';
    } else if (alert_type === 'overdue') {
      msg = templates.overdueMessage(fee.parent_name, fee.student_name, fee.monthly_fee, fee.due_date, fee.route_name);
      dbType = 'overdue_alert';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid alert_type. Options: upcoming, due_today, overdue' });
    }

    // Send alert
    const alertResult = await sendWhatsApp(fee.parent_phone, msg);
    
    // Update last alert sent
    await db.query('UPDATE transport_fees SET last_alert_sent = NOW() WHERE id = ?', [fee.id]);

    // Log alert status
    const logStatus = alertResult.success ? 'sent' : 'failed';
    await db.query(
      `INSERT INTO whatsapp_logs 
       (student_id, parent_phone, message_type, message_body, status, sent_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [fee.student_id, fee.parent_phone, dbType, msg, logStatus]
    );

    res.json({ success: true, message: `WhatsApp ${alert_type} alert sent successfully` });
  } catch (err) {
    console.error('Error sending manual alert:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. GET /api/transport/alert-logs
router.get('/alert-logs', async (req, res) => {
  const { student_id } = req.query;
  try {
    let query = `
      SELECT wl.*, s.name AS student_name 
      FROM whatsapp_logs wl
      JOIN students s ON wl.student_id = s.id
    `;
    const params = [];

    if (student_id) {
      query += ` WHERE wl.student_id = ?`;
      params.push(student_id);
    }

    query += ` ORDER BY wl.sent_at DESC LIMIT 50`;

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching alert logs:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
