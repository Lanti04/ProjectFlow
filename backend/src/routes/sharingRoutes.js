// ========== PROJECT SHARING ROUTES ==========
// Generate shareable links for projects; guest access without auth
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { pool } from '../db.js';
import crypto from 'crypto';

const router = express.Router();

// ========== GENERATE SHARE LINK ==========
// POST /api/projects/:projectId/share
router.post('/:projectId/share', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Verify user owns this project
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Project not found or unauthorized' });
    }

    // Generate unique token
    const token = crypto.randomBytes(16).toString('hex');

    // Update project with share token
    const result = await pool.query(
      'UPDATE projects SET sharing_token = $1, is_shared = true WHERE id = $2 RETURNING sharing_token',
      [token, projectId]
    );

    res.json({
      sharing_token: result.rows[0].sharing_token,
      share_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/shared-project/${result.rows[0].sharing_token}`
    });
  } catch (err) {
    console.error('Share project error:', err);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// ========== REVOKE SHARE LINK ==========
// DELETE /api/projects/:projectId/share
router.delete('/:projectId/share', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'UPDATE projects SET sharing_token = NULL, is_shared = false WHERE id = $1 AND user_id = $2 RETURNING id',
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Project not found or unauthorized' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Revoke share error:', err);
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
});

// ========== GET SHARED PROJECT (NO AUTH) ==========
// GET /api/projects/shared/:token
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT 
        p.id, p.title, p.description, p.deadline, p.status, p.progress, p.created_at,
        u.name as owner_name
       FROM projects p
       JOIN users u ON p.user_id = u.id
       WHERE p.sharing_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shared project not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get shared project error:', err);
    res.status(500).json({ error: 'Failed to fetch shared project' });
  }
});

// ========== GET SHARED PROJECT TASKS (NO AUTH) ==========
// GET /api/projects/shared/:token/tasks
router.get('/shared/:token/tasks', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT t.id, t.title, t.description, t.due_date, t.status, t.tag
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.sharing_token = $1
       ORDER BY t.due_date ASC NULLS LAST`,
      [token]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get shared tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch shared tasks' });
  }
});

export default router;
