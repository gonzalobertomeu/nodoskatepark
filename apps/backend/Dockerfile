FROM oven/bun:1.4-slim AS base
WORKDIR /repo

FROM base AS deps
COPY package.json bun.lock* ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
RUN bun run --cwd apps/backend --bun prisma generate --schema prisma/schema.prisma
RUN bun run --cwd apps/backend build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /repo/apps/backend/dist ./apps/backend/dist
COPY --from=build /repo/apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/package.json apps/backend/package.json
COPY --from=build /repo/packages/contracts/package.json packages/contracts/package.json
COPY --from=build /repo/packages/contracts/node_modules packages/contracts/node_modules
COPY --from=build /repo/packages/contracts/src packages/contracts/src

EXPOSE 3000
CMD ["bun", "apps/backend/dist/main.js"]
