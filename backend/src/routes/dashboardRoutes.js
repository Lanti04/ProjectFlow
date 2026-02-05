// ========== DASHBOARD ROUTES ==========
// Fetches all user's projects & tasks in single endpoint
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { pool } from '../db.js';

const router = express.Router();

// ========== GET DASHBOARD DATA ==========
router.get('/dashboard', protect, async (req, res) => { 
  try {
    const userId = req.user.userId;

    // ===== Get user =====
    const userResult = await pool.query(
      `SELECT id, name, email, study_streak, last_study_date, is_premium, plan_type 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    // ===== Get projects =====
    const projectsResult = await pool.query(
      `SELECT id, title, description, deadline, status, progress, created_at 
       FROM projects 
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );

    // ===== Get tasks (WITH difficulty) =====
    const tasksResult = await pool.query(
      `SELECT 
          t.id,
          t.title,
          t.due_date,
          t.status,
          t.project_id,
          t.difficulty,          -- ✅ ADDED
          p.title AS project_title
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1
         AND t.deleted_at IS NULL
         AND p.deleted_at IS NULL
       ORDER BY t.due_date ASC NULLS LAST`,
      [userId]
    );

    res.json({
      user: userResult.rows[0],
      projects: projectsResult.rows,
      tasks: tasksResult.rows
    });

  } catch (error) {
    console.error('Dashboard route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== GET TRASH DATA ==========
router.get('/trash', protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    // ===== Get deleted projects =====
    const projectsResult = await pool.query(
      `SELECT id, title, description, deadline, status, progress, created_at, deleted_at 
       FROM projects 
       WHERE user_id = $1 AND deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`,
      [userId]
    );

    // ===== Get deleted tasks (WITH difficulty) =====
    const tasksResult = await pool.query(
      `SELECT 
          t.id,
          t.title,
          t.due_date,
          t.status,
          t.project_id,
          t.difficulty,          -- ✅ ADDED
          t.deleted_at,
          p.title AS project_title
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1
         AND t.deleted_at IS NOT NULL
       ORDER BY t.deleted_at DESC`,
      [userId]
    );

    res.json({
      projects: projectsResult.rows,
      tasks: tasksResult.rows
    });

  } catch (error) {
    console.error('Trash route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
