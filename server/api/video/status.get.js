import { fetchCreatomateRender } from '../../utils/creatomateVideo.js'

function asString(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function firstString(...values) {
  for (const value of values) {
    const text = asString(value)
    if (text) {
      return text
    }
  }

  return ''
}

function resolveApiKey(config) {
  return firstString(
    process.env.CREATOMATE_API_KEY,
    process.env.NUXT_CREATOMATE_API_KEY,
    config.creatomateApiKey
  )
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = asString(query.id)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Render id is required.'
    })
  }

  const config = useRuntimeConfig(event)
  const apiKey = resolveApiKey(config)

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'CREATOMATE_API_KEY is missing on the server.'
    })
  }

  try {
    const render = await fetchCreatomateRender({ apiKey, renderId: id })

    return {
      id: render.id,
      status: render.status,
      url: render.url || '',
      errorMessage: render.errorMessage || '',
      snapshotUrl: render.snapshotUrl || '',
      duration: render.duration || null,
      width: render.width || null,
      height: render.height || null
    }
  } catch (error) {
    console.error('[api/video/status]', error)

    throw createError({
      statusCode: 502,
      statusMessage: error?.message || 'Could not fetch the Creatomate render status.',
      data: {
        error: {
          code: 'creatomate_status_failed',
          message: error?.message || 'Could not fetch the Creatomate render status.'
        }
      }
    })
  }
})
