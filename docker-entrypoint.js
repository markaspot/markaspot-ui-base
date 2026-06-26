#!/usr/bin/env node

// Simple Node.js entrypoint to handle environment variables for distroless
// This replaces the shell script since distroless has no shell

// Set runtime environment variables for Nuxt
// These convert short env var names to NUXT_PUBLIC_* format for Nuxt runtime config override
process.env.NUXT_PUBLIC_API_BASE = process.env.NUXT_PUBLIC_API_BASE || process.env.NUXT_API_BASE || 'http://api.default';
process.env.NUXT_PUBLIC_GEO_REPORT_API_BASE = process.env.NUXT_PUBLIC_GEO_REPORT_API_BASE || process.env.NUXT_GEOREPORT_API_BASE || process.env.NUXT_PUBLIC_API_BASE;
process.env.NUXT_PUBLIC_IMAGE_PROXY_BACKEND = process.env.NUXT_PUBLIC_IMAGE_PROXY_BACKEND || process.env.NUXT_IMAGE_PROXY_BACKEND || process.env.NUXT_PUBLIC_GEO_REPORT_API_BASE;
process.env.NUXT_PUBLIC_API_TIMEOUT = process.env.API_TIMEOUT || '30000';
process.env.NUXT_PUBLIC_SITE_KEY = process.env.SITE_KEY || 'default';
process.env.NUXT_PUBLIC_MAPBOX_KEY = process.env.MAPBOX_API_KEY || '';

// Log the configuration for debugging
console.log('Starting with configuration:');
console.log(`API Base: ${process.env.NUXT_PUBLIC_API_BASE}`);
console.log(`GeoReport API Base: ${process.env.NUXT_PUBLIC_GEO_REPORT_API_BASE}`);
console.log(`Image Proxy Backend: ${process.env.NUXT_PUBLIC_IMAGE_PROXY_BACKEND}`);
console.log(`API Timeout: ${process.env.NUXT_PUBLIC_API_TIMEOUT}`);
console.log(`GeoReport API Key: ${process.env.GEOREPORT_API_KEY ? 'configured' : 'not set'}`);
console.log(`Mapbox API Key: ${process.env.MAPBOX_API_KEY ? 'configured' : 'not set'}`);

// Validate required variables
if (!process.env.GEOREPORT_API_KEY) {
    console.error('Error: GEOREPORT_API_KEY is not set');
    process.exit(1);
}

// Start the Nuxt server
require('/app/.output/server/index.mjs');
