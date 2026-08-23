FROM node:24-alpine

RUN npm install -g pnpm@10.6.3

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY services/correlator/package.json ./services/correlator/
COPY services/fleet-simulator/package.json ./services/fleet-simulator/
COPY services/mock-loc-api/package.json ./services/mock-loc-api/
COPY services/results-api/package.json ./services/results-api/
COPY services/public-data-adapter/package.json ./services/public-data-adapter/
COPY services/results-api/package.json ./services/results-api/
COPY web/package.json ./web/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY tsconfig.json ./
COPY packages/shared/ ./packages/shared/
COPY services/results-api/tsconfig.json ./services/results-api/tsconfig.json
COPY services/results-api/tsconfig.build.json ./services/results-api/tsconfig.build.json
COPY services/results-api/src/ ./services/results-api/src/

RUN pnpm --filter @nic/shared build && pnpm --filter @nic/results-api build

WORKDIR /app/services/results-api
EXPOSE 3005
CMD ["node", "dist/index.js"]
