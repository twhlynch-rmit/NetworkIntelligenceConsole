# Tech Stack Summary

Monorepo with 6 backend microservices, a React frontend,
and Redis Streams as the internal message bus.

| Layer     | Technologies                                                            |
| --------- | ----------------------------------------------------------------------- |
| Language  | TypeScript (Node.js 24 LTS)                                             |
| Structure | pnpm monorepo, shared types package (`@nic/shared`)                     |
| Frontend  | React 19, Vite 8, TanStack Query, TailwindCSS 4, shadcn/ui, MapLibre GL |
| Backend   | Express 4 (6 services)                                                  |
| Databases | PostgreSQL 15 + PostGIS, Redis 7 (Streams)                              |
| Transport | REST, WebSocket, Redis Streams (eventbus)                               |
| Infra     | Docker, docker-compose, GitHub Actions CI                               |
| Auth      | JWT (HS256)                                                             |
| Testing   | Vitest (+ Testing Library for the web)                                  |

The web app fetches and caches API data with
[TanStack Query](https://tanstack.com/query) (`QueryClientProvider` is set up in
`web/src/App.tsx`). Types shared between services and the web live in
`packages/shared` and are consumed as `@nic/shared`.

# Architecture Diagram

```mermaid
graph TB
    %% subgraph EXT["External Data"]
        VE["VicEmergency"]
        BOM["BOM"]
    %% end

    %% subgraph NIC["NIC Services"]
        FS["Fleet Simulator"]
        PDA["Public Data Adapter"]
        CORR["Root Cause Correlator"]
        MOA["Outage API"]
        MLOCA["LoC API"]
        RA["Results API"]
    %% end

    %% subgraph DATA["Data Stores"]
        REDIS[("Redis Streams")]
        PG[("PostgreSQL + PostGIS")]
    %% end

    %% subgraph UI["Frontend"]
        WEB["Dashboard"]
    %% end

    %% Ingestion
    FS -->|events| REDIS
    FS -->|events| MLOCA
    PDA -->|poll| VE
    PDA -->|poll| BOM
    PDA -->|events| REDIS

    %% Correlation
    REDIS -->|events| CORR
    MOA -->|status| CORR
    MLOCA -->|events| CORR

    %% Results
    CORR -->|verdicts| REDIS
    CORR -->|records| PG

    %% API
    RA -->|verdicts| REDIS
    RA -->|outages| MOA
    RA -->|events| REDIS
    RA <-->|API| WEB

    %% Optional auth
    CORR -.->|auth| MOA
    RA -.->|auth| MOA
```
