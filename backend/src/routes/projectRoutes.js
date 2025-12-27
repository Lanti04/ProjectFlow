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
    const { project_id, title, due_date } = req.body;
    const userId = req.user.userId;

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [project_id, userId]
    );
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, due_date, status) VALUES ($1, $2, $3, 'todo') RETURNING *`,
      [project_id, title, due_date || null]
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

// ========== DELETE TASK ==========
// Protected route: removes task & recalculates project progress
router.delete('/tasks/:id', protect, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND project_id IN (SELECT id FROM projects WHERE user_id = $2) RETURNING project_id',
      [taskId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });

    const projectId = result.rows[0].project_id;
    const total = await pool.query('SELECT COUNT(*) FROM tasks WHERE project_id = $1', [projectId]);
    const completed = await pool.query("SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = 'completed'", [projectId]);
    const progress = total.rows[0].count === '0' ? 0 : Math.round((completed.rows[0].count / total.rows[0].count) * 100);
    await pool.query('UPDATE projects SET progress = $1 WHERE id = $2', [progress, projectId]);

    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE PROJECT 
router.delete('/projects/:id', protect, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.userId;

    await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [projectId, userId]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;