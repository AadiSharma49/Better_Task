# Pulseboard

Pulseboard is a small full-stack task tracking product built for the Bettr assessment. It focuses on predictable state transitions, safe interfaces, and a clean structure rather than broad feature scope.

## Product Summary

- Create, edit, filter, and delete tasks
- Track `status`, `priority`, `owner`, `description`, and `due date`
- Surface dashboard metrics for total, in-progress, blocked, done, and overdue work
- Enforce a simple workflow rule: once a task is `done`, it cannot move back into an active state

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Python + Flask
- Database: SQLite via SQLAlchemy
- Validation: Pydantic request/response schemas
- Tests: Pytest for API behavior

## Why This Design

- SQLite keeps local setup friction low for an assessment while still using a relational model.
- Flask app factory structure keeps configuration, routes, models, and services separated.
- Pydantic adds explicit request validation and safer API contracts.
- React + TypeScript makes the frontend state and API integration safer and easier to evolve.
- The app is intentionally small so correctness, testing, and code clarity stay strong.

## Repository Structure

```text
backend/
  app/
    __init__.py
    db.py
    models.py
    routes.py
    schemas.py
    services.py
  tests/
  requirements.txt
  run.py
frontend/
  src/
  package.json
docs/
  walkthrough-outline.md
AGENTS.md
README.md
```

## Architecture

### Backend

- `models.py` defines the `Task` relational model and workflow transition rules.
- `schemas.py` validates incoming payloads and shapes outgoing responses.
- `services.py` contains task operations and dashboard summary logic.
- `routes.py` exposes REST endpoints and normalizes errors into JSON responses.
- `__init__.py` creates the Flask app, configures CORS, logging, and database setup.

### Frontend

- `App.tsx` handles the dashboard page, task form, filters, and API calls.
- `App.css` and `index.css` define the visual system and responsive layout.
- Vite proxying forwards `/api` requests to the Flask server during local development.

## API Endpoints

- `GET /health`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/dashboard`

## Validation and Safety

- Titles must be at least 3 characters.
- Owner names must be at least 2 characters when provided.
- Status and priority values are constrained to known enums.
- Due dates are validated through typed schemas.
- Invalid requests return structured JSON errors.
- Invalid workflow transitions return `409 Conflict`.

## Observability

- Flask logs unhandled server errors.
- API errors return consistent JSON payloads for easier diagnosis.
- Frontend status and error messages make failures visible to the user.

## Testing

Backend tests cover:

- creating and listing tasks
- invalid payload rejection
- invalid workflow transition rejection
- dashboard overdue metrics

Run tests with:

```bash
cd backend
python -m pytest
```

## Local Setup

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```

The Flask API runs on `http://127.0.0.1:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The React app runs on `http://127.0.0.1:5173`.

## Verification Commands

```bash
cd backend
python -m pytest

cd ../frontend
npm run lint
npm run build
```

## Deployment

Recommended assessment deployment:

- Frontend on Vercel
- Backend on Render

This split is the safest fit for the current codebase because the frontend is static and Vercel handles it well, while the Flask API benefits from a persistent backend host. The app currently uses SQLite, so if you deploy the backend on Render without a persistent disk, data will reset on redeploys or restarts because Render documents that its filesystem is ephemeral by default.

### Frontend Environment Variables

- `VITE_API_BASE_URL`
  - Example: `https://your-backend.onrender.com`

### Backend Environment Variables

- `FRONTEND_ORIGIN`
  - Example: `https://your-frontend.vercel.app`

### Backend Start Command

```bash
gunicorn --bind 0.0.0.0:$PORT run:app
```

## AI Usage

AI was used to accelerate scaffolding, implementation, and documentation. All generated code was reviewed, adjusted, and verified through local tests and builds. Guidance constraints are documented in [AGENTS.md](AGENTS.md).

## Risks and Tradeoffs

- SQLite is ideal for local assessment speed, but PostgreSQL would be a better production default.
- The app uses a single-page frontend for simplicity instead of a more modular routed UI.
- Authentication and multi-user authorization are intentionally out of scope.
- `db.create_all()` is acceptable for assessment setup, but migrations would be required in production.

## Extension Approach

- Add authentication and per-user task ownership.
- Add richer workflow rules and audit history.
- Introduce pagination, search, and sorting for larger task lists.
- Replace SQLite with PostgreSQL and add Alembic migrations.
- Add frontend tests with Vitest and React Testing Library.

## Submission Notes

The walkthrough video is required separately and should explain:

- architecture
- repository structure
- key technical decisions
- AI usage and review process
- current risks and tradeoffs
- how the app could be extended safely
