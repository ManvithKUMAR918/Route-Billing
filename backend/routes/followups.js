const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all followups (optional filter by status / counsellor)
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM followups';
    const params = [];
    const conditions = [];

    if (req.query.status)     { conditions.push('status = ?');     params.push(req.query.status); }
    if (req.query.counsellor) { conditions.push('counsellor = ?'); params.push(req.query.counsellor); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('Followups GET error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST log a new followup
router.post('/', async (req, res) => {
  const { enquiry_id, student_name, counsellor, action_taken, action_type, next_action, next_action_date, priority } = req.body;
  if (!action_taken) {
    return res.status(400).json({ success: false, message: 'Action taken is required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO followups 
        (enquiry_id, student_name, counsellor, action_taken, action_type, status, next_action, next_action_date, priority)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [enquiry_id || null, student_name, counsellor || 'Admin', action_taken, action_type || 'call', next_action || '', next_action_date || null, priority || 'medium']
    );
    const [newRow] = await db.query('SELECT * FROM followups WHERE id = ?', [result.insertId]);
    res.json({ success: true, message: 'Follow-up logged', data: newRow[0] });
  } catch (err) {
    console.error('Followups POST error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update followup status / next action
router.put('/:id', async (req, res) => {
  const { status, action_taken, next_action, next_action_date } = req.body;
  try {
    const fields = [];
    const params = [];
    if (status !== undefined)          { fields.push('status = ?');          params.push(status); }
    if (action_taken !== undefined)    { fields.push('action_taken = ?');    params.push(action_taken); }
    if (next_action !== undefined)     { fields.push('next_action = ?');     params.push(next_action); }
    if (next_action_date !== undefined){ fields.push('next_action_date = ?');params.push(next_action_date || null); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });

    params.push(req.params.id);
    await db.query(`UPDATE followups SET ${fields.join(', ')} WHERE id = ?`, params);
    const [updated] = await db.query('SELECT * FROM followups WHERE id = ?', [req.params.id]);
    if (!updated.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error('Followups PUT error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
