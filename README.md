# ProjectFlow

A full-stack project management application built with React, Express, and PostgreSQL.

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- npm or yarn

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DB_PASSWORD` - A secure password for PostgreSQL
- `JWT_SECRET` - A long random string for JWT signing
- `STRIPE_SECRET_KEY` - Your Stripe secret key (optional)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret (optional)

### 2. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in a separate terminal)
cd frontend
npm install
```

### 4. Run Database Migrations

From the backend directory:

```bash
cd backend
npm run migrate
```

This will apply all SQL migrations in order:
- `create-users-table.sql`
- `schema.sql` 
- `migration-add-streak.sql`
- `migration-add-tags-sharing-focus.sql`
- `migration-soft-delete.sql`

### 5. Start the Application

**Backend:**
```bash
cd backend
npm run dev
```
The API server will run on http://localhost:5000

**Frontend (new terminal):**
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:5173

## Manual Database Setup (Alternative)

If you prefer to run migrations manually with psql:

```bash
# Connect to the database
docker exec -it projectflow-db psql -U postgres -d projectflow

# Run each migration file in order
\i /docker-entrypoint-initdb.d/create-users-table.sql
\i /docker-entrypoint-initdb.d/schema.sql
# ... etc
```

Or from your host machine:
```bash
psql -h localhost -p 5432 -U postgres -d projectflow -f backend/src/database/create-users-table.sql
psql -h localhost -p 5432 -U postgres -d projectflow -f backend/src/models/schema.sql
psql -h localhost -p 5432 -U postgres -d projectflow -f backend/src/models/migration-add-streak.sql
psql -h localhost -p 5432 -U postgres -d projectflow -f backend/src/models/migration-add-tags-sharing-focus.sql
psql -h localhost -p 5432 -U postgres -d projectflow -f backend/src/models/migration-soft-delete.sql
```

## Project Structure

```
projectflow/
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── routes/    # API route handlers
│   │   ├── models/    # SQL migrations & schema
│   │   └── database/  # DB connection & migrations
│   └── package.json
├── frontend/          # React + Vite frontend
│   ├── src/
│   └── package.json
├── docker-compose.yml # PostgreSQL container
├── .env               # Environment variables (gitignored)
└── .env.example       # Environment template
```

## Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## API Documentation

See [backend/API.md](backend/API.md) for API endpoint documentation.

## Security Notes

- Never commit `.env` files to version control
- Rotate your `DB_PASSWORD` and `JWT_SECRET` if they are ever exposed
- The `.env` file is gitignored by default
