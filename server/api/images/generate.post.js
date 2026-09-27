import { generateStoryImage, IMAGE_DEFAULTS } from '../../utils/imageGenerator.js'

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

function compactIncomingStory(story = {}) {
  const source = typeof story?.source === 'string'
    ? story.source
    : story?.source?.name || ''

  return {
    id: asString(story?.id) || 'story',
    title: asString(story?.title),
    brief: asString(story?.brief || story?.excerpt || story?.description),
    url: asString(story?.url),
    source: asString(source),
    countries: Array.isArray(story?.countries) ? story.countries : [],
    category: asString(story?.category)
  }
}

function resolveOpenAi(config) {
  return {
    apiKey: firstString(
      process.env.OPENAI_API_KEY,
      process.env.NUXT_OPENAI_API_KEY,
      process.env.GEMINI_API_KEY,
      config.openaiApiKey
    ),
    apiBase: firstString(
      process.env.OPENAI_API_BASE,
      process.env.NUXT_OPENAI_API_BASE,
      config.openaiApiBase
    ),
    imageModel: firstString(
      process.env.OPENAI_IMAGE_MODEL,
      process.env.NUXT_OPENAI_IMAGE_MODEL,
      config.openaiImageModel,
      IMAGE_DEFAULTS.model
    ),
    imageSize: firstString(
      process.env.OPENAI_IMAGE_SIZE,
      process.env.NUXT_OPENAI_IMAGE_SIZE,
      config.openaiImageSize,
      IMAGE_DEFAULTS.size
    ),
    imageProvider: firstString(
      process.env.IMAGE_PROVIDER,
      process.env.NUXT_IMAGE_PROVIDER,
      config.imageProvider
    ),
    geminiApiKey: firstString(
      process.env.GEMINI_API_KEY,
      process.env.NUXT_GEMINI_API_KEY,
      config.geminiApiKey
    )
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const story = compactIncomingStory(body?.story || body)
  const prompt = asString(body?.prompt)

  if (!story.title && !story.brief) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A story with title or description is required.'
    })
  }

  const config = useRuntimeConfig(event)
  const openai = resolveOpenAi(config)

  console.info('[api/images/generate]', {
    model: openai.imageModel,
    size: openai.imageSize,
    apiBase: openai.apiBase || IMAGE_DEFAULTS.base,
    imageProvider: openai.imageProvider || '(auto)',
    hasKey: Boolean(openai.apiKey || openai.geminiApiKey),
    storyId: story.id
  })

  try {
    const result = await generateStoryImage({
      story,
      apiKey: openai.apiKey,
      apiBase: openai.apiBase,
      model: openai.imageModel,
      size: openai.imageSize,
      prompt,
      imageProvider: openai.imageProvider,
      geminiApiKey: openai.geminiApiKey
    })

    return {
      image: {
        storyId: result.storyId,
        url: result.url,
        path: result.path,
        prompt: result.prompt,
        revisedPrompt: result.revisedPrompt,
        model: result.model,
        size: result.size,
        provider: result.provider,
        generatedAt: result.generatedAt,
        title: story.title,
        brief: story.brief
      }
    }
  } catch (error) {
    console.error('[api/images/generate]', error)

    const statusCode = error?.status === 401 || error?.status === 403
      ? error.status
      : error?.status === 404 || error?.status === 400
        ? 502
        : 500

    throw createError({
      statusCode,
      statusMessage: error?.message || 'Could not generate the image.',
      data: {
        error: {
          code: 'image_generate_failed',
          message: error?.message || 'Could not generate the image.'
        }
      }
    })
  }
})
