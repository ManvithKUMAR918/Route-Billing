const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/messages ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { message_type, status } = req.query;
    let sql = 'SELECT * FROM fc_messages';
    const conditions = [];
    const params = [];
    if (message_type) { conditions.push('message_type = ?'); params.push(message_type); }
    if (status)       { conditions.push('status = ?');       params.push(status); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY sent_at DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /messages:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/messages ──────────────────────────────────────
router.post('/', async (req, res) => {
  const { student_name, parent_name, phone, message_type, message_body, sent_by } = req.body;

  if (!message_type) {
    return res.status(400).json({ success: false, message: 'Message type is required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO fc_messages (student_name, parent_name, phone, message_type, message_body, status, sent_by)
       VALUES (?, ?, ?, ?, ?, 'Sent', ?)`,
      [
        student_name || '', parent_name || '', phone || '',
        message_type, message_body || '',
        sent_by || 'Admin',
      ]
    );
    res.status(201).json({ success: true, message: 'Message sent successfully', id: result.insertId });
  } catch (err) {
    console.error('POST /messages:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/messages/auto-generate ───────────────────────
// Auto-generate payment reminders for all students with pending dues
router.post('/auto-generate', async (req, res) => {
  try {
    // Get all students with pending/partial dues
    const [pending] = await db.query(
      `SELECT d.student_name, d.route_name, d.due_amount, d.due_month, d.due_date, d.status
       FROM fc_dues d WHERE d.status != 'paid' ORDER BY d.due_date ASC`
    );

    if (pending.length === 0) {
      return res.json({ success: true, message: 'No pending dues found', count: 0 });
    }

    // Insert a message for each pending student
    const inserts = pending.map(d => [
      d.student_name,
      '',
      '',
      'Payment Reminder',
      `Dear Parent, your transport fee of ₹${d.due_amount} for ${d.due_month} is pending. Please pay at the earliest. Route: ${d.route_name || 'N/A'}`,
      'Sent',
      'System',
    ]);

    for (const vals of inserts) {
      await db.query(
        `INSERT INTO fc_messages (student_name, parent_name, phone, message_type, message_body, status, sent_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        vals
      );
    }

    res.json({ success: true, message: `${pending.length} reminders generated`, count: pending.length });
  } catch (err) {
    console.error('POST /messages/auto-generate:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
