# Nexora

## Tagline and Short Description

> **Bring your team's work into focus.**

Nexora is a collaborative project management app for organizing workspaces, projects, Kanban boards, tasks, and team access in one place.

## Live Demo | GitHub Repository

**Live demo:** https://project-management-app-red.vercel.app/ · **Repository:** [abhay-0907/Project-Management-App](https://github.com/abhay-0907/Project-Management-App)

## Screenshots / Demo GIF

No screenshots or demo GIFs are currently tracked in the repository. Add product captures under `docs/screenshots/` and embed them here when available.

## Overview and Problem Statement

Project work can become difficult to follow when teams split tasks, ownership, and progress across disconnected tools. Nexora gives each team a shared workspace, groups work into projects, and makes task progress visible on project boards.

The app includes a Next.js client and an Express API backed by PostgreSQL. The API handles account sessions, workspace membership, invitations, projects, tasks, board columns, and activity history. The notifications screen currently uses sample client-side data.

## Key Features

- Create workspaces and manage members with owner, admin, and member roles.
- Invite teammates by email and accept or reject workspace invitations.
- Organize projects with lifecycle status, descriptions, and dates.
- Track tasks on configurable project boards with priority, dates, assignees, and nested tasks.
- Browse workspace, project, and task activity feeds.
- Register with email verification, reset or change passwords, and review or revoke active sessions.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Client | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Client data and UI | TanStack Query, Zod, React Aria Components, Sonner |
| API | Node.js, Express 5, TypeScript, Zod |
| Database | PostgreSQL, Drizzle ORM and Drizzle Kit |
| Email | Nodemailer with Brevo SMTP relay |
| Local database | Docker Compose |

## System Architecture

```mermaid
flowchart LR
    U[Browser] --> C[Next.js client]
    C -->|JSON REST requests; credentialed fetch| A[Express API]
    A -->|Drizzle ORM| D[(PostgreSQL)]
    A -->|Verification and reset email| M[Brevo SMTP relay]
```

The browser calls the API directly. The API sets and validates the session cookie, checks workspace access, validates request data, and reads or writes PostgreSQL records. In production, configure the client origin on the API and use HTTPS for both services.

## Database Design

Drizzle schemas live in `server/src/db/schema/`. The main relationships are:

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ WORKSPACE_MEMBERS : joins
    WORKSPACES ||--o{ WORKSPACE_MEMBERS : contains
    WORKSPACES ||--o{ PROJECTS : contains
    PROJECTS ||--o{ PROJECT_STATUSES : defines
    PROJECTS ||--o{ TASKS : contains
    PROJECT_STATUSES ||--o{ TASKS : classifies
    TASKS ||--o{ TASKS : parent_of
    WORKSPACES ||--o{ LABELS : defines
    TASKS ||--o{ TASK_LABELS : tagged_with
    LABELS ||--o{ TASK_LABELS : applied_to
    WORKSPACES ||--o{ INVITATIONS : receives
    TASKS ||--o{ COMMENTS : has
    TASKS ||--o{ ATTACHMENTS : has
    WORKSPACES ||--o{ ACTIVITY_LOGS : records
```

Additional tables support project membership, notifications, email verification, and password resets. Composite foreign keys keep task, status, assignee, and label references within the same workspace. Schema changes are recorded under `server/drizzle/`.

## Authentication and Security

- Passwords are hashed with Argon2id. Session tokens are stored as SHA-256 hashes in the database and sent to the browser in an `HttpOnly` cookie.
- Sessions expire after 30 days and can be listed, revoked individually, or revoked together. Password changes and resets revoke other active sessions.
- Cookies use `SameSite=Lax` during local development. In production they use `SameSite=None; Secure` to support a separately hosted client and API.
- Email verification and password-reset codes are short-lived, HMAC-hashed, and limited to five attempts. Set `OTP_HASH_SECRET` to a dedicated secret in deployed environments.
- API inputs are validated with Zod. Workspace routes require a valid session and membership; administrative operations enforce workspace roles.
- CORS permits configured client origins and credentialed requests. Set `CLIENT_ORIGIN` to the exact production origin or comma-separated origin allowlist.

## Project Structure

```text
.
├── client/
│   └── src/
│       ├── app/          # Next.js routes and layouts
│       ├── features/     # Feature UI, API clients, hooks, and types
│       └── components/   # Shared UI and layout components
└── server/
    ├── src/
    │   ├── modules/      # Express routes, controllers, services, validation
    │   ├── db/schema/    # Drizzle table definitions
    │   ├── config/       # Database and mail configuration
    │   └── app/          # Express app setup
    ├── drizzle/          # SQL migrations and snapshots
    └── docker-compose.yml
```

## Installation and Setup

Requirements: Node.js with npm, and Docker if you want to run the included PostgreSQL container.

1. Create the environment files described in [Environment Variables](#environment-variables).
2. Start PostgreSQL and initialize the schema:

   ```bash
   cd server
   docker compose up -d
   npm ci
   npx drizzle-kit push
   ```

3. In `server/`, start the API:

   ```bash
   npm run dev
   ```

4. In a second terminal, start the client:

   ```bash
   cd client
   npm ci
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). \n
The API health check is at [http://localhost:8080/health](http://localhost:8080/health). Email verification and password reset require working SMTP credentials.

## Environment Variables

Create `server/.env` and `client/.env.local`. Do not commit either file.

| Variable | Service | Required | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Server | Yes | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5432/project_management` for the local Compose defaults. |
| `PORT` | Server | No | API port; defaults to `4000`. |
| `CLIENT_ORIGIN` | Server | Production | Allowed client origin(s), comma-separated. Development defaults to `http://localhost:3000`. |
| `OTP_HASH_SECRET` | Server | Recommended | Dedicated high-entropy key for hashing verification and reset codes. Falls back to `DATABASE_URL` if unset. |
| `SMTP_USER` | Server | For email | Brevo SMTP username. |
| `SMTP_PASS` | Server | For email | Brevo SMTP password. |
| `SENDER_EMAIL` | Server | For email | Verified sender address. |
| `NEXT_PUBLIC_API_URL` | Client | No | API base URL; defaults to `http://localhost:8080`. |
| `POSTGRES_DB` | Compose | No | Local database name; defaults to `project_management`. |
| `POSTGRES_USER` | Compose | No | Local database user; defaults to `postgres`. |
| `POSTGRES_PASSWORD` | Compose | No | Local database password; defaults to `postgres` (local development only). |
| `POSTGRES_PORT` | Compose | No | Host port for PostgreSQL; defaults to `5432`. |

The server's mailer connects to `smtp-relay.brevo.com:587` using TLS. Compose defaults are for local development; use managed secrets and a dedicated database in deployment.

## API Documentation

The API is JSON over HTTP and has no `/api` prefix. Authenticated browser requests include credentials. Request and response details are defined by the route validators and controllers in `server/src/modules/`.

| Area | Routes |
| --- | --- |
| Health | `GET /health` |
| Auth | `POST /auth/register`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/verify-password-reset-otp`, `/auth/reset-password`, `/auth/login`, `/auth/logout`, `/auth/change-password`, `/auth/logout-all`; `GET /auth/me`, `/auth/sessions`; `DELETE /auth/sessions/:sessionId` |
| Workspaces | `GET, POST /workspaces`; `GET, PATCH, DELETE /workspaces/:workspaceId` |
| Workspace members | `GET /workspaces/:workspaceId/members`, `GET /workspaces/:workspaceId/members/:memberId`, `PATCH /workspaces/:workspaceId/members/:memberId/role`, `DELETE /workspaces/:workspaceId/members/:memberId` |
| Workspace invitations | `GET, POST /workspaces/:workspaceId/invitations`; `POST /workspaces/:workspaceId/invitations/:invitationId/resend`; `DELETE /workspaces/:workspaceId/invitations/:invitationId` |
| Invitation links | `GET /invitations/:token`; `POST /invitations/accept`, `/invitations/reject` |
| Projects | `GET, POST /workspaces/:workspaceId/projects`; `GET, PATCH, DELETE /workspaces/:workspaceId/projects/:projectId` |
| Tasks | `GET, POST /workspaces/:workspaceId/projects/:projectId/tasks`; `GET, PATCH, DELETE /workspaces/:workspaceId/projects/:projectId/tasks/:taskId` |
| Project boards | `GET /workspaces/:workspaceId/projects/:projectId/board`; `POST /workspaces/:workspaceId/projects/:projectId/board/columns`; `PATCH, DELETE /workspaces/:workspaceId/projects/:projectId/board/columns/:statusId` |
| Activity | `GET /workspaces/:workspaceId/activities`; `GET /workspaces/:workspaceId/projects/:projectId/activities`; `GET /workspaces/:workspaceId/tasks/:taskId/activities` |

Mutating endpoints use JSON request bodies; protected routes require the `nexora_session` cookie. Workspace resource endpoints enforce membership and the required role.

## Testing

The server test script runs the invitation service test module:

```bash
cd server
npm test
npm run typecheck
```

The client provides lint and production-build scripts:

```bash
cd client
npm run lint
npm run build
```

## Deployment

Deploy the client and API as separate Node.js services, with PostgreSQL reachable from the API. Configure the environment variables above, set `CLIENT_ORIGIN` to the deployed client origin, set `NEXT_PUBLIC_API_URL` to the public API URL, and use HTTPS so the production session cookie can be sent. Provide Brevo SMTP credentials if account verification and password reset email are enabled.

Build each app with `npm run build` from its directory, then run it with `npm start`. Apply the Drizzle schema to the production database as part of the release process; the client can be hosted on a Next.js-compatible platform and the API on any Node.js host.

## Future Improvements

- Add committed product screenshots and a hosted demo.
- Add OpenAPI documentation and broader API and client test coverage.
- Persist notification actions through API endpoints; the current notifications screen uses demo data.
- Add managed file storage and upload endpoints for task attachments.
- Establish a versioned production migration workflow for database releases.

## Author and Contact

**Author:** [abhay-0907](https://github.com/abhay-0907) · **Contact:** [Open a GitHub issue](https://github.com/abhay-0907/Project-Management-App/issues)
