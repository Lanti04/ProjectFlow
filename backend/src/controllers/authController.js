// ========== AUTHENTICATION CONTROLLER ==========
// Handles user registration & login with JWT token generation
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { pool } from "../db.js";

// ========== REGISTER ENDPOINT ==========
// Creates new user with hashed password & returns JWT token
export const register = async (req, res) => { 
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);  
    const password_hash = await bcrypt.hash(password, salt); 

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, password_hash]
    );

    // Create JWT
    const token = jwt.sign(
      { userId: result.rows[0].id },
      // in real apps,we  use a strong secret from env, not hardcoded , if (!process.env.JWT_SECRET) throw new Error('Missing JWT_SECRET')
      process.env.JWT_SECRET || 'fallback-secret-very-long-string', 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== LOGIN ENDPOINT ==========
// Verifies credentials & returns JWT token with current premium status
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find the user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isMatching = await bcrypt.compare(password, user.password_hash);
    if (!isMatching) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // CREATE TOKEN WITH CURRENT PREMIUM STATUS FROM DB
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isPremium: user.is_premium || false,   // ← INCLUDE PREMIUM STATUS
        planType: user.plan_type || 'free'     // ← INCLUDE PLAN TYPE
      },
      process.env.JWT_SECRET || 'fallback-secret-very-long-string',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: user.is_premium || false,  // ← RETURN PREMIUM STATUS
        planType: user.plan_type || 'free'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};