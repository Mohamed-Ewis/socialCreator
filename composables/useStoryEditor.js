import { STORY_CATEGORIES } from '~/data/categories'
import { fromDateInputValue, toDateInputValue } from '~/utils/formatDate'

export function useStoryEditor() {
  const newsStore = useNewsStore()

  const categoryOptions = STORY_CATEGORIES.map((category) => ({
    value: category.id,
    label: category.shortLabel
  }))

  function saveStory(article, draft) {
    if (!article?.id || !draft) {
      return
    }

    const patch = {}
    const title = String(draft.title || '').trim()

    if (title && title !== article.title) {
      patch.title = title
    }

    const brief = String(draft.brief ?? '').trim()

    if (brief !== (article.brief || '')) {
      patch.brief = brief
    }

    const sourceName = String(draft.sourceName || '').trim()

    if (sourceName && sourceName !== (article.source?.name || '')) {
      patch.sourceName = sourceName
    }

    const countries = String(draft.countries || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const currentCountries = (article.countries || []).join(', ')

    if (countries.join(', ') !== currentCountries) {
      patch.countries = countries
    }

    const publishedAt = fromDateInputValue(draft.publishedAt, article.publishedAt)

    if (publishedAt && publishedAt !== article.publishedAt) {
      patch.publishedAt = publishedAt
    }

    if (draft.category && draft.category !== article.category) {
      patch.category = draft.category
    }

    const score = Math.max(0, Math.min(100, Math.round(Number(draft.score))))

    if (Number.isFinite(score) && score !== Number(article.importance?.score || 0)) {
      patch.score = score
    }

    const media = {
      kind: draft.mediaKind === 'video' ? 'video' : 'image',
      url: String(draft.mediaUrl || '').trim()
    }
    const currentMedia = article.media || { kind: 'image', url: '' }

    if (media.kind !== currentMedia.kind || media.url !== (currentMedia.url || '')) {
      patch.media = media
    }

    if (Object.keys(patch).length) {
      newsStore.updateArticle(article.id, patch)
    }
  }

  return {
    categoryOptions,
    toDateInputValue,
    saveStory
  }
}
