<script setup>
import { getCategoryById } from '~/data/categories'
import { formatShortDate } from '~/utils/formatDate'

const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit'])

const newsStore = useNewsStore()
const categoryMeta = computed(() => getCategoryById(props.article.category))
const checked = computed(() => newsStore.isChecked(props.article.id))

function onToggle() {
  newsStore.toggleChecked(props.article)
}

function openEditor() {
  emit('edit', props.article)
}
</script>

<template>
  <article
    class="rounded-xl border bg-ink-raised/70 px-3 py-3"
    :class="checked ? 'border-gold/40' : 'border-line'"
  >
    <div class="flex gap-3">
      <label class="mt-1 flex w-8 shrink-0 flex-col items-center gap-2">
        <input
          type="checkbox"
          class="h-4 w-4 accent-gold"
          :checked="checked"
          :aria-label="`Select ${article.title}`"
          @change="onToggle"
        >
        <button
          type="button"
          class="story-field font-display text-sm leading-none text-gold"
          @click="openEditor"
        >
          {{ article.importance?.score || 0 }}
        </button>
      </label>

      <button type="button" class="story-field min-w-0 flex-1" @click="openEditor">
        <span class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-paper-muted">
          <span>{{ article.source?.name || 'Unknown source' }}</span>
          <span>·</span>
          <span>{{ (article.countries || []).join(', ') || '—' }}</span>
          <span>·</span>
          <span>{{ article.publishedAt ? formatShortDate(article.publishedAt) : '—' }}</span>
          <span>·</span>
          <span class="uppercase">{{ article.language || '—' }}</span>
          <StatusPill :label="categoryMeta.label" :tone-class="categoryMeta.accentClass" />
        </span>
        <span class="mt-1 block text-sm font-medium leading-snug text-paper">{{ article.title }}</span>
        <span class="mt-1 line-clamp-2 block text-xs leading-relaxed text-paper-muted">{{ article.brief }}</span>
      </button>
    </div>
  </article>
</template>
