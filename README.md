# Task Management REST API

A small REST API built with Node.js, Express, and TypeScript. It keeps tasks in process memory, so all tasks are lost when the server restarts.

## Requirements and setup

Use Node.js 22.12 or newer on a supported Node release line (`22`, `24`, or `26+`).

```powershell
npm install
npm run dev
```

The development server listens on `http://localhost:3000` by default. Set `PORT` to change the port.

## Scripts

```powershell
npm run dev       # Run with automatic restart
npm run build     # Compile TypeScript into dist/
npm start         # Run the compiled server
npm test -- --run # Run the test suite once
npm run lint      # Run ESLint
```

## Endpoints

All task endpoints use the `/api/tasks` resource. JSON responses use `{ "success": true, "data": ... }` for successful reads, creation, and updates. Errors use `{ "success": false, "error": "..." }`; invalid request bodies may also include a `details` array.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/api/tasks` | List tasks (cursor paginated) |
| `GET` | `/api/tasks/:id` | Get a task by UUID |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Partially update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task; returns `204` with no body |

Create-task example:

```json
{
  "title": "Prepare release",
  "description": "Review and publish the next release",
  "status": "todo"
}
```

`title` and `description` are required non-empty strings. `status` is optional on creation and defaults to `todo`; valid values are `todo`, `in-progress`, and `done`. Updates must contain at least one of these fields. Task IDs are UUIDs; timestamps are ISO 8601 strings.

### Pagination

`GET /api/tasks` accepts an optional `limit` (default `20`, maximum `100`) and an opaque `cursor`. Results are newest first. The response includes `data`, `nextCursor`, and `hasMore`; pass a non-null `nextCursor` as the next request's `cursor`.

## Persistence

This starter uses an in-memory store only. Data does not survive a restart and is not shared between multiple server processes. Add a persistent database before using it for production data.
