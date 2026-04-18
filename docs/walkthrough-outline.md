# Walkthrough Outline

Use this as a 10 to 15 minute recording guide.

## 1. Problem Framing

- This is a compact task tracker built specifically for the assessment.
- I intentionally kept the scope narrow so I could show structure, validation, testing, and safe change boundaries.

## 2. Product Demo

- Show task creation with title, owner, status, priority, description, and due date.
- Show filtering by status and priority.
- Show dashboard summary cards.
- Edit a task, then delete one.
- Demonstrate a business rule by trying to move a `done` task back to `in_progress`.

## 3. Repository Structure

- `backend/app/models.py`: relational model plus workflow rule
- `backend/app/schemas.py`: typed validation
- `backend/app/services.py`: business logic
- `backend/app/routes.py`: API surface and error handling
- `backend/tests/`: behavior verification
- `frontend/src/App.tsx`: dashboard and interaction flow
- `AGENTS.md`: AI guidance constraints

## 4. Key Technical Decisions

- Flask because it is lightweight and easy to reason about in a small assessment.
- SQLite because setup is frictionless while still satisfying the relational DB requirement.
- Pydantic because it adds explicit input contracts and reduces invalid states.
- TypeScript because it improves frontend interface safety.

## 5. AI Usage

- AI helped scaffold the project and speed implementation.
- I constrained the AI with explicit repo guidance in `AGENTS.md`.
- I reviewed the generated code, fixed issues, and verified behavior with local tests and builds.

## 6. Verification

- Run `python -m pytest` in `backend`.
- Run `npm run lint` and `npm run build` in `frontend`.
- Mention that these checks were used to review generated code before submission.

## 7. Risks and Tradeoffs

- No authentication yet.
- No migrations yet.
- Single-page UI instead of a larger routed frontend.
- SQLite is right for the assessment, but PostgreSQL would be a better production path.

## 8. Extension Plan

- Add auth and per-user views.
- Add comments, audit history, and richer workflow states.
- Add frontend component tests and backend migrations.
- Move to PostgreSQL if the product grows beyond local use.
