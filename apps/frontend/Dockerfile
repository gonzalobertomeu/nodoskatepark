FROM oven/bun:1.4-slim AS base
WORKDIR /repo

FROM base AS deps
COPY package.json bun.lock* ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
RUN bun run --cwd apps/frontend build

FROM oven/bun:1.4-slim AS runtime
WORKDIR /repo
RUN bun add -g serve
COPY --from=build /repo/apps/frontend/dist ./apps/frontend/dist

EXPOSE 4321
CMD ["bunx", "serve", "-s", "apps/frontend/dist", "-l", "4321"]
