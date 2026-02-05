// ========== EXPRESS SERVER SETUP ==========
// Main backend server configuration with middleware & route handlers
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js'
import { Pool } from "pg";
import { pool } from "./db.js";
import projectRoutes from './routes/projectRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import tagsRoutes from './routes/tagsRoutes.js';
import sharingRoutes from './routes/sharingRoutes.js';
import focusRoutes from './routes/focusRoutes.js';

dotenv.config({ path: ".env" }); // ← THIS FORCES IT
// DEBUG: Print exact values Node is seeing
console.log("=== ENV DEBUG ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", `"${process.env.DB_PASSWORD}"`); // quotes show spaces
console.log("DB_NAME:", process.env.DB_NAME);
console.log("=== END DEBUG ===");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARE SETUP ==========
// CORS configuration - explicitly allow frontend origin
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

// ========== API ROUTES ==========
// All endpoints prefixed with /api for organization
app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', projectRoutes);

// ========== DATABASE CONNECTION ==========
// Test connection to PostgreSQL pool
pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL successfully!"))
  .catch((err) => console.error("DB Connection Error:", err.stack));

// Test Route
app.get("/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

app.get("/", (req, res) => {
  res.json({ message: "ProjectFlow API + DB Ready!" });
});

// ========== AI ROUTES ==========
app.use('/api/ai', aiRoutes);

// ========== USER ROUTES ==========
app.use('/api/user', userRoutes);


// ========== PAYMENT ROUTES ==========
app.use('/api/payment', paymentRoutes);

// ========== CALENDAR FEED ==========
app.use('/api', calendarRoutes);

// ========== TAGS ROUTES ==========
app.use('/api/tags', tagsRoutes);

// ========== PROJECT SHARING ROUTES ==========
app.use('/api/projects', sharingRoutes);

// ========== FOCUS MODE 2.0 ROUTES ==========
app.use('/api/focus', focusRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
