import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  const isDev = process.env.NODE_ENV === 'development'
  const allowInProd = process.env.ALLOW_BUILD_INFO === 'true'

  if (!isDev && !allowInProd) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found'
    })
  }

  const buildInfo = {
    timestamp: new Date().toISOString(),
    commit: process.env.COMMIT_HASH || process.env.GIT_COMMIT || process.env.NUXT_PUBLIC_GIT_SHA || 'dev-build',
    version: process.env.NUXT_PUBLIC_APP_VERSION || process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    buildDate: new Date().toLocaleString('de-DE', { 
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    buildTime: process.env.NUXT_PUBLIC_BUILD_TIME || null
  }

  return buildInfo
})
