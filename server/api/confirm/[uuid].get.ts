export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'UUID parameter is required'
    })
  }

  const config = useRuntimeConfig()
  const apiBase = config.apiBase || config.public.apiBase

  try {
    // Call the Drupal confirmation API endpoint
    const response = await $fetch(`${apiBase}/api/confirm/${uuid}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Nuxt/Frontend'
      }
    })

    // The new API returns JSON directly
    if (response && typeof response === 'object' && response.success !== undefined) {
      return response
    }

    // Fallback for unexpected response format
    throw createError({
      statusCode: 500,
      statusMessage: 'Unexpected response format from server'
    })

  } catch (error: unknown) {
    console.error('Confirmation API error:', error)

    const err = error as Record<string, unknown>;
    // Handle different error types
    if (err.statusCode === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Request not found or already processed'
      })
    }

    if (err.statusCode) {
      throw error
    }

    // Generic error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process confirmation'
    })
  }
})