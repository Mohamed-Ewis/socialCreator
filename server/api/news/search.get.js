import { searchNews, NewsProviderError } from '../../utils/newsProvider.js'

function pickQuery(event) {
  const q = getQuery(event)
  return {
    query: q.query,
    language: q.language,
    published_after: q.published_after,
    published_before: q.published_before,
    categories: q.categories,
    countries: q.countries,
    domains: q.domains,
    limit: q.limit,
    page: q.page,
    sort: q.sort
  }
}

function resolveApiKey(config) {
  return (
    config.theNewsApiKey ||
    config.newsApiKey ||
    process.env.THE_NEWS_API_KEY ||
    process.env.NUXT_THE_NEWS_API_KEY ||
    process.env.NEWS_API_KEY ||
    ''
  )
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const apiKey = resolveApiKey(config)
  const params = pickQuery(event)

  try {
    const result = await searchNews(params, { apiKey })

    return {
      articles: result.articles,
      meta: result.meta,
      empty: result.empty
    }
  } catch (error) {
    if (error instanceof NewsProviderError) {
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.message,
        data: {
          error: {
            code: error.code,
            message: error.message
          }
        }
      })
    }

    console.error('[api/news/search]', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Unexpected news search failure.',
      data: {
        error: {
          code: 'internal_error',
          message: 'Unexpected news search failure.'
        }
      }
    })
  }
})