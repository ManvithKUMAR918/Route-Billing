const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all exit records
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM transport_exits ORDER BY created_at DESC');
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('Exits GET error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST record a student exit
router.post('/', async (req, res) => {
  const {
    student_id, student_name, class: cls, admission_no, parent_name, phone,
    exit_reason, exit_date, transport_end_date, outstanding_dues, refund_amount, recorded_by, notes
  } = req.body;

  if (!student_name || !exit_date) {
    return res.status(400).json({ success: false, message: 'Student name and exit date are required' });
  }
  try {
    // Insert into exits table
    const [result] = await db.query(
      `INSERT INTO transport_exits 
        (student_id, student_name, class, admission_no, parent_name, phone, exit_reason, exit_date, transport_end_date, outstanding_dues, refund_amount, refund_status, recorded_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        student_id || null, student_name, cls, admission_no, parent_name, phone,
        exit_reason, exit_date, transport_end_date || exit_date,
        parseFloat(outstanding_dues || 0), parseFloat(refund_amount || 0),
        recorded_by || 'Admin', notes || ''
      ]
    );

    // Mark student's transport assignments as inactive
    if (student_id) {
      await db.query(
        "UPDATE transport_assignments SET status = 'exit' WHERE student_id = ? AND status = 'active'",
        [student_id]
      );
      // Update student status to exit
      await db.query("UPDATE students SET status = 'exit' WHERE id = ?", [student_id]);
    }

    const [newRow] = await db.query('SELECT * FROM transport_exits WHERE id = ?', [result.insertId]);
    res.json({ success: true, message: 'Exit record saved', data: newRow[0] });
  } catch (err) {
    console.error('Exits POST error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
