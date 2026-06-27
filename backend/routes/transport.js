const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all transport assignments
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM transport_assignments';
    const params = [];
    const conditions = [];

    if (req.query.status) {
      conditions.push('status = ?');
      params.push(req.query.status);
    }
    if (req.query.route) {
      conditions.push('route_name = ?');
      params.push(req.query.route);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('Transport GET error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single transport record
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM transport_assignments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add transport assignment
router.post('/', async (req, res) => {
  const { student_id, student_name, class: cls, route_name, pickup_point, drop_point, monthly_fee, vehicle_no, driver_name, start_date } = req.body;
  if (!route_name || !monthly_fee) {
    return res.status(400).json({ success: false, message: 'Route name and monthly fee are required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO transport_assignments 
        (student_id, student_name, class, route_name, pickup_point, drop_point, monthly_fee, vehicle_no, driver_name, start_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [student_id || null, student_name, cls, route_name, pickup_point, drop_point, parseFloat(monthly_fee), vehicle_no, driver_name, start_date || new Date().toISOString().split('T')[0]]
    );
    const [newRow] = await db.query('SELECT * FROM transport_assignments WHERE id = ?', [result.insertId]);
    res.json({ success: true, message: 'Transport assignment added!', data: newRow[0] });
  } catch (err) {
    console.error('Transport POST error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update transport assignment
router.put('/:id', async (req, res) => {
  const { student_name, class: cls, route_name, pickup_point, drop_point, monthly_fee, vehicle_no, driver_name, status } = req.body;
  try {
    await db.query(
      `UPDATE transport_assignments 
       SET student_name=?, class=?, route_name=?, pickup_point=?, drop_point=?, monthly_fee=?, vehicle_no=?, driver_name=?, status=?
       WHERE id=?`,
      [student_name, cls, route_name, pickup_point, drop_point, parseFloat(monthly_fee), vehicle_no, driver_name, status, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM transport_assignments WHERE id = ?', [req.params.id]);
    if (!updated.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated successfully', data: updated[0] });
  } catch (err) {
    console.error('Transport PUT error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE transport assignment
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM transport_assignments WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('Transport DELETE error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
