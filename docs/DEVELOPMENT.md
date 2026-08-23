# Development

## Prerequisites

- [Node.js](https://nodejs.org/) (version in [.nvmrc](.nvmrc))
- [pnpm](https://pnpm.io/) `10.6.3`
- [Docker](https://www.docker.com/)

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

## Local Infrastructure

Start the local stack:

```sh
docker compose up -d --build
```

Stop the local stack:

```sh
docker compose down
```

## Common Commands

Run from the repository root. most scripts forward to each workspace with
`--if-present`:

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `pnpm build`        | Build all packages and services  |
| `pnpm typecheck`    | Typecheck all TypeScript         |
| `pnpm lint`         | Lint the whole repo with ESLint  |
| `pnpm lint:fix`     | Lint and auto-fix                |
| `pnpm format`       | Format everything with Prettier  |
| `pnpm format:check` | Check formatting without writing |
| `pnpm test`         | Run all tests                    |
| `pnpm dev`          | Run the web dev server           |

Linting is configured once at the root (`eslint.config.mjs`) and covers every
workspace, so there are no per-workspace lint scripts. Tests use Vitest; each
package has a `test:watch` script for watch mode.
