FROM node:24-alpine AS build

RUN npm install -g pnpm@10.6.3

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY services/correlator/package.json ./services/correlator/
COPY services/fleet-simulator/package.json ./services/fleet-simulator/
COPY services/mock-loc-api/package.json ./services/mock-loc-api/
COPY services/mock-outage-api/package.json ./services/mock-outage-api/
COPY services/public-data-adapter/package.json ./services/public-data-adapter/
COPY services/results-api/package.json ./services/results-api/
COPY web/package.json ./web/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY tsconfig.json ./
COPY packages/shared/ ./packages/shared/
COPY web/ ./web/

RUN pnpm --filter @nic/shared build && pnpm --filter @nic/web build

FROM nginx:alpine

COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html

EXPOSE 80
