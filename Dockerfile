# Build Stage
FROM node:23-alpine3.21 AS builder

ARG BUILDTIME
ARG VERSION
ARG REVISION
ARG CLIENT=default
ARG USE_PROXY=true

ENV CLIENT=${CLIENT} \
    NUXT_PUBLIC_APP_VERSION=${VERSION:-unset} \
    NUXT_PUBLIC_BUILD_TIME=${BUILDTIME:-unset} \
    NUXT_PUBLIC_GIT_SHA=${REVISION:-unset} \
    USE_PROXY=${USE_PROXY}

WORKDIR /build

# Install dependencies
COPY package*.json ./
RUN npm ci --no-audit

# Copy source files
COPY . .

# Setup locales directory structure for merged
RUN mkdir -p i18n/locales/merged
# Copy default en.ts to merged without any merging needed
RUN cp i18n/locales/default/en.ts i18n/locales/merged/en.ts

# Build Nuxt
RUN npm run build

# SBOM Generation Stage
FROM alpine:3.19 AS sbom
RUN apk add --no-cache syft
COPY --from=builder /build /build
RUN syft /build -o spdx-json=/sbom.json

# Production Stage
FROM node:23-alpine3.21

WORKDIR /app

# Add app user
RUN addgroup -g 1001 app && \
    adduser -u 1001 -G app -s /bin/sh -D app && \
    apk add --no-cache bash

# Copy SBOM and app files
COPY --from=sbom /sbom.json /sbom.json
COPY --from=builder /build/.output /app/.output
COPY --from=builder /build/package*.json ./

# Install production dependencies
RUN npm ci --omit=dev --no-audit --no-fund && \
    chown -R app:app /app

# Entry setup
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh && \
    chown app:app /docker-entrypoint.sh

USER app
EXPOSE 3000
ENV HOST=0.0.0.0 PORT=3000 CLIENT=default

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
