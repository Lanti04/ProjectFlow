// ========== PROJECT & TASK ROUTES ==========
// CRUD operations for projects & tasks with progress auto-calculation
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { pool } from "../db.js";

const router = express.Router();

// ========== CREATE PROJECT ==========
// Protected route: inserts new project for authenticated user
router.post('/projects', protect, async (req, res) => {
  try {
    const { title, description, deadline } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(
      'INSERT INTO projects (user_id, title, description, deadline, progress) VALUES ($1, $2, $3, $4, 0) RETURNING *',
      [userId, title, description || null, deadline || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== CREATE TASK ==========
// Protected route: creates task within project & validates ownership
router.post('/tasks', protect, async (req, res) => {
  try {
    const { project_id, title, due_date, tag } = req.body;
    const userId = req.user.userId;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [project_id, userId]
    );
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, due_date, tag, status) VALUES ($1, $2, $3, $4, 'todo') RETURNING *`,
      [project_id, title, due_date || null, tag || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== TOGGLE TASK COMPLETION ==========
// Protected route: toggles task status & auto-updates project progress
router.patch('/tasks/:id/toggle', protect, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;

    const result = await pool.query(
      `UPDATE tasks 
       SET status = CASE WHEN status = 'completed' THEN 'todo' ELSE 'completed' END
       WHERE id = $1 AND project_id IN (SELECT id FROM projects WHERE user_id = $2)
       RETURNING *`,
      [taskId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Task not found' });

    const projectId = result.rows[0].project_id;
    const total = await pool.query('SELECT COUNT(*) FROM tasks WHERE project_id = $1', [projectId]);
    const completed = await pool.query("SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = 'completed'", [projectId]);
    const progress = total.rows[0].count === '0' ? 0 : Math.round((completed.rows[0].count / total.rows[0].count) * 100);
    await pool.query('UPDATE projects SET progress = $1 WHERE id = $2', [progress, projectId]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== SOFT DELETE TASK ==========
// Protected route: soft deletes task (marks as deleted) & recalculates project progress
router.delete('/tasks/:id', protect, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;

    const result = await pool.query(
      'UPDATE tasks SET deleted_at = NOW() WHERE id = $1 AND project_id IN (SELECT id FROM projects WHERE user_id = $2) RETURNING project_id',
      [taskId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });

    const projectId = result.rows[0].project_id;
    const total = await pool.query('SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND deleted_at IS NULL', [projectId]);
    const completed = await pool.query("SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = 'completed' AND deleted_at IS NULL", [projectId]);
    const progress = total.rows[0].count === '0' ? 0 : Math.round((completed.rows[0].count / total.rows[0].count) * 100);
    await pool.query('UPDATE projects SET progress = $1 WHERE id = $2', [progress, projectId]);

    res.json({ message: 'Task moved to trash' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== SOFT DELETE PROJECT ==========
// Protected route: soft deletes project (marks as deleted)
router.delete('/projects/:id', protect, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.userId;

    await pool.query('UPDATE projects SET deleted_at = NOW() WHERE id = $1 AND user_id = $2', [projectId, userId]);
    res.json({ message: 'Project moved to trash' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== RESTORE TASK ==========
// Protected route: restores a soft-deleted task
router.post('/tasks/:id/restore', protect, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;

    const result = await pool.query(
      'UPDATE tasks SET deleted_at = NULL WHERE id = $1 AND project_id IN (SELECT id FROM projects WHERE user_id = $2) RETURNING project_id',
      [taskId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });

    const projectId = result.rows[0].project_id;
    const total = await pool.query('SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND deleted_at IS NULL', [projectId]);
    const completed = await pool.query("SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = 'completed' AND deleted_at IS NULL", [projectId]);
    const progress = total.rows[0].count === '0' ? 0 : Math.round((completed.rows[0].count / total.rows[0].count) * 100);
    await pool.query('UPDATE projects SET progress = $1 WHERE id = $2', [progress, projectId]);

    res.json({ message: 'Task restored' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== RESTORE PROJECT ==========
// Protected route: restores a soft-deleted project
router.post('/projects/:id/restore', protect, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.userId;

    await pool.query('UPDATE projects SET deleted_at = NULL WHERE id = $1 AND user_id = $2', [projectId, userId]);
    res.json({ message: 'Project restored' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== PERMANENTLY DELETE TASK ==========
// Protected route: permanently deletes a soft-deleted task
router.delete('/tasks/:id/permanent', protect, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND project_id IN (SELECT id FROM projects WHERE user_id = $2) AND deleted_at IS NOT NULL RETURNING project_id',
      [taskId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });

    res.json({ message: 'Task permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== PERMANENTLY DELETE PROJECT ==========
// Protected route: permanently deletes a soft-deleted project and all its tasks
router.delete('/projects/:id/permanent', protect, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.userId;

    // First delete all tasks associated with this project
    await pool.query('DELETE FROM tasks WHERE project_id = $1', [projectId]);
    
    // Then delete the project
    const result = await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL', [projectId, userId]);

    if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });

    res.json({ message: 'Project permanently deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;