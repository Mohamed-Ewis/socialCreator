/**
 * TheNewsAPI provider (server-only).
 * Fully self-contained — no ~/ client aliases (Nitro ESM cannot resolve them).
 * Never import this from browser code.
 */

const BASE_URL = 'https://api.thenewsapi.com/v1/news/all'

export class NewsProviderError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message)
    this.name = 'NewsProviderError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

function asString(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function toIsoDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function mapLanguage(value) {
  const key = asString(value).toLowerCase()
  if (!key) return ''
  if (['ar', 'arabic', 'ara'].includes(key)) return 'ar'
  if (['en', 'english', 'eng'].includes(key)) return 'en'
  return key.slice(0, 8)
}

function mapCategory(categories) {
  const list = Array.isArray(categories) ? categories : [categories]
  for (const raw of list) {
    const key = asString(raw).toLowerCase()
    if (key === 'sports' || key === 'sport') return 'sports'
    if (['business', 'politics', 'economy', 'economic', 'political'].includes(key)) {
      return 'economy-political'
    }
  }
  for (const raw of list) {
    const key = asString(raw).toLowerCase()
    if (['tech', 'technology', 'science', 'entertainment'].includes(key)) return 'trend'
  }
  return ''
}

function mapRegionFromLocale(locale) {
  const key = asString(locale).toLowerCase()
  const me = new Set([
    'eg', 'sa', 'ae', 'qa', 'kw', 'bh', 'om', 'jo', 'lb', 'sy', 'iq', 'ye', 'ps', 'il', 'ir', 'tr', 'ma', 'dz', 'tn', 'ly', 'sd'
  ])
  if (me.has(key)) return 'middle-east'
  if (key) return 'world'
  return ''
}

function hashId(input) {
  let hash = 2166136261
  const text = asString(input)
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function normalizeArticle(raw, index = 0) {
  if (!raw || typeof raw !== 'object') {
    throw new NewsProviderError('malformed_response', 'Malformed article in provider response.', 502)
  }

  const title = asString(raw.title)
  const brief = asString(raw.description || raw.snippet)
  const url = asString(raw.url)
  const publishedAt = toIsoDate(raw.published_at)
  const language = mapLanguage(raw.language)
  const categories = Array.isArray(raw.categories) ? raw.categories : []
  const category = mapCategory(categories)
  const locale = asString(raw.locale)
  const region = mapRegionFromLocale(locale)
  const domain = asString(raw.source) || domainFromUrl(url)
  const imageUrl = asString(raw.image_url)
  const id = asString(raw.uuid) || asString(raw.id) || `news_${hashId(`${domain}|${publishedAt}|${title}|${url}:${index}`)}`

  const source = {
    name: domain,
    domain,
    url: domain ? `https://${domain}` : ''
  }

  const relevance = typeof raw.relevance_score === 'number' ? Math.round(raw.relevance_score) : 0

  return {
    id,
    type: 'article',
    title,
    brief,
    language,
    category,
    region,
    countries: locale ? [locale] : [],
    publishedAt,
    url,
    image: {
      url: imageUrl,
      source: domainFromUrl(imageUrl) || domain,
      alt: title
    },
    source,
    sources: source.name || source.url ? [source] : [],
    originalArticles: [],
    importance: {
      score: relevance,
      freshness: 0,
      sourceCount: source.name ? 1 : 0,
      relevance
    },
    selected: false,
    selectionOrder: null,
    video: {
      arabic: region === 'middle-east',
      english: region === 'world',
      order: null
    }
  }
}

function buildQuery(params, apiKey) {
  const query = { api_token: apiKey }

  if (params.query) query.search = asString(params.query)
  if (params.language) query.language = asString(params.language)
  if (params.published_after) query.published_after = asString(params.published_after)
  if (params.published_before) query.published_before = asString(params.published_before)
  if (params.categories) query.categories = asString(params.categories)
  if (params.countries) query.locale = asString(params.countries)
  if (params.domains) query.domains = asString(params.domains)
  if (params.limit) query.limit = asString(params.limit)
  if (params.page) query.page = asString(params.page)
  if (params.sort) {
    const sort = asString(params.sort)
    query.sort = sort === 'published_on' ? 'published_at' : sort
  }

  return query
}

function mapUpstreamError(status, body) {
  const code = body?.error?.code || body?.code
  const message = body?.error?.message || body?.message

  if (status === 401 || code === 'invalid_api_token') {
    return new NewsProviderError('invalid_api_token', message || 'Invalid API token.', 401)
  }
  if (status === 402 || code === 'usage_limit_reached') {
    return new NewsProviderError('usage_limit_reached', message || 'API usage limit reached.', 402)
  }
  if (status === 429 || code === 'rate_limit_reached') {
    return new NewsProviderError('rate_limit_reached', message || 'API rate limit reached. Try again shortly.', 429)
  }
  if (status === 400 || code === 'malformed_parameters') {
    return new NewsProviderError('malformed_parameters', message || 'Invalid search parameters.', 400)
  }
  if (status === 403) {
    return new NewsProviderError('endpoint_access_restricted', message || 'Endpoint access restricted for this plan.', 403)
  }
  if (status >= 500) {
    return new NewsProviderError('upstream_server_error', message || 'News provider server error.', 502)
  }

  return new NewsProviderError(
    'api_error',
    message || `News provider request failed (${status}).`,
    status >= 400 ? status : 502
  )
}

export async function searchTheNewsApi(params = {}, { apiKey } = {}) {
  const key = asString(apiKey)

  if (!key) {
    throw new NewsProviderError('missing_api_key', 'News API key is not configured.', 500)
  }

  const query = buildQuery(params, key)

  let response
  try {
    response = await $fetch.raw(BASE_URL, {
      method: 'GET',
      query,
      ignoreResponseError: true
    })
  } catch (error) {
    throw new NewsProviderError(
      'network_failure',
      'Failed to reach the news provider. Check network connectivity.',
      503,
      { cause: asString(error?.message) }
    )
  }

  const status = response.status
  let body = response._data

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      throw new NewsProviderError('malformed_response', 'Provider returned a non-JSON response.', 502)
    }
  }

  if (status < 200 || status >= 300) {
    throw mapUpstreamError(status, body)
  }

  if (!body || typeof body !== 'object') {
    throw new NewsProviderError('malformed_response', 'Provider returned an unexpected payload.', 502)
  }

  const data = body.data
  if (data === undefined || data === null) {
    throw new NewsProviderError('malformed_response', 'Provider response missing data field.', 502)
  }

  if (!Array.isArray(data)) {
    throw new NewsProviderError('malformed_response', 'Provider data field must be an array.', 502)
  }

  let articles
  try {
    articles = data
      .map((item, index) => normalizeArticle(item, index))
      .filter((article) => article.title)
  } catch (error) {
    if (error instanceof NewsProviderError) throw error
    throw new NewsProviderError('malformed_response', 'Failed to normalize provider articles.', 502)
  }

  const meta = {
    found: Number(body.meta?.found) || articles.length,
    returned: Number(body.meta?.returned) || articles.length,
    limit: Number(body.meta?.limit) || Number(params.limit) || articles.length,
    page: Number(body.meta?.page) || Number(params.page) || 1
  }

  return {
    articles,
    meta,
    empty: articles.length === 0
  }
}