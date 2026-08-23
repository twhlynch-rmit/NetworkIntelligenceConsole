# Development

## Prerequisites

- [Node.js](https://nodejs.org/) `24` (version in [.nvmrc](.nvmrc))
- [pnpm](https://pnpm.io/) `10.6.3`
- [Docker](https://www.docker.com/)

See [ENVIRONMENT-SETUP.md](ENVIRONMENT-SETUP.md) for detailed install steps and
the environment variable reference.

## Setup

1. Install dependencies for all workspaces:

    ```sh
    pnpm install
    ```

    This also runs a first build of every workspace (via `postinstall`), which
    produces the `dist/` output that `@nic/shared` consumers typecheck against.

2. Create your environment file from the example and fill in values:

    ```sh
    cp .env.example .env
    ```

3. Start the infrastructure and services:

    ```sh
    docker compose up -d --build
    ```

4. Git hooks are installed automatically by `pnpm install` (via husky). They run
   lint-staged on staged files before each commit and commitlint on commit
   messages.

## Running Locally

Full stack in containers:

```sh
docker compose up -d --build
docker compose down      # stop
docker compose down -v   # stop and wipe postgres/redis data
```

Services only (Postgres + Redis in Docker, everything else on the host):

```sh
docker compose up -d postgres redis
pnpm --filter @nic/mock-outage-api dev     # tsx watch, per service
pnpm dev                                   # web dev server on :3000
```

## Common Commands

Run from the repository root. Most scripts forward to each workspace with
`--if-present`:

| Command                 | Description                      |
| ----------------------- | -------------------------------- |
| `pnpm build`            | Build all packages and services  |
| `pnpm typecheck`        | Typecheck all TypeScript         |
| `pnpm lint`             | Lint the whole repo with ESLint  |
| `pnpm lint:fix`         | Lint and auto-fix                |
| `pnpm format`           | Format everything with Prettier  |
| `pnpm format:check`     | Check formatting without writing |
| `pnpm test`             | Run all tests                    |
| `pnpm test:unit`        | Run unit tests only              |
| `pnpm test:integration` | Run integration tests only       |
| `pnpm dev`              | Run the web dev server           |

Run scripts for a single workspace with `pnpm --filter <package> <script>`, e.g.
`pnpm --filter @nic/correlator test:watch`.

Linting is configured once at the root (`eslint.config.mjs`) and covers every
workspace, so there are no per-workspace lint scripts.

## Testing

- Services use Vitest with a `tests/unit` / `tests/integration` split;
  integration tests exercise the Express app via supertest.
- The web uses Vitest + Testing Library in jsdom; API calls are mocked with
  msw (`web/src/mocks`).
