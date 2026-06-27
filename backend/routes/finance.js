const express = require('express');
const router = express.Router();
const db = require('../db');

// GET finance summary — all computed live from MySQL
router.get('/summary', async (req, res) => {
  try {
    // Revenue
    const [[{ total_collected }]] = await db.query('SELECT COALESCE(SUM(amount_paid), 0) AS total_collected FROM transport_payments');
    const [[{ total_dues }]]      = await db.query("SELECT COALESCE(SUM(due_amount), 0) AS total_dues FROM transport_dues WHERE status != 'paid'");

    // Expected = sum of all monthly_fee for active assignments
    const [[{ total_expected }]] = await db.query("SELECT COALESCE(SUM(monthly_fee), 0) AS total_expected FROM transport_assignments WHERE status = 'active'");

    const collection_rate = total_expected > 0
      ? Math.round((parseFloat(total_collected) / parseFloat(total_expected)) * 100 * 10) / 10
      : 0;

    // Route-wise breakdown
    const [assignments] = await db.query(
      `SELECT ta.route_name,
              COUNT(*) AS students,
              SUM(ta.monthly_fee) AS monthly_total,
              COALESCE(SUM(tp.amount_paid), 0) AS collected
       FROM transport_assignments ta
       LEFT JOIN transport_payments tp ON ta.student_id = tp.student_id
       WHERE ta.status = 'active'
       GROUP BY ta.route_name`
    );
    const route_fees = assignments.map(r => ({
      route: r.route_name,
      students: r.students,
      monthly_total: parseFloat(r.monthly_total) || 0,
      collected: parseFloat(r.collected) || 0,
      due: Math.max(0, parseFloat(r.monthly_total) - parseFloat(r.collected))
    }));

    // Expenses
    const [expenses] = await db.query('SELECT * FROM expenses ORDER BY date DESC');
    const [[{ total_expenses }]] = await db.query('SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses');

    // Payment mode breakdown
    const [payment_modes] = await db.query(
      'SELECT payment_mode AS mode, COUNT(*) AS count, SUM(amount_paid) AS amount FROM transport_payments GROUP BY payment_mode'
    );
    const payment_modes_formatted = payment_modes.map(pm => ({
      mode: pm.mode,
      count: pm.count,
      amount: parseFloat(pm.amount) || 0
    }));

    res.json({
      success: true,
      data: {
        total_expected: parseFloat(total_expected) || 0,
        total_collected: parseFloat(total_collected) || 0,
        total_dues: parseFloat(total_dues) || 0,
        collection_rate,
        route_fees,
        expenses: expenses.map(e => ({ ...e, amount: parseFloat(e.amount) })),
        total_expenses: parseFloat(total_expenses) || 0,
        net_balance: parseFloat(total_collected) - parseFloat(total_expenses),
        payment_modes: payment_modes_formatted
      }
    });
  } catch (err) {
    console.error('Finance summary error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all expenses
router.get('/expenses', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json({ success: true, data: rows.map(e => ({ ...e, amount: parseFloat(e.amount) })) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add expense
router.post('/expenses', async (req, res) => {
  const { category, description, amount, date, route, vendor, approved_by, notes } = req.body;
  if (!category || !description || !amount || !date) {
    return res.status(400).json({ success: false, message: 'Category, description, amount, and date are required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO expenses (category, description, amount, date, route, vendor, approved_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [category, description, parseFloat(amount), date, route || '', vendor || '', approved_by || 'Admin', notes || '']
    );
    const [newRow] = await db.query('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.json({ success: true, message: 'Expense recorded', data: { ...newRow[0], amount: parseFloat(newRow[0].amount) } });
  } catch (err) {
    console.error('Expense POST error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE expense
router.delete('/expenses/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET reports data — monthly collections grouped
router.get('/reports', async (req, res) => {
  try {
    const [monthly] = await db.query(
      `SELECT month_paid AS month,
              SUM(amount_paid) AS collected
       FROM transport_payments
       GROUP BY month_paid
       ORDER BY MIN(payment_date) ASC`
    );

    const [monthlyDues] = await db.query(
      `SELECT due_month AS month,
              SUM(due_amount) AS dues
       FROM transport_dues
       GROUP BY due_month`
    );

    // Merge monthly collections and dues
    const monthMap = {};
    monthly.forEach(m => {
      const label = m.month ? m.month.split(' ')[0] : 'Unknown';
      monthMap[m.month] = { month: label, collected: parseFloat(m.collected) || 0, dues: 0 };
    });
    monthlyDues.forEach(d => {
      if (monthMap[d.month]) {
        monthMap[d.month].dues = parseFloat(d.dues) || 0;
      } else {
        const label = d.month ? d.month.split(' ')[0] : 'Unknown';
        monthMap[d.month] = { month: label, collected: 0, dues: parseFloat(d.dues) || 0 };
      }
    });
    const monthlyData = Object.values(monthMap);

    // Route distribution (students per route)
    const [routeData] = await db.query(
      `SELECT route_name AS name, COUNT(*) AS value
       FROM transport_assignments
       WHERE status = 'active'
       GROUP BY route_name`
    );

    res.json({ success: true, data: { monthlyData, routeData } });
  } catch (err) {
    console.error('Reports GET error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
