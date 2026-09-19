export const APP_NAME = 'News Research'

export const EXPORT_MIN = 20
export const EXPORT_MAX = 30

export const DEFAULT_MODE = 'middle-east'
export const DEFAULT_CATEGORY = 'all'
export const SEARCH_INPUT_ID = 'research-search-input'
export const REGION_IDS = ['middle-east', 'world']
export const CATEGORY_IDS = ['economy-political', 'sports', 'trend']

export const SEARCH_STATUS = {
  idle: 'idle',
  loading: 'loading',
  ready: 'ready',
  error: 'error'
}

export const DEFAULT_FILTERS = {
  timeRange: 'all',
  category: 'all',
  country: 'all',
  region: 'all',
  language: 'all',
  source: 'all',
  sortBy: 'importance'
}

export const TIME_RANGE_OPTIONS = [
  { id: '6h', label: 'Last 6 hours' },
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'Any time' }
]

export const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'importance', label: 'Importance' },
  { id: 'relevance', label: 'Relevance' }
]

export const LANGUAGE_OPTIONS = [
  { id: 'all', label: 'Any language' },
  { id: 'ar', label: 'Arabic' },
  { id: 'en', label: 'English' }
]
