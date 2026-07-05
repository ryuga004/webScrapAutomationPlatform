# WebBot

**Build browser automations visually, run them in your own logged-in browser.**

WebBot is a SaaS-style web-automation platform. Users compose workflows on a
drag-and-drop canvas out of small, atomic **nodes** (go to a URL, click, extract
text, loop over a list, paginate, export CSV…), save them to their account, then
run them through a companion **browser extension** that drives their real,
authenticated browser tabs.

- **Dashboard** — Next.js App Router, React Flow canvas, JWT auth.
- **Backend** — Next.js Route Handlers + Prisma + PostgreSQL, layered with
  Repository / Strategy / Registry patterns and SOLID boundaries.
- **Extension** — a Manifest V3 extension the user downloads pre-configured with
  their credentials; it fetches their workflows and executes them tab-side.

---

## Table of contents

- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database & migrations](#database--migrations)
- [Running the app](#running-the-app)
- [The browser extension](#the-browser-extension)
- [Architecture](#architecture)
- [API reference](#api-reference)
- [Design patterns & SOLID](#design-patterns--solid)
- [Project structure](#project-structure)
- [Node authoring guide](#node-authoring-guide)

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env          # then edit values as needed

# 3. Start PostgreSQL (Docker) — or point DATABASE_URL at your own
docker compose up -d

# 4. Create the schema and a demo user
npm run db:deploy             # applies prisma/migrations
npm run db:seed               # demo@webbot.dev / password123  (optional)

# 5. Run the dashboard
npm run dev                   # http://localhost:3000
```

Register an account (or use the seeded demo user), build a workflow, then click
**Download my extension** and load it in your browser (see below).

> Prefer to manage Postgres yourself? Skip `docker compose up` and set
> `DATABASE_URL` in `.env` to your instance. `docker-compose.yml` also starts
> **Adminer** at <http://localhost:8080> for inspecting the database.

---

## Environment variables

All configuration is read in exactly one place (`src/server/config.ts`). Copy
`.env.example` to `.env` and fill in real values.

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Prisma) | `postgresql://postgres:postgres@localhost:5432/webbot?schema=public` |
| `JWT_SECRET` | Secret for signing access tokens. **Required in production.** | `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | Access-token lifetime | `7d` |
| `EXTENSION_TOKEN_EXPIRES_IN` | Lifetime of the token baked into the downloaded extension | `30d` |
| `BCRYPT_SALT_ROUNDS` | bcrypt work factor | `12` |
| `NEXT_PUBLIC_APP_URL` | Public base URL, baked into the extension bundle | `http://localhost:3000` |

---

## Database & migrations

The schema lives in [`prisma/schema.prisma`](prisma/schema.prisma). Every entity
is its own table with real foreign keys:

- **users** — `username` (unique), `email` (unique), `passwordHash`
  (bcrypt — the per-user salt is embedded in the hash), `role`.
- **workflows** — belongs to a user (`userId` FK, cascade delete).
- **nodes** — one row per node, with `workflowId` **and** `userId` FKs.
- **edges** — one row per connection, with `workflowId` and `userId` FKs.
- **workflow_runs** — execution history (`result` JSON), `workflowId` FK.

Common commands:

```bash
npm run db:deploy     # apply committed migrations (production-safe)
npm run db:migrate    # create + apply a new migration in dev
npm run db:push       # push schema without a migration (prototyping)
npm run db:studio     # open Prisma Studio
npm run db:seed       # insert the demo user
npm run prisma:generate
```

---

## Running the app

```bash
npm run dev        # dev server (Turbopack) at http://localhost:3000
npm run build      # prisma generate + production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

---

## The browser extension

Workflows are **designed** in the dashboard but **executed** in the extension,
so automations run against your real, logged-in sessions.

1. Sign in to the dashboard.
2. Click **Download my extension** — you get a `.zip` with your backend URL and a
   long-lived API token already written into `config.js`. Nothing to paste.
3. Unzip it. In your browser go to the extensions page
   (`chrome://extensions` or `about:debugging` in Firefox), enable Developer
   mode, and **Load unpacked** / **Load Temporary Add-on** pointing at the
   unzipped folder.
4. Open the extension popup — your workflows load automatically. Pick one and
   **Run on this tab**.

The extension can also **pick elements for you**: in the dashboard's node config,
click **Pick**, then click the target element on your page — it writes a robust
locator for you (no CSS knowledge needed).

> The baked-in token expires after `EXTENSION_TOKEN_EXPIRES_IN`. Re-download the
> extension to refresh it.

---

## Architecture

```
Browser Extension ──HTTP (Bearer token)──▶ Next.js Route Handlers
   (executor.js)                              │
                                              ▼
                                     HTTP layer (auth guard, error mapping)
                                              │
                                              ▼
                                     Services (AuthService, WorkflowService)
                                       │                     │
                                       ▼                     ▼
                              Strategies             Repositories (interfaces)
                       (BcryptHasher,                        │
                        JwtTokenService)                     ▼
                                                    Prisma implementations
                                                             │
                                                             ▼
                                                         PostgreSQL
```

The domain layer (`src/server/domain`) defines **interfaces only**. Services
depend on those interfaces; concrete implementations (Prisma, bcrypt, JWT) are
wired together in one composition root (`src/server/container.ts`). This keeps
business logic free of framework/vendor details and trivially testable.

---

## API reference

All responses are JSON. Protected routes require `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Create an account → `{ user, token }` |
| `POST` | `/api/auth/login` | — | Log in → `{ user, token }` |
| `GET` | `/api/auth/me` | ✔ | Current user (restore session) |
| `GET` | `/api/workflows` | ✔ | List the caller's workflows |
| `POST` | `/api/workflows` | ✔ | Create a workflow |
| `GET` | `/api/workflows/:id` | ✔ | Get one (owner only) |
| `PUT` | `/api/workflows/:id` | ✔ | Replace one (owner only) |
| `DELETE` | `/api/workflows/:id` | ✔ | Delete one (owner only) |
| `GET` | `/api/extension/download` | ✔ | Download the pre-configured extension `.zip` |

Errors use a consistent shape: `{ "error": "message", "code": "VALIDATION_ERROR" }`
with the appropriate HTTP status (400/401/403/404/409/500).

---

## Design patterns & SOLID

- **Repository** — `IUserRepository`, `IWorkflowRepository` abstract persistence;
  Prisma implementations live in `src/server/infra/repositories`.
- **Strategy** — `IPasswordHasher` (→ `BcryptHasher`) and `ITokenService`
  (→ `JwtTokenService`) are swappable algorithms behind interfaces.
- **Registry** — `NodeValidatorRegistry` resolves a validation strategy per node
  type, defaulting to a schema-driven validator built from the node registry in
  `src/lib/nodes.ts`.
- **Dependency Injection / Composition Root** — `src/server/container.ts` is the
  single place that constructs and wires everything.
- **SOLID** — single-responsibility modules; services depend on abstractions
  (DIP); new node types / hashers / stores extend without modifying callers
  (OCP); small, focused interfaces (ISP).

---

## Project structure

```
prisma/
  schema.prisma            # data model (users, workflows, nodes, edges, runs)
  migrations/              # SQL migrations
  seed.ts                  # demo user seed
src/
  app/
    api/                   # Route Handlers (auth, workflows, extension download)
    login/ register/       # auth screens
    workflows/             # dashboard + editor canvas
  components/              # AuthProvider, RequireAuth, canvas UI
  lib/                     # node registry, workflow types, validation helpers
  server/
    config.ts              # env access (one place)
    container.ts           # composition root (DI)
    db/prisma.ts           # Prisma client singleton
    domain/                # errors + interfaces (no framework code)
    infra/                 # Prisma repos, bcrypt/JWT strategies
    services/              # AuthService, WorkflowService
    validation/            # node validator registry
    http/                  # auth guard + response/error helpers
extension/                 # MV3 browser extension (executor, picker, popup)
docs/
  NODES.md                 # how nodes work + a worked example
```

---

## Node authoring guide

See **[docs/NODES.md](docs/NODES.md)** for how a node is defined, how the engine
runs it, and a step-by-step worked example.
