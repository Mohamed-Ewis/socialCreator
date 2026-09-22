import { CATEGORY_IDS } from '~/utils/constants'
import { VIDEO_STATUS } from '~/data/videoModel'
import { fetchVideoStatusRequest, renderCategoryVideoRequest } from '~/services/videoService'

function emptySlot() {
  return {
    status: VIDEO_STATUS.idle,
    id: '',
    url: '',
    errorMessage: '',
    snapshotUrl: '',
    progress: 0
  }
}

function createEmptyMap() {
  return {
    'economy-political': emptySlot(),
    sports: emptySlot(),
    trend: emptySlot()
  }
}

function progressForStatus(status) {
  if (status === VIDEO_STATUS.succeeded) {
    return 100
  }

  if (status === VIDEO_STATUS.failed) {
    return 100
  }

  if (status === VIDEO_STATUS.rendering) {
    return 35
  }

  return 0
}

export const useVideoStore = defineStore('video', () => {
  const slots = ref(createEmptyMap())
  const activeCategory = ref('economy-political')
  const pollers = {}

  function slotFor(categoryId) {
    return slots.value[categoryId] || emptySlot()
  }

  function setActiveCategory(categoryId) {
    if (CATEGORY_IDS.includes(categoryId)) {
      activeCategory.value = categoryId
    }
  }

  function stopPolling(categoryId) {
    if (pollers[categoryId]) {
      clearInterval(pollers[categoryId])
      delete pollers[categoryId]
    }
  }

  function stopAllPolling() {
    CATEGORY_IDS.forEach((categoryId) => stopPolling(categoryId))
  }

  function patchSlot(categoryId, patch) {
    const next = {
      ...slots.value[categoryId],
      ...patch
    }

    if (patch.status && patch.progress === undefined) {
      next.progress = progressForStatus(patch.status)
    }

    if (patch.status === VIDEO_STATUS.rendering && Number(next.progress) < 20) {
      next.progress = 20
    }

    slots.value[categoryId] = next
  }

  async function refreshStatus(categoryId) {
    const current = slotFor(categoryId)

    if (!current.id) {
      return current
    }

    try {
      const result = await fetchVideoStatusRequest(current.id)
      const status = result.status === 'succeeded'
        ? VIDEO_STATUS.succeeded
        : result.status === 'failed'
          ? VIDEO_STATUS.failed
          : VIDEO_STATUS.rendering

      const progress = status === VIDEO_STATUS.succeeded
        ? 100
        : status === VIDEO_STATUS.failed
          ? 100
          : Math.min(90, Math.max(35, Number(current.progress || 35) + 8))

      patchSlot(categoryId, {
        status,
        url: result.url || '',
        errorMessage: result.errorMessage || '',
        snapshotUrl: result.snapshotUrl || '',
        progress
      })

      if (status === VIDEO_STATUS.succeeded || status === VIDEO_STATUS.failed) {
        stopPolling(categoryId)
      }

      return slots.value[categoryId]
    } catch (error) {
      patchSlot(categoryId, {
        status: VIDEO_STATUS.failed,
        progress: 100,
        errorMessage: error?.data?.statusMessage || error?.message || 'Could not check render status.'
      })
      stopPolling(categoryId)
      throw error
    }
  }

  function startPolling(categoryId) {
    stopPolling(categoryId)
    pollers[categoryId] = setInterval(() => {
      refreshStatus(categoryId).catch(() => {})
    }, 4000)
  }

  async function renderCategory({ region, categoryId, stories, script }) {
    stopPolling(categoryId)
    setActiveCategory(categoryId)
    patchSlot(categoryId, {
      status: VIDEO_STATUS.rendering,
      id: '',
      url: '',
      errorMessage: '',
      snapshotUrl: '',
      progress: 12
    })

    try {
      const result = await renderCategoryVideoRequest({
        region,
        category: categoryId,
        stories,
        script
      })

      const done = result.status === 'succeeded'
      patchSlot(categoryId, {
        status: done ? VIDEO_STATUS.succeeded : VIDEO_STATUS.rendering,
        id: result.id,
        url: result.url || '',
        errorMessage: '',
        progress: done ? 100 : 30
      })

      if (slots.value[categoryId].status === VIDEO_STATUS.rendering) {
        startPolling(categoryId)
      }

      return slots.value[categoryId]
    } catch (error) {
      patchSlot(categoryId, {
        status: VIDEO_STATUS.failed,
        progress: 100,
        errorMessage: error?.data?.statusMessage || error?.message || 'Could not start the video render.'
      })
      throw error
    }
  }

  function clearVideos() {
    stopAllPolling()
    slots.value = createEmptyMap()
  }

  return {
    slots,
    activeCategory,
    slotFor,
    setActiveCategory,
    renderCategory,
    refreshStatus,
    stopAllPolling,
    clearVideos
  }
})
