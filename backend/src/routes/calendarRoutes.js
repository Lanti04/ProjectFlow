// ========== CALENDAR ICS ROUTE ==========
// Generates a user-specific .ics calendar feed including project deadlines and task due dates
import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { createEvents } from 'ics';
import { parseISO } from 'date-fns';

const router = express.Router();

// Helper: convert JS Date to ICS start array [YYYY, M, D]
function dateToStartArray(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
}

// GET /api/calendar.ics?token=JWT
// Supports Authorization: Bearer <token> OR query param `token` for device subscriptions
router.get('/calendar.ics', async (req, res) => {
  try {
    // Accept token from query param (useful for calendar subscriptions on phones)
    const token = req.query.token || (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);

    if (!token) return res.status(401).send('Not authorized');

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-very-long-string');
    } catch (err) {
      return res.status(401).send('Invalid token');
    }

    const userId = decoded.userId;

    // Fetch projects (deadlines)
    const projectsResult = await pool.query(
      'SELECT id, title, deadline, progress FROM projects WHERE user_id = $1',
      [userId]
    );

    // Fetch tasks (belonging to user's projects)
    const tasksResult = await pool.query(
      `SELECT t.id, t.title, t.due_date, t.status, p.title AS project_title
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1`,
      [userId]
    );

    const events = [];

    // Projects -> all-day event on deadline
    for (const project of projectsResult.rows) {
      if (!project.deadline || typeof project.deadline !== 'string') continue;
      try {
        const d = parseISO(project.deadline);
        if (Number.isNaN(d.getTime())) continue;

        events.push({
          title: `Project: ${project.title}`,
          description: `Project deadline. Progress: ${project.progress ?? 0}%`,
          start: dateToStartArray(d),
          duration: { days: 1 },
          uid: `project-${project.id}@projectflow`,
        });
      } catch (e) {
        console.warn(`Invalid project deadline for project ${project.id}:`, project.deadline);
      }
    }

    // Tasks -> all-day event on due_date
    for (const task of tasksResult.rows) {
      if (!task.due_date || typeof task.due_date !== 'string') continue;
      try {
        const d = parseISO(task.due_date);
        if (Number.isNaN(d.getTime())) continue;

      const title = task.project_title ? `Task: ${task.title} (${task.project_title})` : `Task: ${task.title}`;

      events.push({
        title,
        description: `Task status: ${task.status}`,
        start: dateToStartArray(d),
        duration: { days: 1 },
        uid: `task-${task.id}@projectflow`,
      });
      } catch (e) {
        console.warn(`Invalid task due_date for task ${task.id}:`, task.due_date);
      }
    }

    // Create ICS
    createEvents(events, (error, value) => {
      if (error) {
        console.error('ICS generation error:', error);
        return res.status(500).send('Failed to generate calendar');
      }

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      // Suggest filename; many clients accept direct URL subscription
      res.setHeader('Content-Disposition', `attachment; filename="projectflow-${userId}.ics"`);
      // Prevent caching for privacy
      res.setHeader('Cache-Control', 'no-store');

      return res.send(value);
    });
  } catch (err) {
    console.error('Calendar route error:', err);
    return res.status(500).send('Server error');
  }
});

export default router;
