<script setup>
import { getVoiceForRegion } from '~/data/scriptVoice'
import { formatDuration } from '~/utils/scripts'
import { SCRIPT_STATUS } from '~/data/scriptModel'

const props = defineProps({
  region: {
    type: String,
    required: true
  }
})

const newsStore = useNewsStore()
const scriptsStore = useScriptsStore()
const { categories } = useCategories()

const voice = computed(() => getVoiceForRegion(props.region))
const activeCategory = computed({
  get: () => scriptsStore.activeCategory,
  set: (value) => scriptsStore.setActiveCategory(value)
})

const queueItems = computed(() => {
  return newsStore.queueFor(props.region, activeCategory.value)
})

const script = computed(() => {
  return scriptsStore.scriptFor(props.region, activeCategory.value)
})

const isGenerating = computed(() => {
  return scriptsStore.status === SCRIPT_STATUS.generating
})

const categoryCounts = computed(() => {
  return categories.map((category) => ({
    ...category,
    stories: newsStore.countForQueue(props.region, category.id),
    hasScript: Boolean(scriptsStore.scriptFor(props.region, category.id))
  }))
})

async function regenerateVideo() {
  await scriptsStore.generateCategory(props.region, activeCategory.value, queueItems.value)
}

async function regenerateBeat(storyId) {
  await scriptsStore.regenerateBeat(props.region, activeCategory.value, storyId, queueItems.value)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="category in categoryCounts"
        :key="category.id"
        type="button"
        class="rounded-md border px-3 py-1.5 text-xs font-medium"
        :class="category.id === activeCategory
          ? 'border-gold bg-gold text-white'
          : 'border-line bg-ink-raised text-paper hover:border-gold/40'"
        @click="activeCategory = category.id"
      >
        {{ category.shortLabel }}
        <span class="ms-1 opacity-70">{{ category.stories }}</span>
      </button>
    </div>

    <div v-if="!queueItems.length" class="panel px-5 py-8 text-sm text-paper-muted">
      No stories in this video. Add some in the lineup, then generate again.
    </div>

    <div v-else-if="isGenerating && !script" class="panel px-5 py-8 text-sm text-paper-muted">
      Writing the spoken script…
    </div>

    <div v-else-if="script" class="flex flex-col gap-4" :dir="voice.dir">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-paper">
          {{ formatDuration(script.estimatedSeconds) }}
          <span class="text-paper-muted"> · {{ voice.label }} · {{ script.provider === 'openai' ? 'model draft' : 'local draft' }}</span>
        </p>
        <button
          type="button"
          class="icon-btn"
          :disabled="isGenerating"
          @click="regenerateVideo"
        >
          {{ scriptsStore.generatingCategory === activeCategory ? 'Writing…' : 'Regenerate video' }}
        </button>
      </div>

      <label class="panel block p-4">
        <span class="eyebrow">Hook</span>
        <textarea
          class="mt-2 min-h-[72px] w-full resize-y rounded-lg border border-line bg-ink-raised p-3 text-sm leading-relaxed outline-none focus:border-gold"
          :value="script.hook"
          @input="scriptsStore.updateHook(region, activeCategory, $event.target.value)"
        />
      </label>

      <article
        v-for="beat in script.beats"
        :key="beat.storyId"
        class="panel p-4"
      >
        <div class="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="text-xs text-paper-muted">Beat {{ String(beat.order).padStart(2, '0') }} · {{ formatDuration(beat.estimatedSeconds) }}</p>
            <p class="mt-1 text-xs text-paper-muted">{{ beat.source }} · {{ beat.url || 'no url' }}</p>
          </div>
          <div class="flex items-center gap-2">
            <StatusPill
              v-if="beat.needsCheck"
              label="Needs check"
              tone-class="bg-gold/15 text-gold"
            />
            <button
              type="button"
              class="ghost-btn"
              :disabled="Boolean(scriptsStore.generatingBeatId)"
              @click="regenerateBeat(beat.storyId)"
            >
              {{ scriptsStore.generatingBeatId === beat.storyId ? 'Writing…' : 'Regenerate' }}
            </button>
          </div>
        </div>

        <label class="block">
          <span class="text-[11px] uppercase tracking-[0.16em] text-paper-muted">Spoken</span>
          <textarea
            class="mt-1 min-h-[96px] w-full resize-y rounded-lg border border-line bg-ink p-3 text-sm leading-relaxed outline-none focus:border-gold"
            :value="beat.spoken"
            @input="scriptsStore.updateBeat(region, activeCategory, beat.storyId, { spoken: $event.target.value, needsCheck: $event.target.value.toLowerCase().includes('[needs check]') })"
          />
        </label>

        <label class="mt-3 block">
          <span class="text-[11px] uppercase tracking-[0.16em] text-paper-muted">On screen</span>
          <input
            class="field mt-1"
            :value="beat.onScreen"
            @input="scriptsStore.updateBeat(region, activeCategory, beat.storyId, { onScreen: $event.target.value })"
          >
        </label>
      </article>

      <label class="panel block p-4">
        <span class="eyebrow">Outro</span>
        <textarea
          class="mt-2 min-h-[72px] w-full resize-y rounded-lg border border-line bg-ink-raised p-3 text-sm leading-relaxed outline-none focus:border-gold"
          :value="script.outro"
          @input="scriptsStore.updateOutro(region, activeCategory, $event.target.value)"
        />
      </label>
    </div>
  </div>
</template>
