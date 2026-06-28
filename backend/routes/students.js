const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/students ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = 'SELECT * FROM fc_students';
    const conditions = [];
    const params = [];
    if (status) { conditions.push('status = ?'); params.push(status); }
    else { conditions.push("status != 'exit'"); } // default: exclude exited
    if (search) {
      conditions.push('(name LIKE ? OR admission_no LIKE ? OR class LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY name ASC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /students:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/students ──────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    student_name, class: cls, route_name, pickup_point,
    drop_point, monthly_fee, vehicle_no, driver_name,
    parent_name, phone, email, address,
  } = req.body;

  if (!student_name?.trim()) {
    return res.status(400).json({ success: false, message: 'Student name is required' });
  }

  // Generate admission number: ADM-YYYYMM-XXXX
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [[countRow]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM fc_students WHERE admission_no LIKE ?",
    [`ADM-${yyyymm}-%`]
  );
  const seq = String(countRow.cnt + 1).padStart(4, '0');
  const admission_no = `ADM-${yyyymm}-${seq}`;

  try {
    // 1. Create student record
    const [result] = await db.query(
      `INSERT INTO fc_students
       (name, admission_no, class, section, phone, parent_name, email,
        address, route_name, pickup_point, monthly_fee, status, joined_date)
       VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        student_name.trim(), admission_no,
        cls || '', phone || '', parent_name || '', email || '',
        address || '', route_name || '', pickup_point || '',
        parseFloat(monthly_fee) || 0,
        now.toISOString().split('T')[0],
      ]
    );

    // 2. Create transport record
    await db.query(
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

    // 3. Auto-create pending due for current month
    const monthLabel = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 10)
      .toISOString().split('T')[0];
    await db.query(
      `INSERT INTO fc_dues (student_name, route_name, due_amount, due_month, due_date, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [student_name.trim(), route_name || '', parseFloat(monthly_fee) || 0, monthLabel, dueDate]
    );

    res.status(201).json({
      success: true,
      message: 'Student record created',
      admission_no,
      id: result.insertId,
    });
  } catch (err) {
    console.error('POST /students:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
