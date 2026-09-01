// Database migration runner
// Applies SQL migrations in order to set up the database schema

import { pool } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration files in order of execution
const migrations = [
  '../../database/create-users-table.sql',
  '../../models/schema.sql',
  '../../models/migration-add-streak.sql',
  '../../models/migration-add-tags-sharing-focus.sql',
  '../../models/migration-soft-delete.sql',
  '../../models/migration-weekly-planner.sql',
  '../../models/seed.sql'
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migrations...\n');
    
    for (const migrationPath of migrations) {
      const fullPath = path.join(__dirname, migrationPath);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`Skipping ${migrationPath} - file not found`);
        continue;
      }
      
      const sql = fs.readFileSync(fullPath, 'utf8');
      const fileName = path.basename(migrationPath);
      
      console.log(`Running: ${fileName}`);
      
      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          await client.query(statement);
        }
      }
      
      console.log(`✓ Completed: ${fileName}\n`);
    }
    
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
