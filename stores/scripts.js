import { createEmptyScriptMap, SCRIPT_STATUS } from '~/data/scriptModel'
import { compactQueue, lineupSignature, recomputeScriptDuration } from '~/utils/scripts'
import { generateVideoScriptRequest } from '~/services/scriptService'
import { CATEGORY_IDS } from '~/utils/constants'

export const useScriptsStore = defineStore('scripts', () => {
  const scripts = ref(createEmptyScriptMap())
  const status = ref(SCRIPT_STATUS.idle)
  const errorMessage = ref('')
  const warning = ref('')
  const activeCategory = ref('economy-political')
  const generatingCategory = ref(null)
  const generatingBeatId = ref(null)
  const signature = ref('')

  const currentScripts = computed(() => scripts.value)

  function scriptFor(region, categoryId) {
    return scripts.value[region]?.[categoryId] || null
  }

  function countForRegion(region) {
    return CATEGORY_IDS.reduce((sum, categoryId) => {
      return sum + (scripts.value[region]?.[categoryId] ? 1 : 0)
    }, 0)
  }

  function isStale(queues, region) {
    if (!signature.value) {
      return false
    }

    return signature.value !== lineupSignature(queues, region)
  }

  function setActiveCategory(categoryId) {
    if (CATEGORY_IDS.includes(categoryId)) {
      activeCategory.value = categoryId
    }
  }

  function setScript(region, categoryId, script) {
    scripts.value[region][categoryId] = recomputeScriptDuration(script)
  }

  function updateHook(region, categoryId, hook) {
    const current = scriptFor(region, categoryId)

    if (!current) {
      return
    }

    setScript(region, categoryId, { ...current, hook })
  }

  function updateOutro(region, categoryId, outro) {
    const current = scriptFor(region, categoryId)

    if (!current) {
      return
    }

    setScript(region, categoryId, { ...current, outro })
  }

  function updateBeat(region, categoryId, storyId, patch) {
    const current = scriptFor(region, categoryId)

    if (!current) {
      return
    }

    setScript(region, categoryId, {
      ...current,
      beats: current.beats.map((beat) => (
        beat.storyId === storyId ? { ...beat, ...patch } : beat
      ))
    })
  }

  async function generateCategory(region, categoryId, stories) {
    generatingCategory.value = categoryId
    status.value = SCRIPT_STATUS.generating
    errorMessage.value = ''

    try {
      const result = await generateVideoScriptRequest({
        region,
        category: categoryId,
        stories
      })

      setScript(region, categoryId, result.script)

      if (result.warning) {
        warning.value = result.warning
      }

      status.value = SCRIPT_STATUS.ready
      return result.script
    } catch (error) {
      status.value = SCRIPT_STATUS.error
      errorMessage.value = error?.data?.statusMessage || error?.message || 'Could not generate scripts.'
      throw error
    } finally {
      generatingCategory.value = null
    }
  }

  async function generateRegion(region, queues) {
    const categories = CATEGORY_IDS.filter((categoryId) => (queues?.[region]?.[categoryId] || []).length)
    warning.value = ''
    errorMessage.value = ''

    if (!categories.length) {
      status.value = SCRIPT_STATUS.error
      errorMessage.value = 'No lined-up stories to script.'
      return []
    }

    status.value = SCRIPT_STATUS.generating

    try {
      const results = await Promise.allSettled(categories.map((categoryId) => {
        return generateVideoScriptRequest({
          region,
          category: categoryId,
          stories: compactQueue(queues[region][categoryId])
        })
      }))

      let anyOk = false
      const failures = []

      results.forEach((result, index) => {
        const categoryId = categories[index]

        if (result.status === 'fulfilled') {
          anyOk = true
          setScript(region, categoryId, result.value.script)

          if (result.value.warning) {
            warning.value = result.value.warning
          }

          return
        }

        failures.push(result.reason?.message || `Could not script ${categoryId}.`)
      })

      if (!anyOk) {
        status.value = SCRIPT_STATUS.error
        errorMessage.value = failures[0] || 'Could not generate scripts.'
        throw new Error(errorMessage.value)
      }

      if (failures.length) {
        warning.value = failures[0]
      }

      signature.value = lineupSignature(queues, region)
      status.value = SCRIPT_STATUS.ready
      return results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value.script)
    } catch (error) {
      if (status.value !== SCRIPT_STATUS.error) {
        status.value = SCRIPT_STATUS.error
        errorMessage.value = error?.data?.statusMessage || error?.message || 'Could not generate scripts.'
      }
      throw error
    } finally {
      generatingCategory.value = null
    }
  }

  async function regenerateBeat(region, categoryId, storyId, stories) {
    const current = scriptFor(region, categoryId)

    if (!current) {
      return null
    }

    generatingBeatId.value = storyId
    errorMessage.value = ''

    try {
      const result = await generateVideoScriptRequest({
        region,
        category: categoryId,
        stories,
        focusStoryId: storyId,
        existingScript: current
      })

      setScript(region, categoryId, result.script)

      if (result.warning) {
        warning.value = result.warning
      }

      return result.script
    } catch (error) {
      errorMessage.value = error?.data?.statusMessage || error?.message || 'Could not regenerate that beat.'
      throw error
    } finally {
      generatingBeatId.value = null
    }
  }

  function clearScripts() {
    scripts.value = createEmptyScriptMap()
    status.value = SCRIPT_STATUS.idle
    errorMessage.value = ''
    warning.value = ''
    signature.value = ''
    generatingCategory.value = null
    generatingBeatId.value = null
  }

  function syncSignature(queues, region) {
    signature.value = lineupSignature(queues, region)
  }

  return {
    scripts: currentScripts,
    status,
    errorMessage,
    warning,
    activeCategory,
    generatingCategory,
    generatingBeatId,
    signature,
    scriptFor,
    countForRegion,
    isStale,
    setActiveCategory,
    setScript,
    updateHook,
    updateOutro,
    updateBeat,
    generateCategory,
    generateRegion,
    regenerateBeat,
    clearScripts,
    syncSignature
  }
})
