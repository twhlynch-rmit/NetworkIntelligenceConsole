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

## Common Commands

Run from the repository root. most scripts forward to each workspace with
`--if-present`:

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `pnpm build`        | Build all services               |
| `pnpm typecheck`    | Typecheck all TypeScript         |
| `pnpm lint`         | Lint all workspaces              |
| `pnpm format`       | Format everything with Prettier  |
| `pnpm format:check` | Check formatting without writing |
| `pnpm test`         | Run all tests                    |
