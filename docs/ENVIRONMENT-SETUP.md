# Environment Setup

## Prerequisites

- [Node.js](https://nodejs.org/) `24`
- [pnpm](https://pnpm.io/) `10.6.3`
- [Docker](https://www.docker.com/) with Compose v2.

## First-time setup

```sh
nvm use
pnpm install
cp .env.example .env  # then adjust values if needed
```

The defaults in `.env.example` match `docker-compose.yml`, so the full stack
works out of the box:

```sh
docker compose up -d --build
```

- Dashboard: http://localhost:3000
- Results API: http://localhost:3005/api/v1/health-check

## Environment variables

Values are read by services from their environment; compose fills them from
`.env`. Local defaults are shown.

### Database (PostgreSQL 15 + PostGIS)

| Variable            | Default    | Description       |
| ------------------- | ---------- | ----------------- |
| `POSTGRES_HOST`     | `postgres` | Database host     |
| `POSTGRES_PORT`     | `5432`     | Database port     |
| `POSTGRES_DB`       | `nic`      | Database name     |
| `POSTGRES_USER`     | `nic_user` | Database user     |
| `POSTGRES_PASSWORD` | `changeme` | Database password |

Used by the correlator (verdict records).

### Redis

| Variable     | Default | Description |
| ------------ | ------- | ----------- |
| `REDIS_HOST` | `redis` | Redis host  |
| `REDIS_PORT` | `6379`  | Redis port  |

Used by every service; Redis Streams is the internal event bus. When running a
service on the host against Dockerized Redis, set `REDIS_HOST=localhost`.

### Auth

| Variable     | Default                     | Description       |
| ------------ | --------------------------- | ----------------- |
| `JWT_SECRET` | `dev-secret-change-in-prod` | HS256 signing key |

Shared by services that talk to the outage/LoC APIs.

### Service URLs

| Variable          | Default                       | Points at       |
| ----------------- | ----------------------------- | --------------- |
| `OUTAGE_API_URL`  | `http://mock-outage-api:3001` | mock-outage-api |
| `LOC_API_URL`     | `http://mock-loc-api:3006`    | mock-loc-api    |
| `RESULTS_API_URL` | `http://results-api:3005`     | results-api     |

These are the docker-network hostnames. For host-side runs use
`http://localhost:<port>` instead.

### Web

| Variable             | Default                 | Description                                                |
| -------------------- | ----------------------- | ---------------------------------------------------------- |
| `VITE_API_URL`       | `http://localhost:3005` | Results API base URL (baked into the bundle at build time) |
| `VITE_WS_URL`        | `ws://localhost:3005`   | WebSocket feed URL                                         |
| `VITE_SIMULATOR_URL` | `http://localhost:3002` | Fleet simulator base URL                                   |

Note that `VITE_*` variables are compiled into the production bundle when
`pnpm build` runs inside the web image; changing them requires a rebuild of the
web container.

### Public data & simulator tuning

| Variable     | Default     | Description                       |
| ------------ | ----------- | --------------------------------- |
| `FLEET_SIZE` | `1000`      | Number of simulated devices       |
| `PORT`       | per service | HTTP listen port for each service |

## Ports overview

| Port | Service              |
| ---- | -------------------- |
| 3000 | web (nginx)          |
| 3001 | mock-outage-api      |
| 3002 | fleet-simulator      |
| 3005 | results-api          |
| 3006 | mock-loc-api         |
| 5432 | PostgreSQL + PostGIS |
| 6379 | Redis                |
