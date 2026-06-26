# Build Stage - Docker Hardened Image with dev tools
FROM node:24 AS builder
ARG BUILDTIME
ARG VERSION
ARG REVISION
ARG CLIENT=default
ARG USE_PROXY=false
ARG NUXT_PRO=false
ARG NUXT_ENTERPRISE=false
ARG NUXT_FASTMAP=false
ARG BUILD_NODE_OPTIONS=--max_old_space_size=8192

ENV CLIENT=${CLIENT} \
    NUXT_PRO=${NUXT_PRO} \
    NUXT_ENTERPRISE=${NUXT_ENTERPRISE} \
    NUXT_FASTMAP=${NUXT_FASTMAP} \
    NUXT_PUBLIC_APP_VERSION=${VERSION:-unset} \
    NUXT_PUBLIC_BUILD_TIME=${BUILDTIME:-unset} \
    NUXT_PUBLIC_GIT_SHA=${REVISION:-unset} \
    USE_PROXY=${USE_PROXY}

WORKDIR /build

# Install pnpm via npm. The updated node:24 image creates corepack's
# pnpm shim without an execute bit (`/usr/bin/pnpm: Permission denied`, exit 126),
# so `corepack enable` is unusable there; `npm install -g` produces a proper
# executable. Version pinned to match packageManager in package.json.
RUN npm install -g pnpm@11.1.2

# Install dependencies with pnpm and memory optimization.
# scripts/ is copied before install so the postinstall lifecycle
# (node scripts/setup-git-hooks.mjs) can find the file.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY scripts/ ./scripts/
RUN NODE_OPTIONS="--max_old_space_size=4096" pnpm install --frozen-lockfile --prod=false

# Copy source files
COPY . .

# Validate locales before build
RUN ls -alR i18n/locales

# Build translations and Nuxt with memory optimization and cleanup
RUN NODE_OPTIONS="--max_old_space_size=4096" node scripts/build.js && \
    rm -rf node_modules/.cache
RUN NODE_OPTIONS="${BUILD_NODE_OPTIONS}" pnpm exec nuxt build && \
    rm -rf .nuxt/cache && \
    pnpm prune --prod --ignore-scripts


# Production Stage - Docker Hardened Image (minimal, no shell)
FROM node:24-slim
WORKDIR /app

# Copy only the built output (DHI uses node user with UID 1000)
COPY --from=builder --chown=1000:1000 /build/.output /app/.output

# Copy the Node.js entrypoint script and make it executable
COPY --chown=1000:1000 --chmod=755 docker-entrypoint.js /app/docker-entrypoint.js

# Set environment variables
ENV HOST=0.0.0.0 \
    PORT=3000 \
    CLIENT=default \
    NODE_ENV=production

# Note: Environment variables for API configuration should be set at runtime
# via docker run -e or docker-compose environment section

EXPOSE 3000

# Run as non-root user (DHI includes a node user)
USER 1000

# Use the Node.js entrypoint script via node
CMD ["node", "/app/docker-entrypoint.js"]
