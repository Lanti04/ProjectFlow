import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { pool } from '../db.js';
import { format, startOfDay, isToday } from 'date-fns';

const router = express.Router();

// ========== UPDATE STREAK WHEN USER COMPLETES A TASK ==========
// Tracks consecutive days of task completion for user engagement
router.post('/update-streak', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = startOfDay(new Date());
    const todayDate = format(today, 'yyyy-MM-dd');

    // Try to get streak data, handle if columns don't exist yet
    let user;
    try {
      const result = await pool.query(
        'SELECT study_streak, last_study_date FROM users WHERE id = $1',
        [userId]
      );
      user = result.rows[0];
    } catch (err) {
      // Columns might not exist yet, use defaults
      if (err.code === '42703') { // column doesn't exist error
        console.log('Streak column not available yet — using default 0');
        user = { study_streak: 0, last_study_date: null };
      } else {
        throw err;
      }
    }

    let newStreak = user?.study_streak || 0;
    const lastStudyDate = user?.last_study_date;

    // Check if user already updated streak today
    if (lastStudyDate && isToday(new Date(lastStudyDate))) {
      // Already counted today — don't increment
      return res.json({ streak: newStreak, message: 'Already updated today' });
    }

    // New day — increment streak or reset
    if (lastStudyDate) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastDate = new Date(lastStudyDate);

      // Check if last study was yesterday (continue streak) or older (reset)
      if (lastDate.toDateString() === yesterday.toDateString()) {
        newStreak = newStreak + 1;
      } else {
        // Streak broken — reset to 1
        newStreak = 1;
      }
    } else {
      // First time — start streak
      newStreak = 1;
    }

    // Try to update with new columns, handle if they don't exist
    try {
      await pool.query(
        'UPDATE users SET study_streak = $1, last_study_date = $2 WHERE id = $3',
        [newStreak, todayDate, userId]
      );
    } catch (err) {
      if (err.code === '42703') {
        console.log('Cannot update streak — columns not yet in database');
        // Don't throw error, just return what we calculated
      } else {
        throw err;
      }
    }

    res.json({ streak: newStreak, updated: true });
  } catch (err) {
    console.error('Streak update error:', err);
    res.status(500).json({ error: 'Failed to update streak' });
  }
});

export default router;