/**
 * Projects Router
 *
 * GET  /api/projects        — list all projects
 * POST /api/projects        — add a new project (admin only)
 * PUT  /api/projects/:id    — update a project  (admin only)
 * DELETE /api/projects/:id  — delete a project  (admin only)
 */

const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const requireAdmin = require('../requireAdmin');

// Static projects — Emebet's actual projects only
const staticProjects = [
  {
    id: 1,
    title: "Inventory Management System",
    description: "A comprehensive web-based inventory management system that enables businesses to track products, manage stock levels, set low-stock alerts, record purchase and sale transactions, and generate detailed inventory reports.",
    technologies: ["HTML5", "CSS3", "JavaScript", "PHP"],
    githubUrl: "https://github.com/emu1272",
    liveUrl: "",
    featured: true
  },
  {
    id: 2,
    title: "Hospital Management System",
    description: "A full-featured hospital management system that streamlines patient registration, doctor appointment scheduling, staff management, medical records, and billing operations for healthcare facilities.",
    technologies: ["HTML5", "CSS3", "PHP"],
    githubUrl: "https://github.com/emu1272",
    liveUrl: "",
    featured: true
  },
  {
    id: 3,
    title: "Vital",
    description: "A Java-based health and vital signs monitoring application that tracks patient vital statistics, generates health alerts, and maintains medical records for healthcare professionals.",
    technologies: ["Java"],
    githubUrl: "https://github.com/emu1272",
    liveUrl: "",
    featured: true
  }
];

function rowToProject(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    technologies: row.technologies ? row.technologies.split(',').map(t => t.trim()) : [],
    githubUrl: row.github_url || '',
    liveUrl: row.live_url || '',
    featured: Boolean(row.featured)
  };
}

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const pool = getPool();

    if (!pool) {
      return res.status(200).json({
        success: true,
        count: staticProjects.length,
        data: staticProjects,
        source: 'static'
      });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM projects ORDER BY featured DESC, created_at DESC'
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(rowToProject),
      source: 'database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects.',
      error: error.message
    });
  }
});

// POST /api/projects (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { title, description, technologies, githubUrl, liveUrl, featured } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required.' });
  }

  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ success: false, message: 'Database is not configured.' });
  }

  try {
    const techString = Array.isArray(technologies) ? technologies.join(',') : (technologies || '');
    const [result] = await pool.execute(
      'INSERT INTO projects (title, description, technologies, github_url, live_url, featured) VALUES (?, ?, ?, ?, ?, ?)',
      [title.trim(), description.trim(), techString, githubUrl || '', liveUrl || '', featured ? 1 : 0]
    );
    res.status(201).json({ success: true, message: 'Project created.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create project.', error: error.message });
  }
});

// PUT /api/projects/:id (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { title, description, technologies, githubUrl, liveUrl, featured } = req.body;
  const { id } = req.params;

  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ success: false, message: 'Database is not configured.' });
  }

  try {
    const techString = Array.isArray(technologies) ? technologies.join(',') : (technologies || '');
    const [result] = await pool.execute(
      'UPDATE projects SET title=?, description=?, technologies=?, github_url=?, live_url=?, featured=? WHERE id=?',
      [title.trim(), description.trim(), techString, githubUrl || '', liveUrl || '', featured ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    res.status(200).json({ success: true, message: 'Project updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update project.', error: error.message });
  }
});

// DELETE /api/projects/:id (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ success: false, message: 'Database is not configured.' });
  }

  try {
    const [result] = await pool.execute('DELETE FROM projects WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    res.status(200).json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete project.', error: error.message });
  }
});

module.exports = router;
