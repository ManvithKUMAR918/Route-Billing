const express = require('express');
const router = express.Router();
const db = require('../db');

const MESSAGE_TEMPLATES = {
  reminder: (studentName, amount, month) =>
    `Dear Parent, This is a reminder that transport fee of ₹${amount} for ${month} is pending for ${studentName}. Please make the payment at the earliest. — FirstCry Intellitots`,
  confirmation: (studentName, amount, receipt) =>
    `Dear Parent, Payment of ₹${amount} (Receipt: ${receipt}) for ${studentName} has been received. Thank you! — FirstCry Intellitots`,
  overdue_alert: (studentName, amount, month) =>
    `URGENT: Transport fee of ₹${amount} for ${studentName} (${month}) is overdue. Please contact us immediately. — FirstCry Intellitots`,
  followup: (studentName, counsellor) =>
    `Dear Parent, Our counsellor ${counsellor} will be following up regarding ${studentName}'s transport arrangement. Please expect a call. — FirstCry Intellitots`,
};

// GET all messages (optional filter by status / type)
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM messages';
    const params = [];
    const conditions = [];

    if (req.query.status) { conditions.push('status = ?'); params.push(req.query.status); }
    if (req.query.type)   { conditions.push('message_type = ?'); params.push(req.query.type); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('Messages GET error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET message templates list
router.get('/templates', (req, res) => {
  res.json({ success: true, data: Object.keys(MESSAGE_TEMPLATES) });
});

// POST send a manual message
router.post('/', async (req, res) => {
  const { recipient, phone, student_name, message_type, channel, content, created_by } = req.body;
  if (!recipient || !content) {
    return res.status(400).json({ success: false, message: 'Recipient and content are required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO messages (recipient, phone, student_name, message_type, channel, content, status, sent_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'sent', NOW(), ?)`,
      [recipient, phone, student_name, message_type || 'reminder', channel || 'whatsapp', content, created_by || 'Admin']
    );
    const [newRow] = await db.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
    res.json({ success: true, message: 'Message sent successfully', data: newRow[0] });
  } catch (err) {
    console.error('Messages POST error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST auto-generate reminders for all pending/partial dues
router.post('/auto-generate', async (req, res) => {
  const { type } = req.body;
  try {
    // Fetch all dues that are not paid
    const [dues] = await db.query(
      `SELECT td.*, s.phone AS student_phone, p.name AS parent_name, p.phone AS parent_phone
       FROM transport_dues td
       LEFT JOIN students s ON td.student_id = s.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE td.status != 'paid'`
    );

    if (!dues.length) {
      return res.json({ success: true, message: 'No pending dues to generate reminders for.', data: [] });
    }

    const generated = [];
    for (const due of dues) {
      const msgType = type || (due.status === 'pending' && new Date(due.due_date) < new Date() ? 'overdue_alert' : 'reminder');
      const content = msgType === 'overdue_alert'
        ? MESSAGE_TEMPLATES.overdue_alert(due.student_name, due.due_amount, due.due_month)
        : MESSAGE_TEMPLATES.reminder(due.student_name, due.due_amount, due.due_month);

      const recipient = due.parent_name || 'Parent';
      const phone     = due.parent_phone || due.student_phone || '';

      const [result] = await db.query(
        `INSERT INTO messages (recipient, phone, student_name, message_type, channel, content, status, sent_at, created_by)
         VALUES (?, ?, ?, ?, 'whatsapp', ?, 'sent', NOW(), 'System')`,
        [recipient, phone, due.student_name, msgType, content]
      );
      const [newRow] = await db.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
      generated.push(newRow[0]);
    }

    res.json({ success: true, message: `${generated.length} reminders generated and sent!`, data: generated });
  } catch (err) {
    console.error('Auto-generate error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
