# AI Guidance

This repository includes explicit guidance for AI-assisted development. The goal is to keep generated code safe, predictable, and easy to review.

## Product Constraints

- Build a small task-tracking product only.
- Prefer correctness and clarity over feature breadth.
- Keep the architecture simple enough to explain in a 10 to 15 minute walkthrough.

## Backend Rules

- Use Flask for HTTP APIs.
- Use a relational database model with explicit schema fields.
- Validate request payloads with typed schemas before writing to the database.
- Keep business rules in service or model layers, not embedded directly in route handlers.
- Return JSON errors with clear messages and stable shapes.
- Add tests for every meaningful rule or behavior change.

## Frontend Rules

- Use React with TypeScript.
- Keep UI state explicit and local unless shared state is truly necessary.
- Prefer straightforward fetch-based data access over adding heavy state libraries.
- Show loading, success, and error states to make failures visible.
- Do not hide workflow constraints from the user.

## Code Quality Rules

- Choose readable names over clever abstractions.
- Separate models, schemas, services, and routes on the backend.
- Avoid introducing unnecessary dependencies.
- Do not add features without updating docs and verification steps.
- Review all AI-generated code before keeping it.

## Verification Rules

- Backend changes must pass `python -m pytest`.
- Frontend changes should pass `npm run lint` and `npm run build`.
- Any warning or failure should be investigated before submission.

## Safety Rules

- Do not use confidential data, credentials, or private business logic.
- Keep the submission self-contained and assessment-specific.
- Document tradeoffs honestly instead of implying production completeness.
