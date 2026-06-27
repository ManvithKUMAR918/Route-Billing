const express = require('express');
const router = express.Router();
const db = require('../db');

// Rule-based AI logic engine — runs over live DB data
function generateInsights({ enquiries = [], payments = [], dues = [], transport = [] }) {
  const insights = [];
  const now = new Date();

  // Rule 1: High priority pending enquiries
  const highPriorityPending = enquiries.filter(e => e.status === 'pending' && e.priority === 'high');
  if (highPriorityPending.length > 0) {
    insights.push({
      id: 1, type: 'alert', severity: 'high',
      title: 'Urgent Enquiries Pending',
      message: `${highPriorityPending.length} high-priority enquiry(ies) have not been actioned. Immediate follow-up required.`,
      action: 'View Enquiries', action_link: '/enquiry',
      students: highPriorityPending.map(e => e.student_name),
      generated_at: now.toISOString()
    });
  }

  // Rule 2: Overdue pending dues
  const overdueDues = dues.filter(d => d.status === 'pending' && d.due_date && new Date(d.due_date) < now);
  if (overdueDues.length > 0) {
    insights.push({
      id: 2, type: 'warning', severity: 'high',
      title: 'Overdue Transport Fees',
      message: `${overdueDues.length} student(s) have overdue transport fee payments totalling ₹${overdueDues.reduce((s, d) => s + parseFloat(d.due_amount || 0), 0).toLocaleString()}.`,
      action: 'View Dues', action_link: '/dues',
      students: overdueDues.map(d => d.student_name),
      generated_at: now.toISOString()
    });
  }

  // Rule 3: Inactive transport with no exit record
  const inactiveTransport = transport.filter(t => t.status === 'inactive');
  if (inactiveTransport.length > 0) {
    insights.push({
      id: 3, type: 'info', severity: 'medium',
      title: 'Inactive Transport Assignments',
      message: `${inactiveTransport.length} student(s) have inactive transport status. Review if exit records are needed.`,
      action: 'View Transport', action_link: '/transport',
      students: inactiveTransport.map(t => t.student_name),
      generated_at: now.toISOString()
    });
  }

  // Rule 4: Collection rate
  const totalCollected = payments.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);
  const totalDueAmount  = dues.reduce((s, d) => s + parseFloat(d.due_amount || 0), 0);
  const totalExpected   = totalCollected + totalDueAmount;
  const collectionRate  = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  if (collectionRate >= 80) {
    insights.push({
      id: 4, type: 'success', severity: 'low',
      title: 'Strong Collection Rate',
      message: `Current collection rate is ${collectionRate}%. Most transport fees have been collected this month. Great performance!`,
      action: 'View Reports', action_link: '/reports',
      students: [], generated_at: now.toISOString()
    });
  } else {
    insights.push({
      id: 4, type: 'warning', severity: 'medium',
      title: 'Collection Rate Needs Attention',
      message: `Current collection rate is only ${collectionRate}%. Consider sending reminders to parents with pending dues.`,
      action: 'Send Reminders', action_link: '/messages',
      students: [], generated_at: now.toISOString()
    });
  }

  // Rule 5: Monthly summary
  insights.push({
    id: 5, type: 'summary', severity: 'low',
    title: 'Live Monthly Summary',
    message: `Total enrolled: ${transport.length} students. Active: ${transport.filter(t => t.status === 'active').length}. Fees collected: ₹${totalCollected.toLocaleString()}. Dues pending: ₹${totalDueAmount.toLocaleString()}.`,
    action: 'Full Report', action_link: '/reports',
    students: [], generated_at: now.toISOString()
  });

  return insights;
}

// GET — generate insights from live MySQL data
router.get('/', async (req, res) => {
  try {
    const [enquiries] = await db.query('SELECT student_name, status, priority FROM enquiries');
    const [payments]  = await db.query('SELECT amount_paid FROM transport_payments');
    const [dues]      = await db.query('SELECT student_name, due_amount, due_date, status FROM transport_dues');
    const [transport] = await db.query('SELECT student_name, status FROM transport_assignments');

    const insights = generateInsights({ enquiries, payments, dues, transport });
    res.json({ success: true, data: insights, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('Insights GET error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
