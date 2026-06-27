const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all payments (optional filter by month_paid)
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM transport_payments';
    const params = [];

    if (req.query.month) {
      query += ' WHERE month_paid = ?';
      params.push(req.query.month);
    }
    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);
    const totalAmount = rows.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
    res.json({ success: true, data: rows, total: rows.length, totalAmount });
  } catch (err) {
    console.error('Payments GET error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST record a new payment
router.post('/', async (req, res) => {
  const { student_id, student_name, class: cls, amount_paid, payment_date, payment_mode, month_paid, remarks } = req.body;
  if (!amount_paid || !payment_date) {
    return res.status(400).json({ success: false, message: 'Amount and payment date are required' });
  }
  try {
    // Auto-generate receipt number
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) AS cnt FROM transport_payments');
    const receipt_number = `REC${String(cnt + 1).padStart(3, '0')}`;

    const [result] = await db.query(
      `INSERT INTO transport_payments 
        (student_id, student_name, class, amount_paid, payment_date, payment_mode, receipt_number, month_paid, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id || null, student_name, cls, parseFloat(amount_paid), payment_date, payment_mode || 'cash', receipt_number, month_paid, remarks || '']
    );

    // Auto-update matching due record if it exists (mark as paid or partial)
    if (student_id && month_paid) {
      const [dues] = await db.query(
        "SELECT * FROM transport_dues WHERE student_id = ? AND due_month = ? AND status != 'paid'",
        [student_id, month_paid]
      );
      if (dues.length > 0) {
        const due = dues[0];
        const remaining = parseFloat(due.due_amount) - parseFloat(amount_paid);
        if (remaining <= 0) {
          await db.query("UPDATE transport_dues SET status = 'paid' WHERE id = ?", [due.id]);
        } else {
          await db.query("UPDATE transport_dues SET due_amount = ?, status = 'partial' WHERE id = ?", [remaining, due.id]);
        }
      }
    }

    const [newRow] = await db.query('SELECT * FROM transport_payments WHERE id = ?', [result.insertId]);
    res.json({ success: true, message: 'Payment recorded!', data: newRow[0] });
  } catch (err) {
    console.error('Payments POST error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
