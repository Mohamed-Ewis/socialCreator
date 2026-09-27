<script setup>
import { getCategoryById } from '~/data/categories'
import { IMAGE_STATUS } from '~/data/imageModel'
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
const imagesStore = useImagesStore()
const { modes } = useResearchMode()
const router = useRouter()

const region = computed(() => newsStore.submittedRegion)
const regionMeta = computed(() => modes.find((mode) => mode.id === region.value) || modes[0])

const storyCards = computed(() => {
  const cards = []

  CATEGORY_IDS.forEach((categoryId) => {
    const stories = newsStore.queueFor(region.value, categoryId)
    const meta = getCategoryById(categoryId)

    stories.forEach((story, index) => {
      cards.push({
        story,
        categoryId,
        categoryLabel: meta?.label || categoryId,
        order: index + 1,
        job: imagesStore.jobFor(story.id)
      })
    })
  })

  return cards
})

const activeCard = computed(() => {
  return storyCards.value.find((card) => card.story.id === imagesStore.activeStoryId)
    || storyCards.value[0]
    || null
})

const overallLabel = computed(() => {
  if (!storyCards.value.length) {
    return 'No lined-up stories'
  }

  if (imagesStore.busy) {
    return `Generating… ${imagesStore.generatingIds.length} in flight`
  }

  const ready = imagesStore.succeededCount
  const failed = storyCards.value.filter((card) => card.job.status === IMAGE_STATUS.failed).length

  if (ready === storyCards.value.length) {
    return 'All images ready'
  }

  if (ready || failed) {
    return `${ready} ready · ${failed} failed · ${storyCards.value.length} stories`
  }

  return `${storyCards.value.length} stories waiting`
})

onMounted(() => {
  imagesStore.ensureJobsFromStories(storyCards.value.map((card) => card.story))

  if (storyCards.value[0] && !imagesStore.activeStoryId) {
    imagesStore.setActiveStory(storyCards.value[0].story.id)
  }
})

async function generateCard(card) {
  if (!card?.story) {
    return
  }

  imagesStore.setActiveStory(card.story.id)

  try {
    await imagesStore.generateForStory(card.story)
  } catch {
    // Job keeps the error message.
  }
}

async function generateAll() {
  await imagesStore.generateMany(storyCards.value.map((card) => card.story))
}

function statusLabel(status) {
  if (status === IMAGE_STATUS.generating) {
    return 'Generating'
  }

  if (status === IMAGE_STATUS.succeeded) {
    return 'Ready'
  }

  if (status === IMAGE_STATUS.failed) {
    return 'Failed'
  }

  return 'Idle'
}

function statusTone(status) {
  if (status === IMAGE_STATUS.succeeded) {
    return 'bg-economy/20 text-economy'
  }

  if (status === IMAGE_STATUS.failed) {
    return 'bg-gold/15 text-gold'
  }

  if (status === IMAGE_STATUS.generating) {
    return 'bg-steel/15 text-steel'
  }

  return 'bg-ink-overlay text-paper-muted'
}

function goBack() {
  router.push('/research/lineup')
}

function isBusy(storyId) {
  return imagesStore.generatingIds.includes(storyId)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="eyebrow">Image desk</p>
        <h1 class="mt-1 font-display text-3xl tracking-tight">Generate AI images</h1>
        <p class="mt-1 max-w-2xl text-sm text-paper-muted">
          {{ regionMeta.label }} · parallel to video. Build a social-ready image per lined-up story with OpenAI Images (server-side).
        </p>
      </div>
      <button type="button" class="icon-btn" @click="goBack">
        Back to lineup
      </button>
    </div>

    <div class="panel space-y-3 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="eyebrow">Overall</p>
          <p class="mt-1 text-sm text-paper">{{ overallLabel }}</p>
        </div>
        <button
          type="button"
          class="btn-primary h-10"
          :disabled="!storyCards.length || imagesStore.busy"
          @click="generateAll"
        >
          {{ imagesStore.busy ? 'Generating…' : 'Generate all images' }}
        </button>
      </div>
    </div>

    <p
      v-if="imagesStore.errorMessage"
      class="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-paper"
    >
      {{ imagesStore.errorMessage }}
    </p>

    <div v-if="!storyCards.length" class="panel px-5 py-10 text-sm text-paper-muted">
      No lined-up stories yet. Submit a selection and order the lineup first.
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside class="space-y-2">
        <button
          v-for="card in storyCards"
          :key="card.story.id"
          type="button"
          class="w-full rounded-xl border px-3 py-3 text-left"
          :class="activeCard?.story.id === card.story.id
            ? 'border-gold/50 bg-gold/10'
            : 'border-line bg-ink-raised hover:border-gold/30'"
          @click="imagesStore.setActiveStory(card.story.id)"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs text-paper-muted">
              {{ card.categoryLabel }} · {{ String(card.order).padStart(2, '0') }}
            </p>
            <StatusPill
              :label="statusLabel(card.job.status)"
              :tone-class="statusTone(card.job.status)"
            />
          </div>
          <p class="mt-1 line-clamp-2 text-sm font-medium text-paper">{{ card.story.title }}</p>
        </button>
      </aside>

      <section v-if="activeCard" class="panel flex flex-col gap-4 p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="eyebrow">{{ activeCard.categoryLabel }}</p>
            <h2 class="mt-1 font-display text-2xl text-paper">{{ activeCard.story.title }}</h2>
            <p class="mt-1 text-sm text-paper-muted">
              {{ activeCard.story.source?.name || 'Unknown' }}
              · {{ (activeCard.story.countries || []).join(', ') || '—' }}
            </p>
          </div>
          <button
            type="button"
            class="btn-primary h-10"
            :disabled="isBusy(activeCard.story.id)"
            @click="generateCard(activeCard)"
          >
            {{ isBusy(activeCard.story.id)
              ? 'Generating…'
              : activeCard.job.url ? 'Regenerate image' : 'Generate image' }}
          </button>
        </div>

        <p v-if="activeCard.story.brief" class="text-sm leading-relaxed text-paper-muted">
          {{ activeCard.story.brief }}
        </p>

        <p v-if="activeCard.job.errorMessage" class="text-sm text-gold">
          {{ activeCard.job.errorMessage }}
        </p>

        <div
          v-if="isBusy(activeCard.story.id)"
          class="rounded-xl border border-line bg-ink px-4 py-8 text-center text-sm text-paper-muted"
        >
          Calling the Images API… this can take a few seconds.
        </div>

        <img
          v-else-if="activeCard.job.url"
          :key="activeCard.job.url"
          :src="activeCard.job.url"
          :alt="activeCard.story.title"
          class="w-full rounded-xl border border-line bg-black object-contain"
        >

        <div
          v-else
          class="rounded-xl border border-dashed border-line bg-ink px-4 py-10 text-center text-sm text-paper-muted"
        >
          Generate an image to preview it here. Files are saved under public/generated/images for later social attach.
        </div>

        <dl
          v-if="activeCard.job.prompt || activeCard.job.path"
          class="grid gap-3 rounded-xl border border-line bg-ink/40 px-4 py-3 text-xs text-paper-muted sm:grid-cols-2"
        >
          <div v-if="activeCard.job.path" class="sm:col-span-2">
            <dt class="eyebrow">Saved path</dt>
            <dd class="mt-1 break-all text-paper">{{ activeCard.job.path }}</dd>
          </div>
          <div v-if="activeCard.job.model">
            <dt class="eyebrow">Model</dt>
            <dd class="mt-1 text-paper">{{ activeCard.job.model }}</dd>
          </div>
          <div v-if="activeCard.job.size">
            <dt class="eyebrow">Size</dt>
            <dd class="mt-1 text-paper">{{ activeCard.job.size }}</dd>
          </div>
          <div v-if="activeCard.job.prompt" class="sm:col-span-2">
            <dt class="eyebrow">Prompt (English)</dt>
            <dd class="mt-1 leading-relaxed text-paper">{{ activeCard.job.revisedPrompt || activeCard.job.prompt }}</dd>
          </div>
          <div v-if="activeCard.job.generatedAt" class="sm:col-span-2">
            <dt class="eyebrow">Generated</dt>
            <dd class="mt-1 text-paper">{{ activeCard.job.generatedAt }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>
