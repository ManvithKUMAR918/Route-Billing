const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/enquiries ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM fc_enquiries';
    const params = [];
    if (status) { sql += ' WHERE status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /enquiries:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/enquiries ─────────────────────────────────────
router.post('/', async (req, res) => {
  const { student_name, parent_name, phone, email, class: cls,
          address, route_requested, source, owner, notes, priority } = req.body;

  // Validation
  const errors = {};
  if (!student_name?.trim()) errors.student_name = 'Student name is required';
  if (!phone?.trim()) errors.phone = 'Phone number is required';
  else if (!/^\d{10}$/.test(phone.trim())) errors.phone = 'Enter a valid 10-digit phone number';
  if (email && !/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email address';
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  // Duplicate check
  const [dup] = await db.query(
    'SELECT id FROM fc_enquiries WHERE phone = ? AND route_requested = ? LIMIT 1',
    [phone.trim(), route_requested || '']
  );
  if (dup.length > 0) {
    return res.status(409).json({
      success: false,
      message: `A record with phone ${phone} and route "${route_requested}" already exists.`,
      duplicate: true,
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO fc_enquiries
       (student_name, parent_name, phone, email, class, address,
        route_requested, source, owner, notes, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        student_name.trim(), parent_name || null, phone.trim(),
        email || null, cls || null, address || null,
        route_requested || null,
        source || 'parent_portal', owner || 'Admin',
        notes || null, priority || 'medium',
      ]
    );
    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', id: result.insertId });
  } catch (err) {
    console.error('POST /enquiries:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/enquiries/:id ──────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, owner, notes, priority } = req.body;

  // Fetch current record
  const [[enquiry]] = await db.query('SELECT * FROM fc_enquiries WHERE id = ?', [id]);
  if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

  // Status flow validation
  const FLOW = { pending: 0, in_progress: 1, resolved: 2 };
  if (status && FLOW[status] !== undefined) {
    if (FLOW[status] < FLOW[enquiry.status]) {
      return res.status(400).json({ success: false, message: 'Cannot go backward in status flow' });
    }
    if (enquiry.status === 'resolved') {
      return res.status(400).json({ success: false, message: 'Resolved enquiry cannot be changed' });
    }
  }

  const updates = {};
  if (status)   updates.status   = status;
  if (owner)    updates.owner    = owner;
  if (notes !== undefined) updates.notes = notes;
  if (priority) updates.priority = priority;
  updates.last_updated = new Date();

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values     = [...Object.values(updates), id];

  try {
    await db.query(`UPDATE fc_enquiries SET ${setClauses} WHERE id = ?`, values);

    // When resolved → auto-create student record in existing students table
    if (status === 'resolved' && enquiry.status !== 'resolved') {
      await autoCreateFromEnquiry(enquiry);
    }

    res.json({ success: true, message: 'Enquiry updated' });
  } catch (err) {
    console.error('PUT /enquiries/:id:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Helper: auto-create records on resolve ──────────────────
async function autoCreateFromEnquiry(enquiry) {
  try {
    // Check duplicate in fc_transport
    const [existing] = await db.query(
      'SELECT id FROM fc_transport WHERE student_name = ? AND route_name = ? LIMIT 1',
      [enquiry.student_name, enquiry.route_requested || '']
    );

    if (existing.length === 0) {
      // 1. Create transport record
      await db.query(
        `INSERT INTO fc_transport (student_name, class, route_name, pickup_point, drop_point, monthly_fee, status)
         VALUES (?, ?, ?, '', '', 0, 'active')`,
        [enquiry.student_name, enquiry.class || '', enquiry.route_requested || '']
      );

      // 2. Create pending payment for current month
      const now = new Date();
      const monthLabel = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear();
      await db.query(
        `INSERT INTO fc_payments (student_name, class, amount_paid, payment_date, payment_mode, month_paid, remarks)
         VALUES (?, ?, 0, ?, 'cash', ?, 'Auto-created on enquiry resolution')`,
        [enquiry.student_name, enquiry.class || '', now.toISOString().split('T')[0], monthLabel]
      );

      // 3. Create pending due for current month
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 10)
        .toISOString().split('T')[0];
      await db.query(
        `INSERT INTO fc_dues (student_name, route_name, due_amount, due_month, due_date, status)
         VALUES (?, ?, 0, ?, ?, 'pending')`,
        [enquiry.student_name, enquiry.route_requested || '', monthLabel, dueDate]
      );
    }

    // 4. AUTO-LOG a completed follow-up (always, even if transport already existed)
    await db.query(
      `INSERT INTO fc_followups
       (student_name, counsellor, action_taken, action_type, next_action, priority, status)
       VALUES (?, ?, ?, 'admin', 'Enquiry resolved — student admitted to transport', ?, 'completed')`,
      [
        enquiry.student_name,
        enquiry.owner || 'Admin',
        `Enquiry resolved by ${enquiry.owner || 'Admin'}. Student admitted for route: ${enquiry.route_requested || 'N/A'}. Source: ${enquiry.source || 'N/A'}.`,
        enquiry.priority || 'medium',
      ]
    );

  } catch (err) {
    console.error('autoCreateFromEnquiry error:', err.message);
  }
}

module.exports = router;
