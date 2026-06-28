const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/exits ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM fc_exits ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /exits:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/exits ─────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    student_name, class: cls, admission_no, parent_name, phone,
    exit_reason, exit_date, transport_end_date,
    outstanding_dues, refund_amount, recorded_by, notes,
  } = req.body;

  // Validation
  if (!student_name?.trim()) {
    return res.status(400).json({ success: false, message: 'Student name is required' });
  }
  if (!exit_reason) {
    return res.status(400).json({ success: false, message: 'Exit reason is required' });
  }
  if (!exit_date) {
    return res.status(400).json({ success: false, message: 'Exit date is required' });
  }

  const refundAmt = parseFloat(refund_amount) || 0;
  const refundStatus = refundAmt > 0 ? 'pending' : 'processed';

  try {
    // 1. Insert exit record
    const [result] = await db.query(
      `INSERT INTO fc_exits
       (student_name, class, admission_no, parent_name, phone,
        exit_reason, exit_date, transport_end_date,
        outstanding_dues, refund_amount, refund_status, recorded_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_name.trim(), cls || '', admission_no || '', parent_name || '', phone || '',
        exit_reason,
        exit_date || new Date().toISOString().split('T')[0],
        transport_end_date || exit_date || new Date().toISOString().split('T')[0],
        parseFloat(outstanding_dues) || 0,
        refundAmt,
        refundStatus,
        recorded_by || 'Admin',
        notes || null,
      ]
    );

    // 2. Deactivate transport records for this student
    await db.query(
      "UPDATE fc_transport SET status = 'exit', last_updated = NOW() WHERE student_name = ?",
      [student_name.trim()]
    );

    // 3. Mark all pending dues as paid (student is exiting)
    await db.query(
      "UPDATE fc_dues SET status = 'paid', last_updated = NOW() WHERE student_name = ? AND status != 'paid'",
      [student_name.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Exit record saved. Transport assignment deactivated.',
      id: result.insertId,
      refund_status: refundStatus,
    });
  } catch (err) {
    console.error('POST /exits:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
