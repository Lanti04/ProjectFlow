// ========== FOCUS MODE 2.0 ROUTES ==========
// Track focus sessions, calculate session stats, update streak on session completion
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { pool } from '../db.js';
import { format, startOfDay, isToday } from 'date-fns';

const router = express.Router();

// ========== START FOCUS SESSION ==========
// POST /api/focus/start { projectId?, durationMinutes }
router.post('/start', protect, async (req, res) => {
  try {
    const { projectId, durationMinutes } = req.body;
    const userId = req.user.userId;

    if (!durationMinutes || durationMinutes <= 0) {
      return res.status(400).json({ error: 'Duration must be > 0' });
    }

    const result = await pool.query(
      `INSERT INTO focus_sessions (user_id, project_id, duration_minutes)
       VALUES ($1, $2, $3)
       RETURNING id, started_at`,
      [userId, projectId || null, durationMinutes]
    );

    res.status(201).json({
      session_id: result.rows[0].id,
      started_at: result.rows[0].started_at,
      duration_minutes: durationMinutes
    });
  } catch (err) {
    console.error('Start focus session error:', err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// ========== END FOCUS SESSION ==========
// POST /api/focus/:sessionId/end { tasksCompleted }
router.post('/:sessionId/end', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { tasksCompleted } = req.body;
    const userId = req.user.userId;
    const now = new Date();

    // Get session details
    const session = await pool.query(
      'SELECT * FROM focus_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update session with end time and tasks completed
    const updated = await pool.query(
      `UPDATE focus_sessions
       SET ended_at = NOW(), tasks_completed = $1
       WHERE id = $2
       RETURNING *`,
      [tasksCompleted || 0, sessionId]
    );

    // Update streak if session completed today
    const today = startOfDay(now);
    const todayDate = format(today, 'yyyy-MM-dd');

    // Check if user already has a session today
    const existingSession = await pool.query(
      `SELECT COUNT(*) as count FROM focus_sessions
       WHERE user_id = $1 AND ended_at IS NOT NULL
       AND DATE(ended_at) = $2`,
      [userId, todayDate]
    );

    // If this is the first completed session today, update streak
    if (parseInt(existingSession.rows[0].count) === 1) {
      const user = await pool.query(
        'SELECT study_streak, last_study_date FROM users WHERE id = $1',
        [userId]
      );

      let newStreak = user.rows[0]?.study_streak || 0;
      const lastStudyDate = user.rows[0]?.last_study_date;

      if (lastStudyDate) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastDate = new Date(lastStudyDate);

        if (lastDate.toDateString() === yesterday.toDateString()) {
          newStreak = newStreak + 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      await pool.query(
        'UPDATE users SET study_streak = $1, last_study_date = $2 WHERE id = $3',
        [newStreak, todayDate, userId]
      );
    }

    res.json({
      session: updated.rows[0],
      message: 'Session completed!'
    });
  } catch (err) {
    console.error('End focus session error:', err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// ========== GET USER FOCUS STATS ==========
// GET /api/focus/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Total sessions this week
    const weekSessions = await pool.query(
      `SELECT COUNT(*) as count, SUM(duration_minutes) as total_minutes
       FROM focus_sessions
       WHERE user_id = $1 AND ended_at IS NOT NULL
       AND ended_at >= NOW() - INTERVAL '7 days'`,
      [userId]
    );

    // Today's sessions
    const todaySessions = await pool.query(
      `SELECT COUNT(*) as count, SUM(duration_minutes) as total_minutes
       FROM focus_sessions
       WHERE user_id = $1 AND DATE(ended_at) = CURRENT_DATE`,
      [userId]
    );

    // Longest streak (consecutive days with sessions)
    const sessions = await pool.query(
      `SELECT DATE(ended_at) as session_date
       FROM focus_sessions
       WHERE user_id = $1 AND ended_at IS NOT NULL
       ORDER BY DATE(ended_at) DESC`,
      [userId]
    );

    res.json({
      week_sessions: parseInt(weekSessions.rows[0].count),
      week_minutes: parseInt(weekSessions.rows[0].total_minutes) || 0,
      today_sessions: parseInt(todaySessions.rows[0].count),
      today_minutes: parseInt(todaySessions.rows[0].total_minutes) || 0
    });
  } catch (err) {
    console.error('Get focus stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
