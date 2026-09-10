FROM node:24-alpine

RUN npm install -g pnpm@10.6.3

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY services/correlator/package.json ./services/correlator/
COPY services/fleet-simulator/package.json ./services/fleet-simulator/
COPY services/mock-loc-api/package.json ./services/mock-loc-api/
COPY services/correlator/package.json ./services/correlator/
COPY services/public-data-adapter/package.json ./services/public-data-adapter/
COPY services/results-api/package.json ./services/results-api/
COPY web/package.json ./web/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY tsconfig.json ./
COPY packages/shared/ ./packages/shared/
COPY services/correlator/tsconfig.json ./services/correlator/tsconfig.json
COPY services/correlator/tsconfig.build.json ./services/correlator/tsconfig.build.json
COPY services/correlator/src/ ./services/correlator/src/

RUN pnpm --filter @nic/shared build && pnpm --filter @nic/correlator build

EXPOSE 3004
WORKDIR /app/services/correlator
CMD ["node", "dist/index.js"]
