import { MOCK_NEWS } from '~/data/mockNews'
import { SEARCH_INPUT_ID, SEARCH_STATUS } from '~/utils/constants'
import { searchPlaceholderNews } from '~/utils/searchNews'

export function useLocalSearch() {
  const searchStore = useSearchStore()
  const newsStore = useNewsStore()

  function getResults() {
    return searchPlaceholderNews({
      news: MOCK_NEWS,
      query: searchStore.query,
      mode: searchStore.mode,
      filters: searchStore.filters
    })
  }

  async function runSearch({ simulate = true } = {}) {
    if (!simulate || import.meta.server) {
      newsStore.setArticles(getResults())
      searchStore.setStatus(SEARCH_STATUS.ready)
      searchStore.markSearched()
      return
    }

    searchStore.setStatus(SEARCH_STATUS.loading)

    await new Promise((resolve) => setTimeout(resolve, 280))

    newsStore.setArticles(getResults())
    searchStore.setStatus(SEARCH_STATUS.ready)
    searchStore.markSearched()
  }

  function applyFilters() {
    newsStore.setArticles(getResults())
    searchStore.setStatus(SEARCH_STATUS.ready)
  }

  function clearSearch() {
    searchStore.setQuery('')
    searchStore.setActivePreset(null)
    newsStore.setArticles(getResults())
    searchStore.setStatus(SEARCH_STATUS.ready)
    searchStore.markSearched()
  }

  function applyPreset(preset) {
    searchStore.resetFilters()
    searchStore.setQuery(preset.query)
    searchStore.setFilters(preset.filters)
    searchStore.setActivePreset(preset.id)
    return runSearch()
  }

  function focusSearchInput() {
    if (typeof document === 'undefined') {
      return
    }

    document.getElementById(SEARCH_INPUT_ID)?.focus()
  }

  return {
    runSearch,
    applyFilters,
    clearSearch,
    applyPreset,
    focusSearchInput
  }
}
