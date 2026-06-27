const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/stats', async (req, res) => {
  try {
    // Total students
    const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) AS totalStudents FROM students WHERE status = "active"');

    // Active transport assignments
    const [[{ activeTransport }]] = await db.query('SELECT COUNT(*) AS activeTransport FROM transport_assignments WHERE status = "active"');

    // Total collected this month
    const [[{ totalCollected }]] = await db.query(
      'SELECT COALESCE(SUM(amount_paid), 0) AS totalCollected FROM transport_payments'
    );

    // Pending dues total
    const [[{ pendingDues }]] = await db.query(
      "SELECT COALESCE(SUM(due_amount), 0) AS pendingDues FROM transport_dues WHERE status != 'paid'"
    );

    // Recent payments (last 5)
    const [recentPayments] = await db.query(
      'SELECT id, student_name, amount_paid, payment_date, payment_mode, month_paid FROM transport_payments ORDER BY created_at DESC LIMIT 5'
    );

    // Route summary
    const [routeSummary] = await db.query(
      'SELECT route_name, COUNT(*) AS count, SUM(monthly_fee) AS total_fee FROM transport_assignments WHERE status = "active" GROUP BY route_name'
    );

    // Monthly collection (last 6 months) — group by month_paid
    const [rawMonthly] = await db.query(
      `SELECT month_paid AS month, SUM(amount_paid) AS amount
       FROM transport_payments
       GROUP BY month_paid
       ORDER BY MIN(payment_date) ASC
       LIMIT 6`
    );

    // Format monthly labels
    const monthlyCollection = rawMonthly.map(r => ({
      month: r.month ? r.month.split(' ')[0] : 'Unknown',
      amount: parseFloat(r.amount) || 0
    }));

    res.json({
      success: true,
      data: {
        totalStudents,
        activeTransport,
        totalCollected: parseFloat(totalCollected) || 0,
        pendingDues: parseFloat(pendingDues) || 0,
        recentPayments,
        routeSummary: routeSummary.map(r => ({
          route_name: r.route_name,
          count: r.count,
          total_fee: parseFloat(r.total_fee) || 0
        })),
        monthlyCollection
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
