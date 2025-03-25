#!/bin/sh
set -e

# Set runtime environment variables for Nuxt
export NUXT_PUBLIC_API_BASE="${NUXT_API_BASE:-http://api.default}"
export NUXT_PUBLIC_API_TIMEOUT="${API_TIMEOUT:-30000}"
export NUXT_PUBLIC_SITE_KEY="${SITE_KEY:-default}"
export GEOREPORT_API_KEY="${GEOREPORT_API_KEY}"  # Just pass through as is

# Log the configuration for debugging
echo "Starting with configuration:"
echo "API Base: $NUXT_PUBLIC_API_BASE"
echo "API Timeout: $NUXT_PUBLIC_API_TIMEOUT"
echo "GeoReport API Key: ${GEOREPORT_API_KEY:+configured}"

# Optional: Validate required variables
if [ -z "$GEOREPORT_API_KEY" ]; then
    echo "Error: GEOREPORT_API_KEY is not set"
    exit 1
fi

exec "$@"
