const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/dues ───────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, due_month, search } = req.query;
    let sql = 'SELECT * FROM fc_dues';
    const conditions = [];
    const params = [];
    if (status)    { conditions.push('status = ?');    params.push(status); }
    if (due_month) { conditions.push('due_month = ?'); params.push(due_month); }
    if (search) {
      conditions.push('(student_name LIKE ? OR route_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY due_date ASC, created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /dues:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/dues ──────────────────────────────────────────
router.post('/', async (req, res) => {
  const { student_name, route_name, due_amount, due_month, due_date, remarks } = req.body;

  if (!student_name?.trim()) {
    return res.status(400).json({ success: false, message: 'Student name is required' });
  }
  if (!due_amount || parseFloat(due_amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Due amount must be greater than 0' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO fc_dues (student_name, route_name, due_amount, due_month, due_date, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        student_name.trim(), route_name || '',
        parseFloat(due_amount),
        due_month || '',
        due_date || null,
        remarks || null,
      ]
    );
    res.status(201).json({ success: true, message: 'Due added', id: result.insertId });
  } catch (err) {
    console.error('POST /dues:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/dues/:id ───────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, due_amount, due_date, remarks } = req.body;

  const [[record]] = await db.query('SELECT id FROM fc_dues WHERE id = ?', [id]);
  if (!record) return res.status(404).json({ success: false, message: 'Due not found' });

  const updates = { last_updated: new Date() };
  if (status)     updates.status     = status;
  if (due_amount) updates.due_amount = parseFloat(due_amount);
  if (due_date)   updates.due_date   = due_date;
  if (remarks !== undefined) updates.remarks = remarks;

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values     = [...Object.values(updates), id];

  try {
    await db.query(`UPDATE fc_dues SET ${setClauses} WHERE id = ?`, values);
    res.json({ success: true, message: 'Due updated' });
  } catch (err) {
    console.error('PUT /dues/:id:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/dues/summary ───────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const [[summary]] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status != 'paid' THEN due_amount ELSE 0 END), 0) AS total_due,
         COUNT(CASE WHEN status = 'pending' THEN 1 END)  AS pending_count,
         COUNT(CASE WHEN status = 'partial' THEN 1 END)  AS partial_count,
         COUNT(CASE WHEN status = 'paid'    THEN 1 END)  AS paid_count
       FROM fc_dues`
    );
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
