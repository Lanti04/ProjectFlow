// ========== DASHBOARD ROUTES ==========
// Fetches all user's projects & tasks in single endpoint
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import pkg from 'pg';
import { pool } from '../db.js';

const { Pool } = pkg;

const router = express.Router();

/* const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456789@localhost:5432/projectflow'
});
*/

// getting everything the dashboard needs
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get projects
    const projectsResult = await pool.query(
      `SELECT id, title, description, deadline, status, progress, created_at 
       FROM projects 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Get tasks
    const tasksResult = await pool.query(
      `SELECT t.id, t.title, t.due_date, t.status, t.project_id, p.title AS project_title
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1
       ORDER BY t.due_date ASC NULLS LAST`,
      [userId]
    );

    // Get user data — SAFE, EVEN IF COLUMN MISSING
    let studyStreak = 0;
    let isPremium = false;
    let planType = 'free';

    try {
      const userResult = await pool.query(
        'SELECT study_streak, is_premium, plan_type FROM users WHERE id = $1',
        [userId]
      );
      if (userResult.rows[0]) {
        studyStreak = userResult.rows[0].study_streak || 0;
        isPremium = userResult.rows[0].is_premium || false;
        planType = userResult.rows[0].plan_type || 'free';
      }
    } catch (err) {
      console.log('Streak column not available yet — using default 0');
      // Ignore error — column might be added later
    }

    res.json({
      projects: projectsResult.rows,
      tasks: tasksResult.rows,
      user: {
        study_streak: studyStreak,
        isPremium: isPremium,
        planType: planType
      }
    });
  } catch (error) {
    console.error('Dashboard route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
