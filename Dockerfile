# Next.js standalone image for Fly.io. Built remotely: `fly deploy --remote-only`.
# No secrets at build time — DATABASE_URL etc. are Fly secrets, injected at runtime.

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Offline IP → country/city for the login log (DB-IP Lite, CC BY 4.0, ~130 MB; lib/auth/geoDb.ts).
# Own stage so the download is cached while the script is unchanged. Never fails the build.
FROM node:22-slim AS geo
WORKDIR /app
COPY scripts/geo_db_fetch.mjs ./scripts/geo_db_fetch.mjs
RUN node scripts/geo_db_fetch.mjs

FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# standalone = server.js + the minimal node_modules it traced; static and public are copied beside it.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/content ./content
COPY --from=geo --chown=node:node /app/data ./data

# Release-command migrator (fly.toml [deploy]): the script, the SQL migrations, and the two
# packages it imports. Standalone tracing doesn't ship them as a resolvable package, so copy
# them whole (~19 MB). Neither has runtime dependencies of its own.
COPY --from=build --chown=node:node /app/scripts/db_migrate.mjs ./scripts/db_migrate.mjs
COPY --from=build --chown=node:node /app/drizzle ./drizzle
COPY --from=deps --chown=node:node /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps --chown=node:node /app/node_modules/@neondatabase/serverless ./node_modules/@neondatabase/serverless

USER node
EXPOSE 3000
CMD ["node", "server.js"]
