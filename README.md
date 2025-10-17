# ActiveMQ + React Monorepo

This monorepo contains:

- `infra/activemq`: Dockerized Apache ActiveMQ (Classic) broker
- `apps/api`: Node.js (Express + TypeScript) API publishing notifications and serving data
- `apps/web`: React (Vite + TypeScript) SPA rendering a data table and showing live toasts

## Getting Started

1. Start ActiveMQ broker:
   - Install Docker Desktop
   - `cd infra/activemq && docker compose up -d`
   - Broker UI at `http://localhost:8161` (default creds: `admin` / `admin`)

2. Install dependencies and run apps:
   - From repo root: `npm install`
   - Start both apps: `npm run dev`

3. Open the web app:
   - `http://localhost:5173`

## Architecture

- API exposes REST endpoints for table data and publishes notification events to ActiveMQ.
- Web app fetches table data via REST and listens for live events via STOMP over WebSocket to show toast notifications.

## Workspaces

This repo uses npm workspaces:

```
apps/
  api/
  web/
infra/
  activemq/
```

    cd infra/activemq
    docker compose up -d
    ```
  - Console: `http://localhost:8161` (admin/admin)
- Install dependencies:
  - From repo root:
    ```bash
    npm install
    ```

Run the services:
- API (Express + TS): 
  ```bash
  npm run dev --workspace @jbs/api
  ```
  - Serves: `http://localhost:4000`
  - Endpoints: `GET /api/users`, `POST /api/users` (body: `{ "name": "...", "email": "...", "role": "..." }`)
- Web (Vite + React 18 TS):
  ```bash
  npm run dev --workspace @jbs/web
  ```
  - Open: `http://localhost:5173`
  - Shows table from API and listens for STOMP notifications

How notifications work:
- API publishes to ActiveMQ STOMP destination `/queue/notifications` when a new user is created.
- Web subscribes over WebSocket and displays a toast for each notification.

What to try:
1) Start broker, API, and web.
2) POST a new user:
   ```bash
   curl -X POST http://localhost:4000/api/users -H "Content-Type: application/json" -d "{\"name\":\"Dana\",\"email\":\"dana@example.com\",\"role\":\"Viewer\"}"
   ```
3) See the new user row; a toast should pop.

Status update:
- Completed monorepo structure and ActiveMQ docker-compose.
- Scaffolded API and web apps; table and toast UI in place.
- Next: once you confirm Node is installed, run npm install; if you prefer, I can also add a consolidated root script and tweak any endpoints or destinations.