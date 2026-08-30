# Architecture & Design Decisions

Tooling and architecture decisions for the Network Intelligence
Console. These are short notes explaining why each technology or design choice
was made. See [ARCHITECTURE.md](../ARCHITECTURE.md).

## Service decomposition

### Separate services

- The brief requires the Mock Outage API, Device Fleet Simulator, and stretch
  Loss of Connectivity API to be standalone services with defined contracts. The
  Public Data Adapter and Root Cause Correlator are also separate services.
- Keeping these as separate services means the mock APIs can later be replaced
  with real Telstra APIs without changing the services that use them.
- Separating services also helps with failures. For example, if VicEmergency or
  BOM is unavailable, the Public Data Adapter can fail without stopping the Root
  Cause Correlator from using the other available data.
- Six services are manageable for a 3-5 person team because each service has its
  own contract, tests, Dockerfile, and port.
- Services use Redis Streams for events and REST where a normal request/response
  makes more sense. This also allows the simulator to be throttled or replayed
  independently.

## Language & Monorepo

### TypeScript

- The brief suggest Java, Node.js, or Python and specifically lists
  TypeScript/JavaScript as an expected skill.
- Using one language means one toolchain, formatter, linter, and set of
  development conventions across the project.
- Shared types can be kept in one place, so changes to things like outage events
  or verdicts are caught by the TypeScript compiler.
- Python was considered but rejected because it would require separate type
  definitions and tooling for the Python services and TypeScript frontend.

### pnpm monorepo

- Changes across multiple services can be made in one commit.
- pnpm provides strict dependency isolation and workspace support.
- Workspace scripts can build packages in the correct order, such as building
  shared libraries before services that depend on them.
- Shared TypeScript types are a convenience.

## Backend & Data

### Express 5

- It is recommended by the brief and is familiar to the team.
- NestJS was considered but adds structure that we don't need for a project of
  this size.
- Fastify was also considered, but its performance advantages are not important
  for this application.
- Each HTTP service exposes a small `createApp()` function in `src/app.ts`. This
  makes it possible to test the real Express application with Supertest without
  starting a server.
- The Correlator and Public Data Adapter are workers and therefore do not need
  HTTP endpoints.
- The API services expose their endpoints under `/<service-name>/v0/*`.

### Redis Streams

- The brief allows Redis Streams, NATS, or Kafka. We chose Redis.
- Redis was already an assumed requirement elsewhere in the system, so there is
  no additional infrastructure to run.
- Consumer groups provide the fan-out behaviour we need.
- Streams provide replayable events, which is useful for the time-travel/replay
  stretch goal.
- Kafka would add more operational complexity than we need for this project.

### PostgreSQL & PostGIS

The correlator needs to answer questions such as:

- Is a device inside an outage polygon?
- Is a device close to a bushfire warning?
- Which events are relevant to a particular device?

- PostgreSQL with PostGIS is used for the correlator's geospatial data.
- PostGIS provides functions such as `ST_Contains` and `ST_DWithin` for these
  queries.
- PostgreSQL was preferred over a document database because verdicts and their
  supporting evidence need to be stored and queried in a structured way.

### JWT authentication

- The mocked APIs will use JWT bearer authentication as required by the brief.
- The Mock Outage API uses HS256.
- The shared secret is provided through an environment variable.
- This makes the mock API behave more like the real API it represents without
  adding unnecessary authentication infrastructure.

## Frontend

### React & Vite

- The dashboard is a React SPA built with Vite.
- Next.js was considered but is unnecessary because the dashboard does not need
  server-side rendering or SEO.
- Vite provides fast development builds and produces a static application that
  can be served by nginx in the demo environment.

### TanStack Query

- TanStack Query manages server state in the frontend.
- It handles caching, retries, stale data, invalidation, loading, and error
  states
- Avoids implementing those behaviours ourselves.
- When the WebSocket feed is added, incoming events can invalidate or update the
  relevant queries.

### shadcn/ui + Base UI

- shadcn/ui is used for the dashboard components.
- The goal is to get a consistent and accessible UI without spending a large
  amount of development time building basic components.
- Unlike a traditional component library, shadcn components are added directly
  to the repository, so we can change them when needed. They also work well with
  Tailwind.

### MapLibre GL + react-map-gl

- The brief suggests Leaflet, MapLibre, or Mapbox GL.
- MapLibre supports vector tiles and polygon rendering
- MapLibre does not require a Mapbox API key
- MapLibre has no per-map-load billing
- MapLibre is suitable for outage polygons and public event overlays
- `react-map-gl` provides the React integration.

### API access

- Each backend service has its own axios client.
- Components do not call `fetch` or axios directly. Instead, they use the API
  layer and typed models from the shared library.
- MSW is used to mock this API layer in frontend tests, allowing components to
  be tested without running the backend.

## Quality & CI

### Vitest

- Integrates perfectly with other stack choices.
- Services use the Node environment.
- The web application uses jsdom.
- The shared package uses the same test runner.
- Service tests are split into `tests/unit` and `tests/integration`.
- Integration tests use Supertest against the real Express application without
  requiring Redis or PostgreSQL to be running.

### MSW

- Intercepts network requests rather than replacing the axios client itself.
  This means tests exercise the same API layer that production code uses.

### ESLint + Prettier

- One flat ESLint configuration covers all workspaces.
- React-specific rules are enabled for the web application.
- Prettier handles formatting.
- Husky and lint-staged run formatting and linting on staged files before
  commits.
- This keeps formatting and lint rules consistent across the project.

### Husky + commitlint

- commitlint enforces Conventional Commits, giving the repository a consistent
  commit history and making it easier to search or generate changelogs later.

### GitHub Actions

- CI runs on pull requests and pushes to `main`.
- The pipeline checks formatting, linting, TypeScript types, tests, dependency
  vulnerabilities, and Docker builds
- The Docker job builds the Compose images using Buildx and GitHub Actions
  caching.
- Node.js and pnpm versions are pinned across local development, CI, and Docker
  so the same versions are used everywhere.
