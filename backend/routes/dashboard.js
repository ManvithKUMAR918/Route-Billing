const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/dashboard/stats ────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const monthLabel = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear();

    // Stat 1: Total Active Transport Students
    const [[{ totalStudents }]] = await db.query(
      "SELECT COUNT(*) AS totalStudents FROM fc_transport WHERE status = 'active'"
    );

    // Stat 2: Active Routes (distinct route names)
    const [[{ activeRoutes }]] = await db.query(
      "SELECT COUNT(DISTINCT route_name) AS activeRoutes FROM fc_transport WHERE status = 'active'"
    );

    // Stat 3: Total Collected This Month
    const [[{ totalCollected }]] = await db.query(
      'SELECT COALESCE(SUM(amount_paid), 0) AS totalCollected FROM fc_payments WHERE month_paid = ?',
      [monthLabel]
    );

    // Stat 4: Pending Dues This Month
    const [[{ pendingDues }]] = await db.query(
      "SELECT COALESCE(SUM(due_amount), 0) AS pendingDues FROM fc_dues WHERE status != 'paid'",
    );

    // Monthly Collection Chart (last 6 months)
    const [monthlyCollection] = await db.query(
      `SELECT month_paid AS month, COALESCE(SUM(amount_paid), 0) AS amount
       FROM fc_payments GROUP BY month_paid
       ORDER BY MIN(payment_date) ASC LIMIT 6`
    );

    // Route Summary
    const [routeSummary] = await db.query(
      `SELECT route_name, COUNT(*) AS count, COALESCE(SUM(monthly_fee), 0) AS total_fee
       FROM fc_transport WHERE status = 'active' GROUP BY route_name ORDER BY count DESC`
    );

    // Recent Payments (last 10)
    const [recentPayments] = await db.query(
      `SELECT id, student_name, class, amount_paid, payment_date,
              payment_mode, month_paid, receipt_number, remarks
       FROM fc_payments ORDER BY created_at DESC LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        totalStudents,
        activeTransport: activeRoutes,
        totalCollected:  parseFloat(totalCollected) || 0,
        pendingDues:     parseFloat(pendingDues)     || 0,
        monthlyCollection: monthlyCollection.map(r => ({
          month: r.month || 'Unknown',
          amount: parseFloat(r.amount) || 0,
        })),
        routeSummary: routeSummary.map(r => ({
          route_name: r.route_name,
          count:      r.count,
          total_fee:  parseFloat(r.total_fee) || 0,
        })),
        recentPayments,
      },
    });
  } catch (err) {
    console.error('GET /dashboard/stats:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
