import { STORY_CATEGORIES, getCategoryById } from '~/data/categories'
import { EXPORT_MAX, EXPORT_MIN } from '~/utils/constants'

export function useStorySelection() {
  const newsStore = useNewsStore()
  const searchStore = useSearchStore()
  const { categories } = useCategories()

  const activeMode = computed(() => newsStore.panelMode || searchStore.mode)
  const selectedCount = computed(() => newsStore.selectedCount)
  const checkedCount = computed(() => newsStore.checkedCount)
  const selectedCountForMode = computed(() => newsStore.countForMode(activeMode.value))

  const queueCounts = computed(() => {
    return STORY_CATEGORIES.map((category) => ({
      ...category,
      count: newsStore.countForQueue(activeMode.value, category.id)
    }))
  })

  const isReadyToExport = computed(() => {
    return selectedCount.value >= EXPORT_MIN && selectedCount.value <= EXPORT_MAX
  })

  const exportHint = computed(() => {
    return 'Export is a placeholder. Lineups are local until the next task.'
  })

  function syncPanelToSearchMode() {
    newsStore.setPanelMode(searchStore.mode)
  }

  function toggleStory(story, categoryId = story.category) {
    newsStore.toggleInQueue(story, searchStore.mode, categoryId)
    newsStore.setPanelMode(searchStore.mode)
  }

  function assignedCategory(storyId, mode = searchStore.mode) {
    return newsStore.findQueueCategory(storyId, mode)
  }

  return {
    categories,
    activeMode,
    selectedCount,
    checkedCount,
    selectedCountForMode,
    queueCounts,
    isReadyToExport,
    exportHint,
    getCategoryById,
    syncPanelToSearchMode,
    toggleStory,
    assignedCategory
  }
}
