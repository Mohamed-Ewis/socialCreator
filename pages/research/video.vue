<script setup>
import { getCategoryById } from '~/data/categories'
import { VIDEO_STATUS } from '~/data/videoModel'
import { CATEGORY_IDS } from '~/utils/constants'
import { getVoiceForRegion } from '~/data/scriptVoice'

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
const videoStore = useVideoStore()
const { modes } = useResearchMode()
const route = useRoute()
const router = useRouter()

const region = computed(() => newsStore.submittedRegion)
const regionMeta = computed(() => modes.find((mode) => mode.id === region.value) || modes[0])
const voice = computed(() => getVoiceForRegion(region.value))
const autoStarted = ref(false)

const categoryCards = computed(() => {
  return CATEGORY_IDS.map((categoryId) => {
    const stories = newsStore.queueFor(region.value, categoryId)
    const script = scriptsStore.scriptFor(region.value, categoryId)
    const slot = videoStore.slotFor(categoryId)
    const meta = getCategoryById(categoryId)

    return {
      id: categoryId,
      meta,
      stories,
      script,
      slot,
      canRender: stories.length > 0 && Boolean(script)
    }
  }).filter((card) => card.stories.length > 0 || card.script)
})

const activeCard = computed(() => {
  return categoryCards.value.find((card) => card.id === videoStore.activeCategory)
    || categoryCards.value[0]
    || null
})

const busy = computed(() => {
  return categoryCards.value.some((card) => card.slot.status === VIDEO_STATUS.rendering)
})

const overallProgress = computed(() => {
  const cards = categoryCards.value.filter((card) => card.canRender)

  if (!cards.length) {
    return 0
  }

  const total = cards.reduce((sum, card) => sum + Number(card.slot.progress || 0), 0)
  return Math.round(total / cards.length)
})

const overallLabel = computed(() => {
  if (!categoryCards.value.length) {
    return 'No videos ready yet'
  }

  if (busy.value) {
    return `Rendering… ${overallProgress.value}%`
  }

  const ready = categoryCards.value.filter((card) => card.slot.status === VIDEO_STATUS.succeeded).length
  const failed = categoryCards.value.filter((card) => card.slot.status === VIDEO_STATUS.failed).length

  if (ready === categoryCards.value.length) {
    return 'All videos ready'
  }

  if (failed && !ready) {
    return 'Rendering failed'
  }

  if (ready || failed) {
    return `${ready} ready · ${failed} failed`
  }

  return 'Waiting to start'
})

onMounted(async () => {
  const first = categoryCards.value.find((card) => card.canRender)

  if (first) {
    videoStore.setActiveCategory(first.id)
  }

  const shouldStart = route.query.start === '1' || route.query.start === 'true'

  if (shouldStart && !autoStarted.value) {
    autoStarted.value = true
    await renderAll()
    router.replace({ path: '/research/video', query: {} })
  }
})

onBeforeUnmount(() => {
  videoStore.stopAllPolling()
})

async function renderCard(card) {
  if (!card?.canRender) {
    return
  }

  videoStore.setActiveCategory(card.id)

  try {
    await videoStore.renderCategory({
      region: region.value,
      categoryId: card.id,
      stories: card.stories,
      script: card.script
    })
  } catch {
    // Slot already keeps the error message.
  }
}

async function renderAll() {
  const queue = categoryCards.value.filter((card) => card.canRender)

  await Promise.all(queue.map(async (card) => {
    try {
      await videoStore.renderCategory({
        region: region.value,
        categoryId: card.id,
        stories: card.stories,
        script: card.script
      })
    } catch {
      // Continue the rest; each slot shows its own error.
    }
  }))
}

function statusLabel(status) {
  if (status === VIDEO_STATUS.rendering) {
    return 'Rendering'
  }

  if (status === VIDEO_STATUS.succeeded) {
    return 'Ready'
  }

  if (status === VIDEO_STATUS.failed) {
    return 'Failed'
  }

  return 'Idle'
}

function statusTone(status) {
  if (status === VIDEO_STATUS.succeeded) {
    return 'bg-economy/20 text-economy'
  }

  if (status === VIDEO_STATUS.failed) {
    return 'bg-gold/15 text-gold'
  }

  if (status === VIDEO_STATUS.rendering) {
    return 'bg-steel/15 text-steel'
  }

  return 'bg-ink-overlay text-paper-muted'
}

function goBack() {
  navigateTo('/research/scripts')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="eyebrow">Step 4 of 4</p>
        <h1 class="mt-1 font-display text-3xl tracking-tight">Create videos</h1>
        <p class="mt-1 max-w-2xl text-sm text-paper-muted">
          {{ regionMeta.label }} · {{ voice.label }}. Creatomate stitches each category's media and spoken script into one MP4.
        </p>
      </div>
      <button type="button" class="icon-btn" @click="goBack">
        Back to scripts
      </button>
    </div>

    <div class="panel space-y-3 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="eyebrow">Overall progress</p>
          <p class="mt-1 text-sm text-paper">{{ overallLabel }}</p>
        </div>
        <button
          type="button"
          class="btn-primary h-10"
          :disabled="!categoryCards.some((card) => card.canRender) || busy"
          @click="renderAll"
        >
          {{ busy ? 'Rendering…' : 'Render all videos' }}
        </button>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-ink">
        <div
          class="h-full rounded-full bg-gold transition-all duration-500"
          :style="{ width: `${overallProgress}%` }"
        />
      </div>
    </div>

    <div v-if="!categoryCards.length" class="panel px-5 py-10 text-sm text-paper-muted">
      No scripted categories yet. Go back and generate spoken scripts first.
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="space-y-2">
        <button
          v-for="card in categoryCards"
          :key="card.id"
          type="button"
          class="w-full rounded-xl border px-3 py-3 text-left"
          :class="activeCard?.id === card.id
            ? 'border-gold/50 bg-gold/10'
            : 'border-line bg-ink-raised hover:border-gold/30'"
          @click="videoStore.setActiveCategory(card.id)"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-paper">{{ card.meta.label }}</p>
            <StatusPill
              :label="statusLabel(card.slot.status)"
              :tone-class="statusTone(card.slot.status)"
            />
          </div>
          <p class="mt-1 text-xs text-paper-muted">
            {{ card.stories.length }} stories
            <span v-if="!card.script"> · missing script</span>
          </p>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-ink">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="card.slot.status === VIDEO_STATUS.failed ? 'bg-gold' : 'bg-steel'"
              :style="{ width: `${card.slot.progress || 0}%` }"
            />
          </div>
        </button>
      </aside>

      <section v-if="activeCard" class="panel flex flex-col gap-4 p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="eyebrow">Video {{ activeCard.meta.videoSlot }}</p>
            <h2 class="mt-1 font-display text-2xl text-paper">{{ activeCard.meta.label }}</h2>
            <p class="mt-1 text-sm text-paper-muted">
              {{ activeCard.stories.length }} scenes from the lineup order.
            </p>
          </div>
          <button
            type="button"
            class="btn-primary h-10"
            :disabled="!activeCard.canRender || activeCard.slot.status === VIDEO_STATUS.rendering"
            @click="renderCard(activeCard)"
          >
            {{ activeCard.slot.status === VIDEO_STATUS.rendering ? 'Rendering…' : 'Render this video' }}
          </button>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2 text-xs text-paper-muted">
            <span>{{ statusLabel(activeCard.slot.status) }}</span>
            <span>{{ activeCard.slot.progress || 0 }}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-ink">
            <div
              class="h-full rounded-full bg-gold transition-all duration-500"
              :style="{ width: `${activeCard.slot.progress || 0}%` }"
            />
          </div>
        </div>

        <p v-if="activeCard.slot.errorMessage" class="text-sm text-gold">
          {{ activeCard.slot.errorMessage }}
        </p>

        <div
          v-if="activeCard.slot.status === VIDEO_STATUS.rendering"
          class="rounded-xl border border-line bg-ink px-4 py-8 text-center text-sm text-paper-muted"
        >
          Creatomate is rendering this video. Progress updates every few seconds.
        </div>

        <video
          v-else-if="activeCard.slot.url"
          :key="activeCard.slot.url"
          :src="activeCard.slot.url"
          controls
          playsinline
          class="w-full rounded-xl border border-line bg-black"
        />

        <div
          v-else
          class="rounded-xl border border-dashed border-line bg-ink px-4 py-10 text-center text-sm text-paper-muted"
        >
          Render this category to preview the finished MP4 here.
        </div>

        <ol class="space-y-2">
          <li
            v-for="(story, index) in activeCard.stories"
            :key="story.id"
            class="flex items-start gap-3 rounded-lg border border-line px-3 py-2"
          >
            <span class="w-5 shrink-0 text-[11px] text-paper-muted">{{ String(index + 1).padStart(2, '0') }}</span>
            <img
              v-if="story.media?.url && story.media.kind !== 'video'"
              :src="story.media.url"
              alt=""
              class="h-10 w-16 shrink-0 rounded object-cover"
            >
            <span
              v-else-if="story.media?.url"
              class="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-ink text-[9px] uppercase tracking-wide text-gold"
            >
              Short
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm leading-snug text-paper">{{ story.title }}</p>
              <p class="mt-1 line-clamp-2 text-xs text-paper-muted">
                {{ activeCard.script?.beats?.find((beat) => beat.storyId === story.id)?.spoken || story.brief }}
              </p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>
