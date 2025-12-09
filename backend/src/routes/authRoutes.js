// ========== AUTHENTICATION ROUTES ==========
// Handles user registration, login, profile retrieval & logout
import express from 'express';
import { register, login } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { pool } from '../db.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// ========== GET CURRENT USER ==========
// Protected route: returns authenticated user's profile data
router.get('/me', protect, async (req, res) => {
  try {
    console.log('ME route hit — req.user:', req.user);

    /*
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456789@localhost:5432/projectflow'
    });
*/

    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    // await pool.end(); // close the temporary pool

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('ME route error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});
router.post('/logout', protect, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

export default router;
