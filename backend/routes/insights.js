const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/insights ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const insights = [];
    const now = new Date();
    const monthLabel = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear();

    // ── RULE 1: Overdue Dues Alert ─────────────────────────
    const [[overdueRow]] = await db.query(
      `SELECT COUNT(*) AS cnt, COALESCE(SUM(due_amount), 0) AS total
       FROM fc_dues WHERE status != 'paid' AND due_date < CURDATE()`
    );
    if (overdueRow.cnt > 0) {
      insights.push({
        type: 'alert',
        icon: '🚨',
        title: 'Overdue Transport Fees',
        message: `${overdueRow.cnt} student${overdueRow.cnt > 1 ? 's' : ''} have overdue transport fees totalling ₹${parseFloat(overdueRow.total).toLocaleString()}. Immediate follow-up required.`,
        color: '#ef4444',
        priority: 1,
      });
    }

    // ── RULE 2: High Collection Month ─────────────────────
    const [[thisMonth]] = await db.query(
      "SELECT COALESCE(SUM(amount_paid), 0) AS total FROM fc_payments WHERE month_paid = ?",
      [monthLabel]
    );
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthLabel = lastMonthDate.toLocaleString('default', { month: 'long' }) + ' ' + lastMonthDate.getFullYear();
    const [[lastMonth]] = await db.query(
      "SELECT COALESCE(SUM(amount_paid), 0) AS total FROM fc_payments WHERE month_paid = ?",
      [lastMonthLabel]
    );
    const thisTotal = parseFloat(thisMonth.total);
    const lastTotal = parseFloat(lastMonth.total);
    if (lastTotal > 0 && thisTotal > lastTotal * 1.2) {
      const pct = Math.round(((thisTotal - lastTotal) / lastTotal) * 100);
      insights.push({
        type: 'success',
        icon: '📈',
        title: 'Collection Increased',
        message: `Collection is up ${pct}% compared to last month (₹${thisTotal.toLocaleString()} vs ₹${lastTotal.toLocaleString()}).`,
        color: '#10b981',
        priority: 2,
      });
    }

    // ── RULE 3: Pending Enquiries > 3 days ────────────────
    const [[oldEnquiries]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM fc_enquiries
       WHERE status = 'pending'
       AND created_at < DATE_SUB(NOW(), INTERVAL 3 DAY)`
    );
    if (oldEnquiries.cnt > 0) {
      insights.push({
        type: 'warning',
        icon: '⏳',
        title: 'Enquiries Need Follow-up',
        message: `${oldEnquiries.cnt} enquir${oldEnquiries.cnt > 1 ? 'ies' : 'y'} have not been followed up in 3+ days. Assign a counsellor.`,
        color: '#f59e0b',
        priority: 3,
      });
    }

    // ── RULE 4: Route with Most Dues ──────────────────────
    const [[topRoute]] = await db.query(
      `SELECT route_name, COALESCE(SUM(due_amount), 0) AS total
       FROM fc_dues WHERE status != 'paid'
       GROUP BY route_name ORDER BY total DESC LIMIT 1`
    );
    if (topRoute && topRoute.route_name && parseFloat(topRoute.total) > 0) {
      insights.push({
        type: 'info',
        icon: '🗺️',
        title: 'Route with Highest Dues',
        message: `Route "${topRoute.route_name}" has the highest pending dues of ₹${parseFloat(topRoute.total).toLocaleString()}.`,
        color: '#6366f1',
        priority: 4,
      });
    }

    // ── RULE 5: Monthly Expense Summary ───────────────────
    const [[expRow]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM fc_expenses
       WHERE DATE_FORMAT(date, '%M %Y') = ?`,
      [monthLabel]
    );
    insights.push({
      type: 'info',
      icon: '💸',
      title: 'Monthly Expenses',
      message: `Total transport expenses for ${monthLabel}: ₹${parseFloat(expRow.total).toLocaleString()}.`,
      color: '#06b6d4',
      priority: 5,
    });

    // Sort by priority
    insights.sort((a, b) => a.priority - b.priority);
    res.json({ success: true, data: insights });
  } catch (err) {
    console.error('GET /insights:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
