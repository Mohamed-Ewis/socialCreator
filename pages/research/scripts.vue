<script setup>
import { exportSelectedStories } from '~/services/exportService'
import { downloadJson, exportBriefingRequest } from '~/services/scriptService'
import { formatDuration } from '~/utils/scripts'
import { SCRIPT_STATUS } from '~/data/scriptModel'
import { getVoiceForRegion } from '~/data/scriptVoice'
import { CATEGORY_IDS } from '~/utils/constants'

definePageMeta({
  layout: 'research',
  middleware: () => {
    const newsStore = useNewsStore()

    if (!newsStore.submittedCount) {
      return navigateTo('/research')
    }
  }
})

const newsStore = useNewsStore()
const scriptsStore = useScriptsStore()
const { modes } = useResearchMode()
const router = useRouter()

const region = computed(() => newsStore.submittedRegion)
const regionMeta = computed(() => {
  return modes.find((mode) => mode.id === region.value) || modes[0]
})
const voice = computed(() => getVoiceForRegion(region.value))
const stale = computed(() => scriptsStore.isStale(newsStore.queues, region.value))
const scriptCount = computed(() => scriptsStore.countForRegion(region.value))
const isGenerating = computed(() => scriptsStore.status === SCRIPT_STATUS.generating)
const totalSeconds = computed(() => {
  return CATEGORY_IDS.reduce((sum, categoryId) => {
    const script = scriptsStore.scriptFor(region.value, categoryId)
    return sum + (script?.estimatedSeconds || 0)
  }, 0)
})
const canExport = computed(() => scriptCount.value > 0 && !isGenerating.value)

const exportError = ref('')
const exportBusy = ref(false)
const openingVideo = ref(false)
const started = ref(false)

function focusFirstQueuedCategory() {
  const first = CATEGORY_IDS.find((categoryId) => newsStore.countForQueue(region.value, categoryId) > 0)

  if (first) {
    scriptsStore.setActiveCategory(first)
  }
}

async function generateFromLineup() {
  exportError.value = ''
  focusFirstQueuedCategory()

  try {
    await scriptsStore.generateRegion(region.value, newsStore.queues)
  } catch {
    // The store already keeps the error message for the banner.
  }
}

async function exportJson() {
  if (!canExport.value) {
    return
  }

  exportBusy.value = true
  exportError.value = ''

  try {
    const payload = exportSelectedStories({
      region: region.value,
      queues: newsStore.queues,
      scripts: scriptsStore.scripts
    })

    await exportBriefingRequest(payload)
    downloadJson(`briefing-${region.value}-${new Date().toISOString().slice(0, 10)}.json`, payload)
  } catch (error) {
    exportError.value = error?.statusMessage || error?.message || 'Could not export the briefing.'
  } finally {
    exportBusy.value = false
  }
}

function goBack() {
  router.push('/research/lineup')
}

async function goToVideo() {
  if (openingVideo.value) {
    return
  }

  openingVideo.value = true

  try {
    await navigateTo('/research/video?start=1')
  } finally {
    openingVideo.value = false
  }
}

onMounted(async () => {
  if (started.value) {
    return
  }

  started.value = true
  focusFirstQueuedCategory()

  if (!scriptCount.value) {
    await generateFromLineup()
  } else if (!scriptsStore.signature) {
    scriptsStore.syncSignature(newsStore.queues, region.value)
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="eyebrow">Step 3 of 4</p>
        <h1 class="mt-1 font-display text-3xl tracking-tight">Review spoken scripts</h1>
        <p class="mt-1 max-w-2xl text-sm text-paper-muted">
          {{ regionMeta.label }} · {{ voice.label }}. Edit the host copy, then create the video.
        </p>
      </div>
      <button type="button" class="icon-btn" @click="goBack">
        Back to lineup
      </button>
    </div>

    <p class="text-sm text-paper">
      {{ newsStore.submittedCount }} stories
      <span class="text-paper-muted"> · {{ scriptCount }} videos drafted · {{ formatDuration(totalSeconds) }} total</span>
    </p>

    <p
      v-if="scriptsStore.warning"
      class="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-paper"
    >
      {{ scriptsStore.warning }}
    </p>

    <p
      v-if="stale"
      class="rounded-xl border border-line px-4 py-3 text-sm text-paper"
    >
      The lineup changed after this draft.
      <button type="button" class="ms-2 underline" @click="generateFromLineup">
        Generate again
      </button>
    </p>

    <p v-if="scriptsStore.errorMessage" class="text-sm text-gold">
      {{ scriptsStore.errorMessage }}
    </p>

    <ScriptDesk :region="region" />

    <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-raised px-4 py-3">
      <p class="text-sm text-paper-muted">
        When the spoken copy looks right, send each category to Creatomate for the finished MP4.
      </p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="icon-btn"
          :disabled="isGenerating"
          @click="generateFromLineup"
        >
          {{ isGenerating ? 'Writing…' : 'Generate all' }}
        </button>
        <button
          type="button"
          class="icon-btn"
          :disabled="!canExport || exportBusy"
          @click="exportJson"
        >
          {{ exportBusy ? 'Exporting…' : 'Export JSON' }}
        </button>
        <button
          type="button"
          class="h-10 rounded-xl bg-gold px-5 text-sm font-medium text-ink disabled:opacity-40"
          :disabled="openingVideo"
          @click="goToVideo"
        >
          {{ openingVideo ? 'Opening…' : 'Create video' }}
        </button>
      </div>
    </div>

    <p v-if="exportError" class="text-sm text-gold">{{ exportError }}</p>
  </div>
</template>
