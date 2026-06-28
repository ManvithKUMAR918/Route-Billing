const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/finance/summary ────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const monthLabel = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear();

    // Income: payments this month
    const [[incomeRow]] = await db.query(
      'SELECT COALESCE(SUM(amount_paid), 0) AS total_income FROM fc_payments WHERE month_paid = ?',
      [monthLabel]
    );

    // Expenses this month
    const [[expenseRow]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM fc_expenses
       WHERE DATE_FORMAT(date, '%M %Y') = ?`,
      [monthLabel]
    );

    const income   = parseFloat(incomeRow.total_income);
    const expenses = parseFloat(expenseRow.total_expenses);
    const net      = income - expenses;

    // Expense breakdown by category
    const [breakdown] = await db.query(
      `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM fc_expenses WHERE DATE_FORMAT(date, '%M %Y') = ?
       GROUP BY category ORDER BY total DESC`,
      [monthLabel]
    );

    // Monthly collection trend (last 6 months)
    const [monthlyTrend] = await db.query(
      `SELECT month_paid AS month, COALESCE(SUM(amount_paid), 0) AS amount
       FROM fc_payments
       GROUP BY month_paid ORDER BY MIN(payment_date) ASC LIMIT 6`
    );

    res.json({
      success: true,
      data: {
        month: monthLabel,
        total_income: income,
        total_expenses: expenses,
        net_balance: net,
        expense_breakdown: breakdown,
        monthly_trend: monthlyTrend,
      },
    });
  } catch (err) {
    console.error('GET /finance/summary:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/finance/reports ────────────────────────────────
router.get('/reports', async (req, res) => {
  try {
    const now = new Date();
    const monthLabel = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear();

    // Monthly collection grouped by route
    const [collectionByRoute] = await db.query(
      `SELECT t.route_name, COALESCE(SUM(p.amount_paid), 0) AS total
       FROM fc_payments p
       JOIN fc_transport t ON p.student_name = t.student_name
       WHERE p.month_paid = ? GROUP BY t.route_name ORDER BY total DESC`,
      [monthLabel]
    );

    // Pending dues by route
    const [duesByRoute] = await db.query(
      `SELECT route_name, COALESCE(SUM(due_amount), 0) AS total, COUNT(*) AS count
       FROM fc_dues WHERE status != 'paid'
       GROUP BY route_name ORDER BY total DESC`
    );

    // Active student count by route
    const [studentsByRoute] = await db.query(
      `SELECT route_name, COUNT(*) AS count, COALESCE(SUM(monthly_fee), 0) AS expected_fee
       FROM fc_transport WHERE status = 'active'
       GROUP BY route_name ORDER BY count DESC`
    );

    // Monthly expense breakdown
    const [expensesByType] = await db.query(
      `SELECT category AS expense_type, COALESCE(SUM(amount), 0) AS total
       FROM fc_expenses WHERE DATE_FORMAT(date, '%M %Y') = ?
       GROUP BY category ORDER BY total DESC`,
      [monthLabel]
    );

    res.json({
      success: true,
      data: {
        month: monthLabel,
        collection_by_route: collectionByRoute,
        dues_by_route: duesByRoute,
        students_by_route: studentsByRoute,
        expenses_by_type: expensesByType,
      },
    });
  } catch (err) {
    console.error('GET /finance/reports:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/finance/expenses ───────────────────────────────
router.get('/expenses', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM fc_expenses';
    const params = [];
    if (category) { sql += ' WHERE category = ?'; params.push(category); }
    sql += ' ORDER BY date DESC, created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /finance/expenses:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/finance/expenses ──────────────────────────────
router.post('/expenses', async (req, res) => {
  const { category, description, amount, date, route, vendor, approved_by, notes } = req.body;

  if (!category?.trim()) {
    return res.status(400).json({ success: false, message: 'Category is required' });
  }
  if (!description?.trim()) {
    return res.status(400).json({ success: false, message: 'Description is required' });
  }
  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
  }
  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required' });
  }
  // Cannot be a future date
  if (new Date(date) > new Date()) {
    return res.status(400).json({ success: false, message: 'Expense date cannot be in the future' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO fc_expenses (category, description, amount, date, route, vendor, approved_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category.trim(), description.trim(),
        parseFloat(amount), date,
        route || null, vendor || null,
        approved_by || 'Admin', notes || null,
      ]
    );
    res.status(201).json({ success: true, message: 'Expense recorded', id: result.insertId });
  } catch (err) {
    console.error('POST /finance/expenses:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/finance/expenses/:id ───────────────────────
router.delete('/expenses/:id', async (req, res) => {
  const { id } = req.params;
  const [[record]] = await db.query('SELECT id FROM fc_expenses WHERE id = ?', [id]);
  if (!record) return res.status(404).json({ success: false, message: 'Expense not found' });
  try {
    await db.query('DELETE FROM fc_expenses WHERE id = ?', [id]);
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    console.error('DELETE /finance/expenses/:id:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
