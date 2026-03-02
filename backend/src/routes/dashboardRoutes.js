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
      `SELECT id, name, email, study_streak, last_study_date, is_premium, premium_expires_at 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    // ===== Get projects with NEW fields =====
    const projectsResult = await pool.query(
      `SELECT 
         p.id, 
         p.title, 
         p.description, 
         p.deadline, 
         p.status, 
         p.progress,
         p.color,           -- NEW
         p.emoji,           -- NEW
         p.start_date,      -- NEW
         p.priority,        -- NEW
         p.created_at,
         COUNT(t.id) as task_count,
         COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_count
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL
       WHERE p.user_id = $1 AND p.deleted_at IS NULL
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [userId]
    );

    // ===== Get tasks with NEW fields =====
    const tasksResult = await pool.query(
      `SELECT 
          t.id,
          t.title,
          t.description,        -- NEW
          t.due_date,
          t.status,
          t.project_id,
          t.difficulty,
          t.priority,           -- NEW
          t.estimated_minutes,  -- NEW
          t.actual_minutes,     -- NEW
          t.tag,
          p.title AS project_title,
          p.color AS project_color,  -- NEW
          p.emoji AS project_emoji   -- NEW
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1
         AND t.deleted_at IS NULL
         AND p.deleted_at IS NULL
       ORDER BY 
         CASE WHEN t.due_date = CURRENT_DATE THEN 0 ELSE 1 END,
         t.priority DESC,
         t.due_date ASC NULLS LAST`,
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
      `SELECT 
         id, title, description, deadline, status, progress, 
         color, emoji, start_date, priority,
         created_at, deleted_at 
       FROM projects 
       WHERE user_id = $1 AND deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`,
      [userId]
    );

    // ===== Get deleted tasks =====
    const tasksResult = await pool.query(
      `SELECT 
          t.id,
          t.title,
          t.description,
          t.due_date,
          t.status,
          t.project_id,
          t.difficulty,
          t.priority,
          t.estimated_minutes,
          t.tag,
          t.deleted_at,
          p.title AS project_title,
          p.color AS project_color,
          p.emoji AS project_emoji
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