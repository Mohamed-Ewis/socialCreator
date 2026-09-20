<script setup>
const newsStore = useNewsStore()
const router = useRouter()
const { modes, currentMode } = useResearchMode()
const { categories, selectedCount, selectedCountForMode, exportHint } = useStorySelection()

function goToScripts() {
  if (!selectedCountForMode.value) {
    return
  }

  router.push('/research/scripts')
}

const dragState = ref({
  categoryId: null,
  fromIndex: null,
  overIndex: null
})

const panelMode = computed({
  get: () => newsStore.panelMode,
  set: (value) => newsStore.setPanelMode(value)
})

function queueItems(categoryId) {
  return newsStore.queueFor(panelMode.value, categoryId)
}

function onDragStart(categoryId, index, event) {
  dragState.value = { categoryId, fromIndex: index, overIndex: index }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(index))
}

function onDragOver(categoryId, index, event) {
  if (dragState.value.categoryId !== categoryId) {
    return
  }

  event.preventDefault()
  dragState.value.overIndex = index
}

function onDrop(categoryId, index, event) {
  event.preventDefault()

  if (dragState.value.categoryId === categoryId) {
    newsStore.reorderQueue(panelMode.value, categoryId, dragState.value.fromIndex, index)
  }

  resetDrag()
}

function resetDrag() {
  dragState.value = { categoryId: null, fromIndex: null, overIndex: null }
}

function moveItem(categoryId, index, direction) {
  newsStore.moveQueueItem(panelMode.value, categoryId, index, direction)
}

function removeItem(categoryId, storyId) {
  newsStore.removeFromQueue(storyId, panelMode.value, categoryId)
}

function clearModeQueues() {
  newsStore.clearMode(panelMode.value)
}

const panelModeLabel = computed(() => {
  return modes.find((mode) => mode.id === panelMode.value)?.label || currentMode.value.label
})
</script>

<template>
  <aside id="selection-panel" class="panel flex h-fit scroll-mt-4 flex-col xl:sticky xl:top-4">
    <div class="border-b border-line px-4 py-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="eyebrow">Selected stories</p>
          <p class="mt-1 text-sm text-paper">
            {{ selectedCountForMode }} in {{ panelModeLabel }}
            <span class="text-paper-muted"> · {{ selectedCount }} total</span>
          </p>
        </div>
        <button
          type="button"
          class="ghost-btn"
          :disabled="!selectedCountForMode"
          @click="clearModeQueues"
        >
          Clear
        </button>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-ink p-1">
        <button
          v-for="mode in modes"
          :key="mode.id"
          type="button"
          class="rounded-md px-2 py-1.5 text-xs font-medium"
          :class="panelMode === mode.id ? 'bg-ink-overlay text-paper' : 'text-paper-muted'"
          @click="panelMode = mode.id"
        >
          {{ mode.shortLabel }} · {{ newsStore.countForMode(mode.id) }}
        </button>
      </div>
    </div>

    <div class="space-y-4 px-3 py-3">
      <section
        v-for="category in categories"
        :key="category.id"
        class="rounded-xl border border-line p-2"
      >
        <div class="mb-2 flex items-center justify-between gap-2 px-1">
          <p class="text-xs font-medium text-paper">
            {{ category.label }}
            <span class="text-paper-muted">· Video {{ category.videoSlot }}</span>
          </p>
          <span class="text-[11px] text-paper-muted">{{ queueItems(category.id).length }}</span>
        </div>

        <p
          v-if="!queueItems(category.id).length"
          class="px-1 py-3 text-[11px] leading-relaxed text-paper-muted"
        >
          Add multiple {{ category.label.toLowerCase() }} stories, then drag to set the video order.
        </p>

        <ol v-else class="space-y-1.5">
          <li
            v-for="(item, index) in queueItems(category.id)"
            :key="item.id"
            draggable="true"
            class="flex cursor-grab items-start gap-2 rounded-lg border px-2 py-2 active:cursor-grabbing"
            :class="dragState.categoryId === category.id && dragState.overIndex === index
              ? 'border-gold/50 bg-gold/10'
              : 'border-line bg-ink/40'"
            @dragstart="onDragStart(category.id, index, $event)"
            @dragover="onDragOver(category.id, index, $event)"
            @drop="onDrop(category.id, index, $event)"
            @dragend="resetDrag"
          >
            <span class="w-4 shrink-0 text-[11px] text-paper-muted">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 text-xs leading-snug text-paper">{{ item.title }}</p>
              <p class="mt-1 text-[10px] text-paper-muted">
                {{ item.source?.name || 'Unknown' }}
                · {{ (item.countries || []).join(', ') || '—' }}
              </p>
            </div>
            <div class="flex shrink-0 flex-col">
              <button
                type="button"
                class="px-1 text-[10px] text-paper-muted hover:text-paper disabled:opacity-30"
                :disabled="index === 0"
                aria-label="Move up"
                @click="moveItem(category.id, index, -1)"
              >
                ▲
              </button>
              <button
                type="button"
                class="px-1 text-[10px] text-paper-muted hover:text-paper disabled:opacity-30"
                :disabled="index === queueItems(category.id).length - 1"
                aria-label="Move down"
                @click="moveItem(category.id, index, 1)"
              >
                ▼
              </button>
              <button
                type="button"
                class="px-1 text-[10px] text-paper-muted hover:text-paper"
                aria-label="Remove"
                @click="removeItem(category.id, item.id)"
              >
                ×
              </button>
            </div>
          </li>
        </ol>
      </section>
    </div>

    <div class="mt-auto border-t border-line px-4 py-3">
      <p class="text-[11px] leading-relaxed text-paper-muted">{{ exportHint }}</p>
      <button
        type="button"
        class="mt-3 h-10 w-full rounded-xl bg-gold text-sm font-medium text-white disabled:opacity-40"
        :disabled="!selectedCountForMode"
        @click="goToScripts"
      >
        Generate scripts
      </button>
    </div>
  </aside>
</template>
