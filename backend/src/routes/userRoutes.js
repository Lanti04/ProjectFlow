import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { pool } from '../db.js';
import { format, startOfDay, isToday } from 'date-fns';

const router = express.Router();

// UPDATE STREAK WHEN USER COMPLETES A TASK
router.post('/update-streak', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = startOfDay(new Date());

    const result = await pool.query(
      'SELECT study_streak, last_study_date FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    let newStreak = user.study_streak || 0;

    if (!user.last_study_date || !isToday(new Date(user.last_study_date))) {
      // New day — increment streak
      newStreak = user.last_study_date ? newStreak + 1 : 1;
    }

    await pool.query(
      'UPDATE users SET study_streak = $1, last_study_date = $2 WHERE id = $3',
      [newStreak, today, userId]
    );

    res.json({ streak: newStreak });
  } catch (err) {
    console.error('Streak update error:', err);
    res.status(500).json({ error: 'Failed to update streak' });
  }
});

export default router;