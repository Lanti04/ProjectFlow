// ========== TAGS ROUTES ==========
// Manage user tags: create, read, update, delete & filter projects/tasks by tag
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { pool } from '../db.js';

const router = express.Router();

// ========== GET ALL TAGS FOR USER ==========
router.get('/', protect, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, color FROM tags WHERE user_id = $1 ORDER BY name',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get tags error:', err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// ========== CREATE TAG ==========
router.post('/', protect, async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Tag name required' });

    const result = await pool.query(
      'INSERT INTO tags (user_id, name, color) VALUES ($1, $2, $3) RETURNING id, name, color',
      [req.user.userId, name, color || '#6366f1']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Tag already exists' });
    }
    console.error('Create tag error:', err);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// ========== UPDATE TAG ==========
router.put('/:tagId', protect, async (req, res) => {
  try {
    const { name, color } = req.body;
    const result = await pool.query(
      'UPDATE tags SET name = COALESCE($1, name), color = COALESCE($2, color) WHERE id = $3 AND user_id = $4 RETURNING id, name, color',
      [name, color, req.params.tagId, req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tag not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update tag error:', err);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// ========== DELETE TAG ==========
router.delete('/:tagId', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM tags WHERE id = $1 AND user_id = $2', [req.params.tagId, req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete tag error:', err);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
