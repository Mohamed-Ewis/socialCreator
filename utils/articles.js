export function dedupeArticles(articles = []) {
  const seen = new Set()

  return articles.filter((article) => {
    if (!article?.id || seen.has(article.id)) {
      return false
    }

    seen.add(article.id)
    return true
  })
}
