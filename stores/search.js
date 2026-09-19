import { DEFAULT_CATEGORY, DEFAULT_FILTERS, DEFAULT_MODE, SEARCH_STATUS } from '~/utils/constants'

function cloneFilters() {
  return { ...DEFAULT_FILTERS }
}

export const useSearchStore = defineStore('search', () => {
  const query = ref('')
  const mode = ref(DEFAULT_MODE)
  const category = ref(DEFAULT_CATEGORY)
  const filters = ref(cloneFilters())
  const status = ref(SEARCH_STATUS.idle)
  const error = ref(null)
  const lastSearchedAt = ref(null)
  const activePresetId = ref(null)

  const hasQuery = computed(() => query.value.trim().length > 0)
  const isSearching = computed(() => status.value === SEARCH_STATUS.loading)

  function setQuery(value) {
    query.value = value
    activePresetId.value = null
  }

  function setMode(value) {
    mode.value = value
    filters.value.country = 'all'
    filters.value.region = 'all'
    filters.value.source = 'all'
  }

  function setCategory(value) {
    category.value = value
    filters.value.category = value
  }

  function setFilter(key, value) {
    filters.value[key] = value

    if (key === 'category') {
      category.value = value
    }
  }

  function setFilters(nextFilters = {}) {
    filters.value = {
      ...filters.value,
      ...nextFilters
    }
  }

  function setStatus(value) {
    status.value = value
  }

  function setActivePreset(presetId) {
    activePresetId.value = presetId
  }

  function markSearched() {
    lastSearchedAt.value = new Date().toISOString()
    error.value = null
  }

  function resetFilters() {
    filters.value = cloneFilters()
    category.value = DEFAULT_CATEGORY
    activePresetId.value = null
  }

  function resetSearch() {
    query.value = ''
    status.value = SEARCH_STATUS.idle
    error.value = null
    lastSearchedAt.value = null
    activePresetId.value = null
    filters.value = cloneFilters()
  }

  return {
    query,
    mode,
    category,
    filters,
    status,
    error,
    lastSearchedAt,
    activePresetId,
    hasQuery,
    isSearching,
    setQuery,
    setMode,
    setCategory,
    setFilter,
    setFilters,
    setStatus,
    setActivePreset,
    markSearched,
    resetFilters,
    resetSearch
  }
})
