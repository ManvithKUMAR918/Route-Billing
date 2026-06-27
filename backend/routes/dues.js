const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all dues (optional filter by status)
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM transport_dues';
    const params = [];

    if (req.query.status) {
      query += ' WHERE status = ?';
      params.push(req.query.status);
    }
    query += ' ORDER BY due_date ASC';

    const [rows] = await db.query(query, params);
    const totalDue = rows.reduce((sum, d) => sum + parseFloat(d.due_amount || 0), 0);
    res.json({ success: true, data: rows, total: rows.length, totalDue });
  } catch (err) {
    console.error('Dues GET error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add a new due
router.post('/', async (req, res) => {
  const { student_id, student_name, route_name, due_amount, due_month, due_date, remarks } = req.body;
  if (!due_amount) {
    return res.status(400).json({ success: false, message: 'Due amount is required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO transport_dues 
        (student_id, student_name, route_name, due_amount, due_month, due_date, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [student_id || null, student_name, route_name, parseFloat(due_amount), due_month, due_date, remarks || '']
    );
    const [newRow] = await db.query('SELECT * FROM transport_dues WHERE id = ?', [result.insertId]);
    res.json({ success: true, message: 'Due added!', data: newRow[0] });
  } catch (err) {
    console.error('Dues POST error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update due (mark paid / partial / change amount)
router.put('/:id', async (req, res) => {
  const { due_amount, status, remarks } = req.body;
  try {
    const fields = [];
    const params = [];
    if (due_amount !== undefined) { fields.push('due_amount = ?'); params.push(parseFloat(due_amount)); }
    if (status !== undefined)     { fields.push('status = ?');     params.push(status); }
    if (remarks !== undefined)    { fields.push('remarks = ?');    params.push(remarks); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });

    params.push(req.params.id);
    await db.query(`UPDATE transport_dues SET ${fields.join(', ')} WHERE id = ?`, params);
    const [updated] = await db.query('SELECT * FROM transport_dues WHERE id = ?', [req.params.id]);
    if (!updated.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Due updated', data: updated[0] });
  } catch (err) {
    console.error('Dues PUT error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
