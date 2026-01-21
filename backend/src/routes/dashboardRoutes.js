// ========== DASHBOARD ROUTES ==========
// Fetches all user's projects & tasks in single endpoint
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { pool } from '../db.js';

const router = express.Router();

// ========== GET DASHBOARD DATA ==========
// Protected route: returns user's projects & tasks with joined data
router.get('/dashboard', protect, async (req, res) => { 
    try {
        const userId = req.user.userId;

        // Getting user data including streak
        const userResult = await pool.query(
            `SELECT id, name, email, study_streak, last_study_date, is_premium, plan_type 
            FROM users 
            WHERE id = $1`,
            [userId]
        );

        // Getting projects for the user
        const projectsResult = await pool.query(
            `SELECT id, title, description, deadline, status, progress, created_at 
            FROM projects 
            WHERE user_id = $1 
            ORDER BY created_at DESC`,
            [userId]
        );

        // Get all tasks (with project title for display)
        const tasksResult = await pool.query(
            `SELECT t.id, t.title, t.due_date, t.status, t.project_id, p.title AS project_title
             FROM tasks t
             LEFT JOIN projects p ON t.project_id = p.id
             WHERE p.user_id = $1
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

export default router;
