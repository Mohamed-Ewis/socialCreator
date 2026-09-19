export const NEWS_TYPES = {
  article: 'article',
  story: 'story'
}

export const REGION_IDS = ['middle-east', 'world']

export function createEmptyImage() {
  return {
    url: '',
    source: '',
    alt: ''
  }
}

export function createEmptySource() {
  return {
    name: '',
    domain: '',
    url: ''
  }
}

export function createEmptyImportance() {
  return {
    score: 0,
    freshness: 0,
    sourceCount: 0,
    relevance: 0
  }
}

export function createEmptyVideo() {
  return {
    arabic: false,
    english: false,
    order: null
  }
}

export function createEmptyNewsArticle(overrides = {}) {
  return {
    id: '',
    type: NEWS_TYPES.article,
    title: '',
    brief: '',
    language: '',
    category: '',
    region: '',
    countries: [],
    publishedAt: null,
    url: '',
    image: createEmptyImage(),
    source: createEmptySource(),
    sources: [],
    originalArticles: [],
    importance: createEmptyImportance(),
    selected: false,
    selectionOrder: null,
    video: createEmptyVideo(),
    ...overrides
  }
}
