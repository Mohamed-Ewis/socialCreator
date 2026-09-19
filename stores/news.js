import { createEmptyQueues } from '~/data/models'
import { CATEGORY_IDS } from '~/utils/constants'

function cloneArticle(article) {
  return JSON.parse(JSON.stringify(article))
}

function applySelectionState(article, checkedIds) {
  const order = checkedIds.indexOf(article.id)

  return {
    ...article,
    selected: order !== -1,
    selectionOrder: order === -1 ? null : order + 1,
    video: {
      ...article.video,
      arabic: article.region === 'middle-east',
      english: article.region === 'world',
      order: order === -1 ? null : order + 1
    }
  }
}

export const useNewsStore = defineStore('news', () => {
  const articles = ref([])
  const checkedIds = ref([])
  const submitted = ref([])
  const submittedRegion = ref('middle-east')
  const queues = ref(createEmptyQueues())
  const panelMode = ref('middle-east')

  const selectedArticles = computed(() => {
    return checkedIds.value
      .map((id) => articles.value.find((article) => article.id === id))
      .filter(Boolean)
  })

  const checkedCount = computed(() => checkedIds.value.length)
  const submittedCount = computed(() => submitted.value.length)

  const selectedCount = computed(() => {
    return Object.values(queues.value).reduce((total, modeQueues) => {
      return total + CATEGORY_IDS.reduce((sum, categoryId) => sum + modeQueues[categoryId].length, 0)
    }, 0)
  })

  function countForMode(mode) {
    return CATEGORY_IDS.reduce((sum, categoryId) => sum + queues.value[mode][categoryId].length, 0)
  }

  function countForQueue(mode, categoryId) {
    return queues.value[mode][categoryId].length
  }

  function queueFor(mode, categoryId) {
    return queues.value[mode][categoryId]
  }

  function findQueueCategory(storyId, mode) {
    return CATEGORY_IDS.find((categoryId) => {
      return queues.value[mode][categoryId].some((item) => item.id === storyId)
    }) || null
  }

  function isInQueue(storyId, mode, categoryId) {
    return queues.value[mode][categoryId].some((item) => item.id === storyId)
  }

  function isChecked(id) {
    return checkedIds.value.includes(id)
  }

  function setArticles(nextArticles = []) {
    articles.value = nextArticles.map((article) => applySelectionState(article, checkedIds.value))
  }

  function setPanelMode(mode) {
    panelMode.value = mode
  }

  function toggleChecked(article) {
    const index = checkedIds.value.indexOf(article.id)

    if (index === -1) {
      checkedIds.value.push(article.id)
    } else {
      checkedIds.value.splice(index, 1)
    }

    articles.value = articles.value.map((item) => applySelectionState(item, checkedIds.value))
  }

  function setCheckedAll(nextArticles, checked) {
    const ids = nextArticles.map((article) => article.id)

    if (checked) {
      const merged = [...checkedIds.value]
      ids.forEach((id) => {
        if (!merged.includes(id)) {
          merged.push(id)
        }
      })
      checkedIds.value = merged
    } else {
      const drop = new Set(ids)
      checkedIds.value = checkedIds.value.filter((id) => !drop.has(id))
    }

    articles.value = articles.value.map((item) => applySelectionState(item, checkedIds.value))
  }

  function clearChecked() {
    checkedIds.value = []
    articles.value = articles.value.map((item) => applySelectionState(item, checkedIds.value))
  }

  function rebuildQueues(region, stories) {
    const next = createEmptyQueues()

    stories.forEach((article, index) => {
      const categoryId = CATEGORY_IDS.includes(article.category) ? article.category : 'economy-political'
      next[region][categoryId].push({
        ...cloneArticle(article),
        selected: true,
        selectionOrder: index + 1,
        video: {
          arabic: region === 'middle-east',
          english: region === 'world',
          order: next[region][categoryId].length + 1
        }
      })
    })

    queues.value = next
  }

  function submitSelection(region) {
    const selected = selectedArticles.value.map((article, index) => {
      return applySelectionState(cloneArticle(article), selectedArticles.value.map((item) => item.id))
    })

    submitted.value = selected.map((article, index) => ({
      ...article,
      selectionOrder: index + 1,
      video: {
        ...article.video,
        arabic: region === 'middle-east',
        english: region === 'world',
        order: index + 1
      }
    }))
    submittedRegion.value = region
    panelMode.value = region
    rebuildQueues(region, submitted.value)

    return submitted.value
  }

  function removeFromMode(storyId, mode) {
    CATEGORY_IDS.forEach((categoryId) => {
      queues.value[mode][categoryId] = queues.value[mode][categoryId].filter((item) => item.id !== storyId)
    })
  }

  function addToQueue(story, mode, categoryId) {
    removeFromMode(story.id, mode)
    queues.value[mode][categoryId].push(cloneArticle(story))
  }

  function toggleInQueue(story, mode, categoryId) {
    if (isInQueue(story.id, mode, categoryId)) {
      removeFromMode(story.id, mode)
      return
    }

    addToQueue(story, mode, categoryId)
  }

  function removeFromQueue(storyId, mode, categoryId) {
    queues.value[mode][categoryId] = queues.value[mode][categoryId].filter((item) => item.id !== storyId)
  }

  function reorderQueue(mode, categoryId, fromIndex, toIndex) {
    const list = queues.value[mode][categoryId]

    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) {
      return
    }

    const next = [...list]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    queues.value[mode][categoryId] = next.map((item, index) => ({
      ...item,
      video: {
        ...item.video,
        order: index + 1
      }
    }))
  }

  function moveQueueItem(mode, categoryId, index, direction) {
    reorderQueue(mode, categoryId, index, index + direction)
  }

  function clearMode(mode) {
    CATEGORY_IDS.forEach((categoryId) => {
      queues.value[mode][categoryId] = []
    })
  }

  function clearSelection() {
    queues.value = createEmptyQueues()
    submitted.value = []
  }

  function resetNews() {
    articles.value = []
    checkedIds.value = []
    submitted.value = []
    queues.value = createEmptyQueues()
  }

  return {
    articles,
    checkedIds,
    submitted,
    submittedRegion,
    queues,
    panelMode,
    selectedArticles,
    checkedCount,
    submittedCount,
    selectedCount,
    countForMode,
    countForQueue,
    queueFor,
    findQueueCategory,
    isInQueue,
    isChecked,
    setArticles,
    setPanelMode,
    toggleChecked,
    setCheckedAll,
    clearChecked,
    submitSelection,
    addToQueue,
    toggleInQueue,
    removeFromQueue,
    removeFromMode,
    reorderQueue,
    moveQueueItem,
    clearMode,
    clearSelection,
    resetNews
  }
})
