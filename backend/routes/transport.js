const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/transport ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM fc_transport';
    const conditions = [];
    const params = [];
    if (status) { conditions.push('status = ?'); params.push(status); }
    if (search) {
      conditions.push('(student_name LIKE ? OR route_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /transport:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/transport/alert-students ──────────────────────
router.get('/alert-students', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, d.due_amount, d.due_month, d.due_date, d.status as due_status
       FROM fc_transport t
       LEFT JOIN fc_dues d ON d.student_name = t.student_name AND d.status != 'paid'
       WHERE t.status = 'active'
       ORDER BY d.due_date ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /transport/alert-students:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/transport/alert-logs ──────────────────────────
router.get('/alert-logs', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM fc_messages ORDER BY sent_at DESC LIMIT 100'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/transport ─────────────────────────────────────
router.post('/', async (req, res) => {
  const { student_name, class: cls, route_name, pickup_point,
          drop_point, monthly_fee, vehicle_no, driver_name } = req.body;

  if (!student_name?.trim()) {
    return res.status(400).json({ success: false, message: 'Student name is required' });
  }
  if (!route_name?.trim()) {
    return res.status(400).json({ success: false, message: 'Route name is required' });
  }
  if (!monthly_fee || parseFloat(monthly_fee) < 0) {
    return res.status(400).json({ success: false, message: 'Monthly fee must be a valid amount' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO fc_transport
       (student_name, class, route_name, pickup_point, drop_point,
        monthly_fee, vehicle_no, driver_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        student_name.trim(), cls || '', route_name.trim(),
        pickup_point || '', drop_point || '',
        parseFloat(monthly_fee) || 0,
        vehicle_no || '', driver_name || '',
      ]
    );
    res.status(201).json({ success: true, message: 'Transport record added', id: result.insertId });
  } catch (err) {
    console.error('POST /transport:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/transport/:id ──────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, route_name, pickup_point, drop_point, monthly_fee, vehicle_no, driver_name } = req.body;

  const [[record]] = await db.query('SELECT * FROM fc_transport WHERE id = ?', [id]);
  if (!record) return res.status(404).json({ success: false, message: 'Transport record not found' });

  const updates = { last_updated: new Date() };
  if (status)       updates.status       = status;
  if (route_name)   updates.route_name   = route_name;
  if (pickup_point) updates.pickup_point = pickup_point;
  if (drop_point)   updates.drop_point   = drop_point;
  if (vehicle_no)   updates.vehicle_no   = vehicle_no;
  if (driver_name)  updates.driver_name  = driver_name;
  if (monthly_fee !== undefined) updates.monthly_fee = parseFloat(monthly_fee);

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values     = [...Object.values(updates), id];

  try {
    await db.query(`UPDATE fc_transport SET ${setClauses} WHERE id = ?`, values);

    // Cascade fee update to pending payments for this student
    if (monthly_fee !== undefined && parseFloat(monthly_fee) !== parseFloat(record.monthly_fee)) {
      await db.query(
        `UPDATE fc_dues SET due_amount = ? WHERE student_name = ? AND status != 'paid'`,
        [parseFloat(monthly_fee), record.student_name]
      );
    }

    res.json({ success: true, message: 'Transport record updated' });
  } catch (err) {
    console.error('PUT /transport/:id:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/transport/:id ───────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const [[record]] = await db.query('SELECT id FROM fc_transport WHERE id = ?', [id]);
  if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

  try {
    await db.query("UPDATE fc_transport SET status = 'inactive' WHERE id = ?", [id]);
    res.json({ success: true, message: 'Record deactivated' });
  } catch (err) {
    console.error('DELETE /transport/:id:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/transport/mark-paid ──────────────────────────
router.post('/mark-paid', async (req, res) => {
  const { student_name, month_paid } = req.body;
  try {
    await db.query(
      "UPDATE fc_dues SET status = 'paid', last_updated = NOW() WHERE student_name = ? AND due_month = ?",
      [student_name, month_paid]
    );
    res.json({ success: true, message: 'Marked as paid' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/transport/send-manual-alert ──────────────────
router.post('/send-manual-alert', async (req, res) => {
  const { student_name, parent_name, phone, message_body } = req.body;
  try {
    await db.query(
      `INSERT INTO fc_messages (student_name, parent_name, phone, message_type, message_body, status)
       VALUES (?, ?, ?, 'Payment Reminder', ?, 'Sent')`,
      [student_name, parent_name || '', phone || '', message_body || '']
    );
    res.json({ success: true, message: 'Alert recorded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
