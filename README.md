# Progressor

A private, single-user skill progress tracker built with Next.js, Express, PostgreSQL, Redis, Prisma, and BullMQ.

## Features

- Ordered learning plans with URLs, estimated durations, target dates, and status tracking.
- A 30-day completion-velocity dashboard and configurable neglect detection.
- One optional final certification per skill, locked until every active resource is complete.
- In-app due-date, overdue, and inactivity notifications with idempotent background processing.
- Archive/restore flows that retain personal learning data.

## Run locally with Docker

The application intentionally binds its public ports to `127.0.0.1`. It has no authentication and must not be exposed to the public internet.

```bash
docker compose up --build
```

Open <http://localhost:3000>. PostgreSQL data and Redis jobs are stored in named Docker volumes.

## Run in development

Requirements: Node.js 22+, PostgreSQL, and Redis.

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
```

Run these in separate terminals:

```bash
npm run dev
npm run dev:api
npm run dev:worker
```

The Next.js server proxies `/api/*` to Express, keeping browser requests same-origin.

## Quality checks

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Behavior notes

- Estimated durations are stored as positive whole minutes.
- Resource status transitions—not planning edits—update the skill's last-progress timestamp.
- Dashboard velocity counts completed, non-archived resources from the previous 30 days.
- The inactivity setting controls both dashboard neglect detection and inbox generation; disabling inactivity notifications does not hide neglected skills from the dashboard.
- Completing a certification makes its plan read-only. Reopening it clears completion proof and allows plan changes again.
- Redis coordinates notification scans and retries. PostgreSQL is the source of truth and unique deduplication keys make scans safe to retry.

## API

The versioned REST API is served from `/api/v1`. Important routes include `/dashboard`, `/skills`, nested resource and certification routes, `/notification-settings`, and `/notifications`. Errors use `{ "error": { "code", "message", "fieldErrors?" } }`.
