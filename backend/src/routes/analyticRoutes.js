// ========== ANALYTICS ROUTES ==========
// Provides comprehensive analytics data for dashboard insights
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { pool } from '../db.js';

const router = express.Router();

// ========== GET ANALYTICS DATA ==========
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    const analytics = {
      totalProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      upcomingTasks: 0,       // NEW
      completionRate: 0,
      upcomingDeadlines: [],
      priorityDistribution: [], // NEW
      timeStats: []             // NEW
    };

    // ===== Total projects =====
    const projectResults = await pool.query(
      'SELECT COUNT(*) FROM projects WHERE user_id = $1 AND deleted_at IS NULL',
      [userId]
    );
    analytics.totalProjects = parseInt(projectResults.rows[0].count, 10);

    // ===== Task statistics =====
    const taskResults = await pool.query(
      `SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE t.status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'completed') AS overdue,
        COUNT(*) FILTER (WHERE t.due_date >= CURRENT_DATE AND t.status != 'completed') AS upcoming,
        SUM(COALESCE(t.actual_minutes, 0)) AS total_minutes_spent
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = $1 AND t.deleted_at IS NULL AND p.deleted_at IS NULL`,
      [userId]
    );

    analytics.totalTasks = parseInt(taskResults.rows[0].total, 10);
    analytics.completedTasks = parseInt(taskResults.rows[0].completed, 10);
    analytics.overdueTasks = parseInt(taskResults.rows[0].overdue, 10);
    analytics.upcomingTasks = parseInt(taskResults.rows[0].upcoming, 10);
    analytics.totalMinutesSpent = parseInt(taskResults.rows[0].total_minutes_spent, 10);

    // ===== Completion rate =====
    analytics.completionRate =
      analytics.totalTasks > 0
        ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100)
        : 0;

    // ===== Upcoming deadlines with priority =====
    const deadlineResults = await pool.query(
      `SELECT 
         t.id,
         t.title, 
         t.due_date,
         t.priority,
         t.difficulty,
         p.title AS project_title,
         p.color AS project_color
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE 
         p.user_id = $1
         AND t.due_date IS NOT NULL
         AND t.due_date >= CURRENT_DATE
         AND t.status != 'completed'
         AND t.deleted_at IS NULL
         AND p.deleted_at IS NULL
       ORDER BY 
         t.priority DESC,
         t.due_date ASC
       LIMIT 10`,
      [userId]
    );
    analytics.upcomingDeadlines = deadlineResults.rows;

    // ===== Priority distribution =====
    const priorityResults = await pool.query(
      `SELECT 
         t.priority,
         COUNT(*) as count
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1 
         AND t.deleted_at IS NULL 
         AND p.deleted_at IS NULL
       GROUP BY t.priority
       ORDER BY t.priority`,
      [userId]
    );
    analytics.priorityDistribution = priorityResults.rows;

    // ===== Time tracking stats (last 30 days) =====
    const timeStatsResults = await pool.query(
      `SELECT 
         DATE(start_time) as date,
         SUM(duration_minutes) as total_minutes,
         COUNT(*) as session_count
       FROM time_sessions
       WHERE user_id = $1
         AND start_time >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(start_time)
       ORDER BY date DESC`,
      [userId]
    );
    analytics.timeStats = timeStatsResults.rows;

    res.json(analytics);

  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// ========== GET TIME SESSION STATISTICS ==========
// NEW endpoint for detailed time analytics
router.get('/time-stats', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'week' } = req.query; // week, month, year

    const intervals = {
      week: '7 days',
      month: '30 days',
      year: '365 days'
    };

    // Get time sessions grouped by date and hour
    const sessionsResult = await pool.query(
      `SELECT 
         DATE(start_time) as date,
         EXTRACT(HOUR FROM start_time) as hour,
         SUM(duration_minutes) as total_minutes,
         COUNT(*) as session_count
       FROM time_sessions
       WHERE user_id = $1
         AND start_time >= CURRENT_DATE - INTERVAL '${intervals[period]}'
       GROUP BY DATE(start_time), EXTRACT(HOUR FROM start_time)
       ORDER BY date DESC, hour`,
      [userId]
    );

    // Calculate most productive hour
    const productiveHourResult = await pool.query(
      `SELECT 
         EXTRACT(HOUR FROM start_time) as hour,
         SUM(duration_minutes) as total_minutes
       FROM time_sessions
       WHERE user_id = $1
         AND start_time >= CURRENT_DATE - INTERVAL '${intervals[period]}'
       GROUP BY EXTRACT(HOUR FROM start_time)
       ORDER BY total_minutes DESC
       LIMIT 1`,
      [userId]
    );

    res.json({
      sessions: sessionsResult.rows,
      mostProductiveHour: productiveHourResult.rows[0]?.hour || null,
      period
    });

  } catch (err) {
    console.error('Time Stats Error:', err);
    res.status(500).json({ message: 'Failed to fetch time statistics' });
  }
});

export default router;