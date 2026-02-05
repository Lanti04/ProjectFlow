-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    study_streak INTEGER DEFAULT 0,
    last_study_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline DATE,
    status VARCHAR(50) DEFAULT 'active',        -- active, completed, archived
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    sharing_token VARCHAR(100) UNIQUE,          -- shareable link token
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'todo',
    difficulty VARCHAR(20),
    tag VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Tags Table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',         -- hex color for UI
    UNIQUE(user_id, name)
);

-- Project Tags Junction Table
CREATE TABLE project_tags (
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, tag_id)
);

-- Focus Sessions Table (for Focus Mode 2.0)
CREATE TABLE focus_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (these indexes make the app FAST) 
CREATE INDEX idx_projects_user_id ON projects(user_id); 
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_projects_deadline ON projects(deadline);

UPDATE tasks SET due_date = CURRENT_DATE WHERE id = 3; --ztesting purposes