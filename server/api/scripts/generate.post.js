import { generateVideoScript } from '../../utils/scriptGenerator.js'

const REGION_IDS = ['middle-east', 'world']
const CATEGORY_IDS = ['economy-political', 'sports', 'trend']

function asString(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function compactIncomingStory(story, index) {
  const source = typeof story?.source === 'string'
    ? story.source
    : story?.source?.name || 'Unknown'

  return {
    id: asString(story?.id) || `story-${index + 1}`,
    title: asString(story?.title),
    brief: asString(story?.brief || story?.excerpt),
    url: asString(story?.url),
    source: asString(source) || 'Unknown',
    countries: Array.isArray(story?.countries) ? story.countries : [],
    order: Number(story?.order) || index + 1
  }
}

function resolveOpenAi(config) {
  return {
    apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY || process.env.NUXT_OPENAI_API_KEY || '',
    apiBase: config.openaiApiBase || process.env.OPENAI_API_BASE || process.env.NUXT_OPENAI_API_BASE || '',
    model: config.openaiModel || process.env.OPENAI_MODEL || process.env.NUXT_OPENAI_MODEL || 'gpt-4o-mini'
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const region = asString(body?.region)
  const category = asString(body?.category)
  const focusStoryId = asString(body?.focusStoryId) || null
  const stories = Array.isArray(body?.stories)
    ? body.stories.map((story, index) => compactIncomingStory(story, index))
    : []

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

  const config = useRuntimeConfig(event)
  const openai = resolveOpenAi(config)

  try {
    const result = await generateVideoScript({
      region,
      category,
      stories,
      apiKey: openai.apiKey,
      apiBase: openai.apiBase,
      model: openai.model,
      focusStoryId,
      existingScript: body?.existingScript || null
    })

    return {
      script: result.script,
      warning: result.warning
    }
  } catch (error) {
    console.error('[api/scripts/generate]', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Could not generate the spoken script.',
      data: {
        error: {
          code: 'script_generate_failed',
          message: error.message || 'Could not generate the spoken script.'
        }
      }
    })
  }
})
