const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/students ───────────────────────────────────────
// Shows students from existing `students` table (joined with parents)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.name, s.admission_no, s.class, s.section,
              s.phone, s.status, s.dob, s.gender,
              p.name AS parent_name, p.phone AS parent_phone
       FROM students s
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE s.status = 'active'
       ORDER BY s.name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    // If old table doesn't exist or has issues, try fc_transport students
    try {
      const [rows2] = await db.query(
        `SELECT id, student_name AS name, class, route_name, monthly_fee, status, created_at
         FROM fc_transport ORDER BY student_name ASC`
      );
      res.json({ success: true, data: rows2 });
    } catch (err2) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
});

// ── POST /api/students ──────────────────────────────────────
router.post('/', async (req, res) => {
  const { student_name, class: cls, route_name, pickup_point,
          drop_point, monthly_fee, vehicle_no, driver_name, phone } = req.body;

  if (!student_name?.trim()) {
    return res.status(400).json({ success: false, message: 'Student name is required' });
  }

  try {
    // Create transport record
    const [result] = await db.query(
      `INSERT INTO fc_transport
       (student_name, class, route_name, pickup_point, drop_point,
        monthly_fee, vehicle_no, driver_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        student_name.trim(), cls || '', route_name || '',
        pickup_point || '', drop_point || '',
        parseFloat(monthly_fee) || 0,
        vehicle_no || '', driver_name || '',
      ]
    );

    // Auto-create pending due for current month
    const now = new Date();
    const monthLabel = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 10)
      .toISOString().split('T')[0];
    await db.query(
      `INSERT INTO fc_dues (student_name, route_name, due_amount, due_month, due_date, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [student_name.trim(), route_name || '', parseFloat(monthly_fee) || 0, monthLabel, dueDate]
    );

    res.status(201).json({ success: true, message: 'Student record created', id: result.insertId });
  } catch (err) {
    console.error('POST /students:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
