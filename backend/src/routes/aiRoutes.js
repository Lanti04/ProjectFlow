import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateText } from 'ai';
import { xai } from '@ai-sdk/xai';
import { pool } from '../db.js';

const router = express.Router();

// Get user's data for AI context
const getUserContext = async (userId) => {
  const tasks = await pool.query(
    'SELECT title, due_date, status FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.user_id = $1 ORDER BY due_date ASC LIMIT 10',
    [userId]
  );

  const projects = await pool.query(
    'SELECT title, progress FROM projects WHERE user_id = $1',
    [userId]
  );

  return {
    tasks: tasks.rows,
    projects: projects.rows
  };
};

/*
router.post('/chat', protect, async (req, res) => {
  try {
    if (!req.user.isPremium) {
      return res.status(403).json({ error: 'Upgrade to Premium for AI access' });
    }

    const { message } = req.body;
    const userId = req.user.userId;

    const context = await getUserContext(userId);

    const { text } = await generateText({
      model: xai('grok-beta'), // Latest model 
      prompt: `
You are Grok, the helpful AI assistant for ProjectFlow, a student task manager. Be encouraging, concise, and useful. Use bullet points for lists.

User's data:
Tasks: ${JSON.stringify(context.tasks, null, 2)}
Projects: ${JSON.stringify(context.projects, null, 2)}

User's message: ${message}

Respond in <200 words. Focus on tasks, progress, motivation, or scheduling. Be fun and supportive!
      `,
      maxTokens: 500,
      temperature: 0.7, // Creative but focused
    });

    res.json({ reply: text });
  } catch (err) {
    console.error('Grok Error:', err);
    res.status(500).json({ message: 'Grok is busy — try again!' });
  }
});
*/

// SIMPLE HARDCODED RESPONSES FOR DEMO PURPOSES
router.post('/chat', protect, async (req, res) => {
  const msg = req.body.message.toLowerCase();

  let reply = "Hey! I'm Grok, your AI study buddy!";

  if (msg.includes('today') || msg.includes('due')) reply = "You have 3 tasks due today — let's crush them one by one!";
  else if (msg.includes('progress')) reply = "You're 78% done this week — that's elite level!";
  else if (msg.includes('motivate')) reply = "You've got this! One task at a time. You're building your future.";
  else if (msg.includes('exam') || msg.includes('test')) reply = "Exam mode activated. Want me to quiz you on your tasks?";
  else reply = `You said: "${req.body.message}". I'm learning fast — keep going!`;

  await new Promise(r => setTimeout(r, 1200)); // fake thinking
  res.json({ reply });
});

export default router;