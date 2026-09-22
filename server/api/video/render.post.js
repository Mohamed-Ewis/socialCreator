import { startCategoryRender } from '../../utils/creatomateVideo.js'

const REGION_IDS = ['middle-east', 'world']
const CATEGORY_IDS = ['economy-political', 'sports', 'trend']

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
  const body = await readBody(event).catch(() => ({}))
  const region = asString(body?.region)
  const category = asString(body?.category)
  const stories = Array.isArray(body?.stories) ? body.stories : []
  const script = body?.script && typeof body.script === 'object' ? body.script : null

  if (!REGION_IDS.includes(region)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid region is required.'
    })
  }

  if (!CATEGORY_IDS.includes(category)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid category is required.'
    })
  }

  if (!stories.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one story is required to render a video.'
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
    const render = await startCategoryRender({
      apiKey,
      region,
      category,
      stories,
      script
    })

    if (!render?.id) {
      throw new Error('Creatomate did not return a render id.')
    }

    return {
      id: render.id,
      status: render.status || 'planned',
      url: render.url || '',
      category,
      region
    }
  } catch (error) {
    console.error('[api/video/render]', error)

    throw createError({
      statusCode: 502,
      statusMessage: error?.message || 'Could not start the Creatomate render.',
      data: {
        error: {
          code: 'creatomate_render_failed',
          message: error?.message || 'Could not start the Creatomate render.'
        }
      }
    })
  }
})
