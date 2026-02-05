-- Migration: Add soft delete support
-- This migration adds deleted_at columns to enable soft delete functionality

-- Add deleted_at column to projects table
ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to tasks table
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for soft delete queries (improves performance)
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
