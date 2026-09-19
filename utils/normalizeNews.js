import { createEmptyImage, createEmptyImportance, createEmptyNewsArticle, createEmptySource, createEmptyVideo, NEWS_TYPES } from '~/data/newsModel'
import { CATEGORY_IDS, DEFAULT_MODE, REGION_IDS } from '~/utils/constants'

const SOURCE_DOMAINS = {
  'Reuters': 'reuters.com',
  'AP': 'apnews.com',
  'BBC': 'bbc.com',
  'Al Jazeera': 'aljazeera.com',
  'Ahram Online': 'english.ahram.org.eg',
  'Arab News': 'arabnews.com',
  'The National': 'thenationalnews.com',
  'Times of Israel': 'timesofisrael.com',
  'Financial Times': 'ft.com',
  'Bloomberg': 'bloomberg.com',
  'The Guardian': 'theguardian.com'
}

const ME_COUNTRIES = new Set([
  'egypt', 'saudi arabia', 'iran', 'palestine', 'israel', 'yemen', 'uae',
  'qatar', 'lebanon', 'iraq', 'jordan', 'syria', 'kuwait', 'oman', 'bahrain'
])

function asString(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return fallback
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }

  if (value === 'true' || value === 1 || value === '1') {
    return true
  }

  if (value === 'false' || value === 0 || value === '0') {
    return false
  }

  return fallback
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (value === null || value === undefined || value === '') {
    return []
  }

  return [value]
}

function firstValue(object, keys, fallback = '') {
  if (!object || typeof object !== 'object') {
    return fallback
  }

  for (const key of keys) {
    const value = object[key]

    if (value !== null && value !== undefined && value !== '') {
      return value
    }
  }

  return fallback
}

function normalizeKey(value) {
  return asString(value).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function hashString(value) {
  let hash = 2166136261
  const text = asString(value)

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

function toIsoDate(value) {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function mapLanguage(value) {
  const key = normalizeKey(value)

  if (!key) {
    return ''
  }

  if (['ar', 'arabic', 'ara'].includes(key)) {
    return 'ar'
  }

  if (['en', 'english', 'eng'].includes(key)) {
    return 'en'
  }

  return key.slice(0, 8)
}

function mapCategory(value) {
  const key = normalizeKey(value)

  if (['economy-political', 'economy political', 'economy', 'economic', 'politics', 'political', 'policy', 'energy', 'oil'].includes(key)) {
    return 'economy-political'
  }

  if (['sports', 'sport'].includes(key)) {
    return 'sports'
  }

  if (['trend', 'trends', 'trending', 'tech', 'technology', 'ai', 'science', 'culture', 'viral'].includes(key)) {
    return 'trend'
  }

  return CATEGORY_IDS.includes(value) ? value : ''
}

function mapRegion(value) {
  const key = normalizeKey(value)

  if (['middle-east', 'middle east', 'me', 'mena', 'gulf', 'levant', 'north africa', 'wider middle east'].includes(key)) {
    return 'middle-east'
  }

  if (['world', 'global', 'international', 'worldwide'].includes(key)) {
    return 'world'
  }

  return REGION_IDS.includes(value) ? value : ''
}

function inferRegionFromCountries(countries) {
  const hits = countries.filter((country) => ME_COUNTRIES.has(normalizeKey(country)))

  if (hits.length && hits.length >= countries.length / 2) {
    return 'middle-east'
  }

  return ''
}

function pickRegion(raw) {
  const mapped = mapRegion(firstValue(raw, ['desk', 'mode', 'region', 'geo', 'area']))

  if (mapped) {
    return mapped
  }

  return inferRegionFromCountries(asArray(raw.countries || raw.country)) || DEFAULT_MODE
}

function normalizeSource(rawSource, fallbackUrl = '') {
  if (!rawSource) {
    const url = asString(fallbackUrl)
    return {
      ...createEmptySource(),
      domain: domainFromUrl(url),
      url
    }
  }

  if (typeof rawSource === 'string') {
    const name = rawSource.trim()
    const domain = SOURCE_DOMAINS[name] || ''
    const url = domain ? `https://${domain}` : ''

    return {
      name,
      domain,
      url
    }
  }

  const name = asString(firstValue(rawSource, ['name', 'title', 'id', 'source']))
  const url = asString(firstValue(rawSource, ['url', 'href', 'link', 'website']), fallbackUrl)
  const domain = asString(rawSource.domain) || domainFromUrl(url) || SOURCE_DOMAINS[name] || ''

  return {
    name,
    domain,
    url: url || (domain ? `https://${domain}` : '')
  }
}

function normalizeImage(raw, title) {
  if (!raw && typeof raw !== 'string') {
    const image = firstValue(raw || {}, ['image', 'imageUrl', 'image_url', 'thumbnail', 'urlToImage', 'enclosure'])

    if (!image) {
      return {
        ...createEmptyImage(),
        alt: title
      }
    }

    return normalizeImage(image, title)
  }

  if (typeof raw === 'string') {
    return {
      url: raw,
      source: domainFromUrl(raw),
      alt: title
    }
  }

  if (typeof raw !== 'object' || raw === null) {
    return {
      ...createEmptyImage(),
      alt: title
    }
  }

  const url = asString(firstValue(raw, ['url', 'src', 'href', 'link']))

  return {
    url,
    source: asString(raw.source) || domainFromUrl(url),
    alt: asString(raw.alt, title)
  }
}

function uniquenessKey(input) {
  return [
    asString(input.source?.domain || input.source?.name),
    asString(input.publishedAt),
    asString(input.title),
    asString(input.url)
  ].join('|')
}

export function createNewsId(input = {}, index = 0) {
  const existing = asString(input.id)

  if (existing) {
    return existing.replace(/\s+/g, '-').slice(0, 120)
  }

  return `news_${hashString(`${uniquenessKey(input)}:${index}`)}`
}

export function normalizeNewsArticle(raw = {}, context = {}) {
  if (typeof raw !== 'object' || raw === null) {
    return createEmptyNewsArticle({
      id: createNewsId({}, context.index)
    })
  }

  const title = asString(firstValue(raw, ['title', 'headline', 'name', 'webTitle']))
  const brief = asString(firstValue(raw, ['brief', 'excerpt', 'description', 'summary', 'dek', 'contentSnippet', 'content']))
  const url = asString(firstValue(raw, ['url', 'link', 'webUrl', 'canonicalUrl', 'href']))
  const publishedAt = toIsoDate(firstValue(raw, ['publishedAt', 'published_at', 'pubDate', 'isoDate', 'date', 'datetime']))
  const language = mapLanguage(firstValue(raw, ['language', 'lang', 'locale']))
  const category = mapCategory(firstValue(raw, ['category', 'section', 'topic', 'pillar']))
  const region = pickRegion(raw)
  const countries = asArray(firstValue(raw, ['countries', 'country', 'location'], []))
    .map((item) => asString(typeof item === 'object' ? item.name || item.label : item))
    .filter(Boolean)

  const source = normalizeSource(firstValue(raw, ['source', 'provider', 'publisher']), url)
  const extraSources = asArray(raw.sources).map((item) => normalizeSource(item)).filter((item) => item.name || item.url)
  const sources = extraSources.length ? extraSources : (source.name || source.url ? [source] : [])
  const originalArticles = asArray(raw.originalArticles).filter((item) => item && typeof item === 'object')
  const typeValue = asString(raw.type).toLowerCase()
  const type = typeValue === NEWS_TYPES.story || originalArticles.length > 1 ? NEWS_TYPES.story : NEWS_TYPES.article

  const importanceRaw = raw.importance && typeof raw.importance === 'object' ? raw.importance : {}
  const score = asNumber(firstValue(importanceRaw, ['score']) || raw.importanceScore || raw.score, 0)
  const sourceCount = asNumber(importanceRaw.sourceCount, Math.max(sources.length, originalArticles.length, source.name ? 1 : 0))
  const publishedMs = publishedAt ? Date.parse(publishedAt) : 0
  const freshnessBase = Date.parse('2026-09-19T12:00:00.000Z')
  const ageHours = publishedMs ? Math.max(0, (freshnessBase - publishedMs) / 3600000) : 72
  const freshness = asNumber(importanceRaw.freshness, Math.max(0, Math.round(100 - Math.min(ageHours, 72) * (100 / 72))))
  const relevance = asNumber(importanceRaw.relevance, score)

  const selected = asBoolean(raw.selected, false)
  const selectionOrder = raw.selectionOrder === null || raw.selectionOrder === undefined
    ? null
    : asNumber(raw.selectionOrder, null)

  const videoRaw = raw.video && typeof raw.video === 'object' ? raw.video : {}
  const video = {
    ...createEmptyVideo(),
    arabic: asBoolean(videoRaw.arabic, region === 'middle-east'),
    english: asBoolean(videoRaw.english, region === 'world'),
    order: videoRaw.order === null || videoRaw.order === undefined ? selectionOrder : asNumber(videoRaw.order, null)
  }

  const imageInput = raw.image !== undefined ? raw.image : firstValue(raw, ['imageUrl', 'image_url', 'thumbnail', 'urlToImage'])
  const image = typeof imageInput === 'string' || imageInput
    ? normalizeImage(imageInput, title)
    : { ...createEmptyImage(), alt: title }

  const article = createEmptyNewsArticle({
    id: createNewsId({
      id: raw.id,
      title,
      url,
      publishedAt,
      source
    }, context.index),
    type,
    title,
    brief,
    language,
    category,
    region,
    countries,
    publishedAt,
    url,
    image,
    source,
    sources,
    originalArticles,
    importance: {
      ...createEmptyImportance(),
      score,
      freshness,
      sourceCount,
      relevance
    },
    selected,
    selectionOrder,
    video
  })

  return article
}

function extractList(raw) {
  if (!raw) {
    return []
  }

  if (Array.isArray(raw)) {
    return raw
  }

  if (typeof raw !== 'object') {
    return []
  }

  const list = firstValue(raw, ['articles', 'stories', 'items', 'results', 'data', 'docs'], null)

  if (Array.isArray(list)) {
    return list
  }

  if (raw.title || raw.headline) {
    return [raw]
  }

  return []
}

export function normalizeNewsResponse(raw) {
  const seen = new Set()

  return extractList(raw)
    .map((item, index) => normalizeNewsArticle(item, { index }))
    .filter((article) => article.title)
    .map((article, index) => {
      if (seen.has(article.id)) {
        return {
          ...article,
          id: `${article.id}-${index}`
        }
      }

      seen.add(article.id)
      return article
    })
}

export function validateNewsArticle(article) {
  const errors = []

  if (!article || typeof article !== 'object') {
    return {
      valid: false,
      errors: ['Article is missing.']
    }
  }

  if (!asString(article.id)) {
    errors.push('id is required.')
  }

  if (!asString(article.title)) {
    errors.push('title is required.')
  }

  if (article.type && !Object.values(NEWS_TYPES).includes(article.type)) {
    errors.push('type must be article or story.')
  }

  if (article.region && !REGION_IDS.includes(article.region)) {
    errors.push('region must be middle-east or world.')
  }

  if (article.category && !CATEGORY_IDS.includes(article.category)) {
    errors.push('category must be economy-political, sports, or trend.')
  }

  if (!Array.isArray(article.countries)) {
    errors.push('countries must be an array.')
  }

  if (article.publishedAt && Number.isNaN(Date.parse(article.publishedAt))) {
    errors.push('publishedAt must be a valid date.')
  }

  if (!article.source || typeof article.source !== 'object') {
    errors.push('source must be an object.')
  }

  if (!article.importance || typeof article.importance !== 'object') {
    errors.push('importance must be an object.')
  }

  if (!article.video || typeof article.video !== 'object') {
    errors.push('video must be an object.')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
