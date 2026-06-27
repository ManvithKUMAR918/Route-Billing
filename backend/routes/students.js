const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all students
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM students ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Students GET error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
});

// GET single student
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add student
router.post('/', async (req, res) => {
  const { admission_no, name, dob, gender, class: cls, section, phone, parent_id } = req.body;
  if (!name || !admission_no) return res.status(400).json({ success: false, message: 'Name and admission number required' });
  try {
    const [result] = await db.query(
      'INSERT INTO students (admission_no, name, dob, gender, class, section, phone, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [admission_no, name, dob, gender, cls, section, phone, parent_id]
    );
    res.json({ success: true, message: 'Student added', data: { id: result.insertId, ...req.body } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Admission number already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
