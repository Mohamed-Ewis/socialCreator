import { IMAGE_STATUS, createEmptyImageJob } from '~/data/imageModel'
import { generateStoryImageRequest } from '~/services/imageService'

function compactStory(story) {
  return {
    id: story?.id || '',
    title: story?.title || '',
    brief: story?.brief || story?.excerpt || '',
    url: story?.url || '',
    source: typeof story?.source === 'string'
      ? story.source
      : story?.source?.name || '',
    countries: Array.isArray(story?.countries) ? story.countries : [],
    category: story?.category || '',
    media: story?.media || null
  }
}

export const useImagesStore = defineStore('images', () => {
  const jobs = ref({})
  const activeStoryId = ref('')
  const generatingIds = ref([])
  const errorMessage = ref('')

  const jobList = computed(() => Object.values(jobs.value))

  const succeededCount = computed(() => {
    return jobList.value.filter((job) => job.status === IMAGE_STATUS.succeeded).length
  })

  const busy = computed(() => generatingIds.value.length > 0)

  function jobFor(storyId) {
    return jobs.value[storyId] || createEmptyImageJob({ storyId })
  }

  function setActiveStory(storyId) {
    activeStoryId.value = storyId || ''
  }

  function ensureJobsFromStories(stories = []) {
    const next = { ...jobs.value }

    stories.forEach((story) => {
      const id = story?.id
      if (!id) {
        return
      }

      if (!next[id]) {
        next[id] = createEmptyImageJob({
          storyId: id,
          title: story.title || '',
          brief: story.brief || story.excerpt || ''
        })
      } else {
        next[id] = {
          ...next[id],
          title: story.title || next[id].title,
          brief: story.brief || story.excerpt || next[id].brief
        }
      }
    })

    jobs.value = next

    if (!activeStoryId.value && stories[0]?.id) {
      activeStoryId.value = stories[0].id
    }
  }

  function patchJob(storyId, patch) {
    jobs.value = {
      ...jobs.value,
      [storyId]: {
        ...jobFor(storyId),
        ...patch,
        storyId
      }
    }
  }

  async function generateForStory(story) {
    const compact = compactStory(story)
    const storyId = compact.id

    if (!storyId) {
      throw new Error('Story id is required.')
    }

    if (generatingIds.value.includes(storyId)) {
      return jobFor(storyId)
    }

    setActiveStory(storyId)
    generatingIds.value = [...generatingIds.value, storyId]
    errorMessage.value = ''
    patchJob(storyId, {
      status: IMAGE_STATUS.generating,
      title: compact.title,
      brief: compact.brief,
      errorMessage: '',
      url: jobs.value[storyId]?.url || '',
      path: jobs.value[storyId]?.path || ''
    })

    try {
      const result = await generateStoryImageRequest({ story: compact })
      const image = result?.image || {}

      patchJob(storyId, {
        status: IMAGE_STATUS.succeeded,
        url: image.url || image.path || '',
        path: image.path || image.url || '',
        prompt: image.prompt || '',
        revisedPrompt: image.revisedPrompt || '',
        model: image.model || '',
        size: image.size || '',
        title: image.title || compact.title,
        brief: image.brief || compact.brief,
        generatedAt: image.generatedAt || new Date().toISOString(),
        errorMessage: ''
      })

      return jobs.value[storyId]
    } catch (error) {
      const message = error?.data?.statusMessage
        || error?.data?.data?.error?.message
        || error?.message
        || 'Could not generate the image.'

      patchJob(storyId, {
        status: IMAGE_STATUS.failed,
        errorMessage: message
      })
      errorMessage.value = message
      throw error
    } finally {
      generatingIds.value = generatingIds.value.filter((id) => id !== storyId)
    }
  }

  async function generateMany(stories = []) {
    ensureJobsFromStories(stories)
    const queue = stories.filter((story) => story?.id)

    await Promise.all(queue.map(async (story) => {
      try {
        await generateForStory(story)
      } catch {
        // Per-job error is stored; continue the rest.
      }
    }))
  }

  function clearImages() {
    jobs.value = {}
    activeStoryId.value = ''
    generatingIds.value = []
    errorMessage.value = ''
  }

  return {
    jobs,
    jobList,
    activeStoryId,
    generatingIds,
    errorMessage,
    succeededCount,
    busy,
    jobFor,
    setActiveStory,
    ensureJobsFromStories,
    generateForStory,
    generateMany,
    clearImages
  }
})
