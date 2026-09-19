function matchesQuery(article, query) {
  if (!query) {
    return true
  }

  const haystack = [
    article.title,
    article.brief,
    article.source?.name,
    article.source?.domain,
    ...(article.countries || []),
    article.category,
    article.region
  ]
    .join(' ')
    .toLowerCase()

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .some((token) => haystack.includes(token))
}

function relevanceScore(article, query) {
  const base = article.importance?.score || 0

  if (!query) {
    return base
  }

  const title = (article.title || '').toLowerCase()
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  const titleHits = tokens.filter((token) => title.includes(token)).length

  return base + titleHits * 12 + (article.importance?.relevance || 0) * 0.1
}

export function searchPlaceholderNews({ news, query, mode, filters }) {
  const normalizedQuery = (query || '').trim()

  const results = news.filter((article) => {
    if (article.region !== mode) {
      return false
    }

    if (filters.category !== 'all' && article.category !== filters.category) {
      return false
    }

    if (filters.country !== 'all' && !(article.countries || []).includes(filters.country)) {
      return false
    }

    if (filters.language !== 'all' && article.language !== filters.language) {
      return false
    }

    if (filters.source !== 'all' && article.source?.name !== filters.source) {
      return false
    }

    return matchesQuery(article, normalizedQuery)
  })

  const sorted = [...results]

  if (filters.sortBy === 'oldest') {
    sorted.sort((a, b) => new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0))
  } else if (filters.sortBy === 'newest') {
    sorted.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
  } else if (filters.sortBy === 'relevance') {
    sorted.sort((a, b) => relevanceScore(b, normalizedQuery) - relevanceScore(a, normalizedQuery))
  } else {
    sorted.sort((a, b) => (b.importance?.score || 0) - (a.importance?.score || 0))
  }

  return sorted
}
