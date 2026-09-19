/**
 * News provider abstraction (server-only).
 * API routes should call this — not a vendor module.
 */

import { searchTheNewsApi, NewsProviderError } from './theNewsApi.js'

export { NewsProviderError }

export async function searchNews(params = {}, options = {}) {
  const result = await searchTheNewsApi(params, options)

  return {
    articles: result.articles,
    meta: result.meta,
    empty: Boolean(result.empty)
  }
}