# ProjectFlow API Documentation

**Base URL**: `/api`  
**Auth Header**: `Authorization: Bearer <JWT>`

---

## 1. Authentication

| Method | Endpoint             | Description     | Auth? | Request Body                 | Success Response      | Error        |
| ------ | -------------------- | --------------- | ----- | ---------------------------- | --------------------- | ------------ |
| POST   | `/api/auth/register` | Create new user | No    | `{ email, password, name? }` | `201 { user, token }` | `400`, `409` |
| POST   | `/api/auth/login`    | Login & get JWT | No    | `{ email, password }`        | `200 { user, token }` | `401`        |

> `user`: `{ id, email, name }`  
> JWT stored in `localStorage`, expires in 7 days

---

## 2. Projects

| Method | Endpoint            | Description              | Auth? | Request Body                                   | Success Response         | Error        |
| ------ | ------------------- | ------------------------ | ----- | ---------------------------------------------- | ------------------------ | ------------ |
| GET    | `/api/projects`     | List all user projects   | Yes   | —                                              | `200 [projects]`         | `401`        |
| POST   | `/api/projects`     | Create new project       | Yes   | `{ title, description?, deadline? }`           | `201 { project }`        | `400`, `401` |
| GET    | `/api/projects/:id` | Get project + tasks      | Yes   | —                                              | `200 { project, tasks }` | `404`        |
| PUT    | `/api/projects/:id` | Update project           | Yes   | `{ title?, description?, deadline?, status? }` | `200 { project }`        | `404`        |
| DELETE | `/api/projects/:id` | Delete project (cascade) | Yes   | —                                              | `204 No Content`         | `404`        |

> Optional query: `GET /api/projects?status=active`

---

## 3. Tasks

| Method | Endpoint                  | Description           | Auth? | Request Body                                  | Success Response | Error |
| ------ | ------------------------- | --------------------- | ----- | --------------------------------------------- | ---------------- | ----- |
| POST   | `/api/projects/:id/tasks` | Add task to project   | Yes   | `{ title, description?, due_date?, status? }` | `201 { task }`   | `404` |
| GET    | `/api/projects/:id/tasks` | List tasks in project | Yes   | —                                             | `200 [tasks]`    | `404` |
| PUT    | `/api/tasks/:taskId`      | Update task           | Yes   | `{ title?, status?, due_date? }`              | `200 { task }`   | `404` |
| DELETE | `/api/tasks/:taskId`      | Delete task           | Yes   | —                                             | `204 No Content` | `404` |

> Optional: Add later → `GET /api/tasks?status=done`

---

## Error Format (All Routes)

```json
{ "error": "Invalid email or password" }
```
