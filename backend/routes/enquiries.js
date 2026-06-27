const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all enquiries (optional filter by status / source)
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM enquiries';
    const params = [];
    const conditions = [];

    if (req.query.status) { conditions.push('status = ?'); params.push(req.query.status); }
    if (req.query.source) { conditions.push('source = ?'); params.push(req.query.source); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('Enquiries GET error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single enquiry
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM enquiries WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create new enquiry
router.post('/', async (req, res) => {
  const { student_name, parent_name, phone, email, class: cls, address, route_requested, source, owner, notes, priority } = req.body;
  if (!student_name || !phone) {
    return res.status(400).json({ success: false, message: 'Student name and phone are required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO enquiries 
        (student_name, parent_name, phone, email, class, address, route_requested, source, status, owner, notes, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [student_name, parent_name, phone, email, cls, address, route_requested, source || 'parent_portal', owner || 'Admin', notes || '', priority || 'medium']
    );
    const [newRow] = await db.query('SELECT * FROM enquiries WHERE id = ?', [result.insertId]);
    res.json({ success: true, message: 'Enquiry submitted successfully', data: newRow[0] });
  } catch (err) {
    console.error('Enquiries POST error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update enquiry status / owner / notes
router.put('/:id', async (req, res) => {
  const { status, owner, notes, priority } = req.body;
  try {
    const fields = [];
    const params = [];
    if (status !== undefined)   { fields.push('status = ?');   params.push(status); }
    if (owner !== undefined)    { fields.push('owner = ?');    params.push(owner); }
    if (notes !== undefined)    { fields.push('notes = ?');    params.push(notes); }
    if (priority !== undefined) { fields.push('priority = ?'); params.push(priority); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });

    params.push(req.params.id);
    await db.query(`UPDATE enquiries SET ${fields.join(', ')} WHERE id = ?`, params);
    const [updated] = await db.query('SELECT * FROM enquiries WHERE id = ?', [req.params.id]);
    if (!updated.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Enquiry updated', data: updated[0] });
  } catch (err) {
    console.error('Enquiries PUT error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
