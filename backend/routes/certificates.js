const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const requireAdmin = require('../requireAdmin');

// Static fallback when DB not connected
const staticCertificates = [];

// GET /api/certificates — public
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.json({ success: true, count: 0, data: staticCertificates, source: 'static' });
    }
    const [rows] = await pool.execute('SELECT * FROM certificates ORDER BY created_at DESC');
    res.json({ success: true, count: rows.length, data: rows, source: 'database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/certificates — admin only
router.post('/', requireAdmin, async (req, res) => {
  const { title, issuer, date, file_url } = req.body;
  if (!title || !issuer || !date) {
    return res.status(400).json({ success: false, message: 'Title, issuer and date are required.' });
  }
  const pool = getPool();
  if (!pool) return res.status(503).json({ success: false, message: 'Database not configured.' });

  try {
    const [result] = await pool.execute(
      'INSERT INTO certificates (title, issuer, date, file_url) VALUES (?, ?, ?, ?)',
      [title.trim(), issuer.trim(), date.trim(), file_url || '']
    );
    res.status(201).json({ success: true, message: 'Certificate added.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/certificates/:id — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ success: false, message: 'Database not configured.' });

  try {
    const [result] = await pool.execute('DELETE FROM certificates WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, message: 'Certificate deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
