// backend/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js'
import { Pool } from "pg";
import { pool } from "./db.js";
import projectRoutes from './routes/projectRoutes.js';

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

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', projectRoutes);

// PostgreSQL Connection Pool
/* const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
*/

// Test DB Connection
pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL successfully!"))
  .catch((err) => console.error("DB Connection Error:", err.stack));

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "ProjectFlow API + DB Ready!" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
