// ========== TIME SESSION ROUTES ==========
// Tracks time spent on tasks (Pomodoro sessions, manual tracking, etc.)
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { pool } from '../db.js';

const router = express.Router();

// ========== CREATE TIME SESSION ==========
// Log a completed work session
router.post('/', protect, async (req, res) => {
  try {
    const { 
      task_id, 
      start_time, 
      end_time, 
      duration_minutes, 
      session_type, 
      notes 
    } = req.body;
    const userId = req.user.userId;

    // Validate session_type
    const validTypes = ['pomodoro', 'manual', 'focus'];
    if (session_type && !validTypes.includes(session_type)) {
      return res.status(400).json({ message: 'Invalid session type' });
    }

    // Create time session
    const result = await pool.query(
      `INSERT INTO time_sessions (
        user_id, 
        task_id, 
        start_time, 
        end_time, 
        duration_minutes, 
        session_type, 
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        userId, 
        task_id || null, 
        start_time, 
        end_time || null, 
        duration_minutes, 
        session_type || 'pomodoro', 
        notes || null
      ]
    );

    // Update task actual_minutes if task_id provided
    if (task_id) {
      await pool.query(
        `UPDATE tasks 
         SET actual_minutes = COALESCE(actual_minutes, 0) + $1 
         WHERE id = $2`,
        [duration_minutes, task_id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Time Session Error:', error);
    res.status(500).json({ message: 'Failed to create time session' });
  }
});

// ========== GET USER'S TIME SESSIONS ==========
// Retrieve time sessions with optional filtering
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { task_id, date, limit = 50 } = req.query;

    let query = `
      SELECT 
        ts.*,
        t.title as task_title,
        p.title as project_title
      FROM time_sessions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE ts.user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    // Filter by task_id if provided
    if (task_id) {
      paramCount++;
      query += ` AND ts.task_id = $${paramCount}`;
      params.push(task_id);
    }

    // Filter by date if provided
    if (date) {
      paramCount++;
      query += ` AND DATE(ts.start_time) = $${paramCount}`;
      params.push(date);
    }

    query += ` ORDER BY ts.start_time DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (error) {
    console.error('Get Sessions Error:', error);
    res.status(500).json({ message: 'Failed to fetch time sessions' });
  }
});

// ========== GET DAILY SUMMARY ==========
// Get summary of time spent today
router.get('/today', protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
         COUNT(*) as session_count,
         SUM(duration_minutes) as total_minutes,
         session_type,
         COUNT(DISTINCT task_id) as tasks_worked_on
       FROM time_sessions
       WHERE user_id = $1 
         AND DATE(start_time) = CURRENT_DATE
       GROUP BY session_type`,
      [userId]
    );

    // Get total across all session types
    const totalResult = await pool.query(
      `SELECT 
         COUNT(*) as session_count,
         SUM(duration_minutes) as total_minutes
       FROM time_sessions
       WHERE user_id = $1 
         AND DATE(start_time) = CURRENT_DATE`,
      [userId]
    );

    res.json({
      today: result.rows,
      total: totalResult.rows[0] || { session_count: 0, total_minutes: 0 }
    });

  } catch (error) {
    console.error('Daily Summary Error:', error);
    res.status(500).json({ message: 'Failed to fetch daily summary' });
  }
});

// ========== GET WEEKLY STATISTICS ==========
// Get time tracking stats for the past week
router.get('/weekly', protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
         DATE(start_time) as date,
         SUM(duration_minutes) as total_minutes,
         COUNT(*) as session_count,
         COUNT(DISTINCT task_id) as unique_tasks
       FROM time_sessions
       WHERE user_id = $1
         AND start_time >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(start_time)
       ORDER BY date DESC`,
      [userId]
    );

    // Calculate weekly total
    const totalResult = await pool.query(
      `SELECT 
         SUM(duration_minutes) as total_minutes,
         COUNT(*) as session_count
       FROM time_sessions
       WHERE user_id = $1
         AND start_time >= CURRENT_DATE - INTERVAL '7 days'`,
      [userId]
    );

    res.json({
      daily: result.rows,
      weeklyTotal: totalResult.rows[0]
    });

  } catch (error) {
    console.error('Weekly Stats Error:', error);
    res.status(500).json({ message: 'Failed to fetch weekly statistics' });
  }
});

// ========== DELETE TIME SESSION ==========
// Remove a time session (and adjust task actual_minutes)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get session details before deleting
    const sessionResult = await pool.query(
      'SELECT task_id, duration_minutes FROM time_sessions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Time session not found' });
    }

    const { task_id, duration_minutes } = sessionResult.rows[0];

    // Delete the session
    await pool.query(
      'DELETE FROM time_sessions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    // Update task actual_minutes if applicable
    if (task_id) {
      await pool.query(
        `UPDATE tasks 
         SET actual_minutes = GREATEST(COALESCE(actual_minutes, 0) - $1, 0)
         WHERE id = $2`,
        [duration_minutes, task_id]
      );
    }

    res.json({ message: 'Time session deleted' });

  } catch (error) {
    console.error('Delete Session Error:', error);
    res.status(500).json({ message: 'Failed to delete time session' });
  }
});

export default router;