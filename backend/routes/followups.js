const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/followups ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, priority } = req.query;
    let sql = 'SELECT * FROM fc_followups';
    const conditions = [];
    const params = [];
    if (status)   { conditions.push('status = ?');   params.push(status); }
    if (priority) { conditions.push('priority = ?'); params.push(priority); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /followups:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/followups ─────────────────────────────────────
router.post('/', async (req, res) => {
  const { student_name, counsellor, action_taken, action_type,
          next_action, next_action_date, priority } = req.body;

  // Validation
  const errors = {};
  if (!student_name?.trim()) errors.student_name = 'Student name is required';
  if (!action_taken?.trim()) errors.action_taken  = 'Action taken is required';
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO fc_followups
       (student_name, counsellor, action_taken, action_type, next_action, next_action_date, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        student_name.trim(), counsellor || 'Admin',
        action_taken.trim(), action_type || 'call',
        next_action || null,
        next_action_date || null,
        priority || 'medium',
      ]
    );

    // ── STEP 2→3 CONNECTION ─────────────────────────────────
    // If there's a matching pending enquiry for this student,
    // auto-advance it from 'pending' → 'in_progress'
    const [[matchingEnquiry]] = await db.query(
      `SELECT id, status FROM fc_enquiries
       WHERE student_name = ? AND status = 'pending'
       ORDER BY created_at DESC LIMIT 1`,
      [student_name.trim()]
    );
    if (matchingEnquiry) {
      await db.query(
        `UPDATE fc_enquiries SET status = 'in_progress', last_updated = NOW() WHERE id = ?`,
        [matchingEnquiry.id]
      );
    }

    res.status(201).json({ success: true, message: 'Follow-up logged successfully', id: result.insertId });
  } catch (err) {
    console.error('POST /followups:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── PUT /api/followups/:id ──────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, next_action, next_action_date, priority } = req.body;

  const [[record]] = await db.query('SELECT id FROM fc_followups WHERE id = ?', [id]);
  if (!record) return res.status(404).json({ success: false, message: 'Follow-up not found' });

  const updates = { last_updated: new Date() };
  if (status)           updates.status           = status;
  if (next_action)      updates.next_action      = next_action;
  if (next_action_date) updates.next_action_date = next_action_date;
  if (priority)         updates.priority         = priority;

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values     = [...Object.values(updates), id];

  try {
    await db.query(`UPDATE fc_followups SET ${setClauses} WHERE id = ?`, values);
    res.json({ success: true, message: 'Follow-up updated' });
  } catch (err) {
    console.error('PUT /followups/:id:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
