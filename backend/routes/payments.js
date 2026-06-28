const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/payments ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { month_paid, payment_mode, search } = req.query;
    let sql = 'SELECT * FROM fc_payments';
    const conditions = [];
    const params = [];
    if (month_paid)    { conditions.push('month_paid = ?');    params.push(month_paid); }
    if (payment_mode)  { conditions.push('payment_mode = ?');  params.push(payment_mode); }
    if (search) {
      conditions.push('(student_name LIKE ? OR receipt_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /payments:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payments ──────────────────────────────────────
router.post('/', async (req, res) => {
  const { student_name, class: cls, amount_paid, payment_date,
          payment_mode, month_paid, remarks } = req.body;

  // Validation
  if (!student_name?.trim()) {
    return res.status(400).json({ success: false, message: 'Student name is required' });
  }
  if (!amount_paid || parseFloat(amount_paid) <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
  }

  // Generate receipt number: RCP-YYYYMM-XXXX
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [[countRow]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM fc_payments WHERE receipt_number LIKE ?",
    [`RCP-${yyyymm}-%`]
  );
  const seq = String(countRow.cnt + 1).padStart(4, '0');
  const receipt_number = `RCP-${yyyymm}-${seq}`;

  // Flag late payment
  let finalRemarks = remarks || '';
  if (payment_date && month_paid) {
    const pDate = new Date(payment_date);
    const pMonth = pDate.getMonth();
    const pYear  = pDate.getFullYear();
    const dueDate = new Date(pYear, pMonth, 10);
    if (pDate > dueDate) {
      finalRemarks = finalRemarks ? `${finalRemarks} [Late Payment]` : '[Late Payment]';
    }
  }

  try {
    const [result] = await db.query(
      `INSERT INTO fc_payments
       (student_name, class, amount_paid, payment_date, payment_mode,
        month_paid, receipt_number, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_name.trim(), cls || '',
        parseFloat(amount_paid),
        payment_date || now.toISOString().split('T')[0],
        payment_mode || 'cash',
        month_paid || '',
        receipt_number,
        finalRemarks,
      ]
    );

    // Update corresponding due to 'paid'
    if (month_paid) {
      await db.query(
        "UPDATE fc_dues SET status = 'paid', last_updated = NOW() WHERE student_name = ? AND due_month = ? AND status != 'paid'",
        [student_name.trim(), month_paid]
      );
    }

    // ── STEP 5 CONNECTION ──────────────────────────────────
    // Auto-log a completed follow-up: "Fee collected — admission complete"
    await db.query(
      `INSERT INTO fc_followups
       (student_name, counsellor, action_taken, action_type, next_action, priority, status)
       VALUES (?, 'Admin', ?, 'admin', 'Workflow complete — student fully admitted', 'low', 'completed')`,
      [
        student_name.trim(),
        `Fee collected via ${payment_mode?.toUpperCase() || 'CASH'} — ₹${parseFloat(amount_paid).toLocaleString()} for ${month_paid || 'current month'}. Receipt: ${receipt_number}.`,
      ]
    );

    // Also mark the matching enquiry as resolved if still in_progress
    const [[openEnquiry]] = await db.query(
      `SELECT id FROM fc_enquiries
       WHERE student_name = ? AND status IN ('pending','in_progress')
       ORDER BY created_at DESC LIMIT 1`,
      [student_name.trim()]
    );
    if (openEnquiry) {
      await db.query(
        "UPDATE fc_enquiries SET status = 'resolved', last_updated = NOW() WHERE id = ?",
        [openEnquiry.id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      receipt_number,
      id: result.insertId,
    });

  } catch (err) {
    console.error('POST /payments:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/payments/summary ───────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const monthLabel = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear();
    const [[summary]] = await db.query(
      `SELECT
         COALESCE(SUM(amount_paid), 0) AS total_collected,
         COUNT(*) AS total_payments
       FROM fc_payments WHERE month_paid = ?`,
      [monthLabel]
    );
    const [[duesSummary]] = await db.query(
      `SELECT
         COALESCE(SUM(due_amount), 0) AS total_pending,
         COUNT(*) AS total_pending_count
       FROM fc_dues WHERE due_month = ? AND status != 'paid'`,
      [monthLabel]
    );
    res.json({
      success: true,
      data: {
        total_collected: parseFloat(summary.total_collected),
        total_payments: summary.total_payments,
        total_pending: parseFloat(duesSummary.total_pending),
        total_pending_count: duesSummary.total_pending_count,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
