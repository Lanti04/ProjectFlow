-- Insert one demo user (id = 1)
INSERT INTO users (email, password_hash, name)
VALUES ('rafet@example.com', 'fakehash123', 'Rafet');

-- Insert demo projects linked to user_id = 1
INSERT INTO projects (user_id, title, description, deadline, progress) VALUES
(1, 'Algorithms Final Project', 'Red-Black Trees implementation', '2025-06-15', 30),
(1, 'Web Development Portfolio', 'Build ProjectFlow (yes, this one!)', '2025-06-01', 80);

-- Insert tasks linked to project_id = 1 and 2
INSERT INTO tasks (project_id, title, due_date, status) VALUES
(1, 'Study Red-Black Trees', '2025-05-20', 'todo'),
(1, 'Implement insert operation', '2025-05-25', 'in_progress'),
(2, 'Deploy to Vercel', '2025-05-18', 'todo'),
(2, 'Add AI feature', null, 'todo');

