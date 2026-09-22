<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const { categoryOptions, toDateInputValue, saveStory } = useStoryEditor()

const dialogRef = ref(null)
const draft = reactive({
  title: '',
  brief: '',
  sourceName: '',
  countries: '',
  publishedAt: '',
  category: '',
  score: 0,
  mediaKind: 'image',
  mediaUrl: ''
})
const previewKind = ref('image')
const previewUrl = ref('')
const previewFailed = ref(false)

function fillFromArticle(article) {
  draft.title = article.title || ''
  draft.brief = article.brief || ''
  draft.sourceName = article.source?.name || ''
  draft.countries = (article.countries || []).join(', ')
  draft.publishedAt = toDateInputValue(article.publishedAt)
  draft.category = article.category || 'economy-political'
  draft.score = article.importance?.score || 0
  draft.mediaKind = article.media?.kind === 'video' ? 'video' : 'image'
  draft.mediaUrl = article.media?.url || ''
  showPreview()
}

function showPreview() {
  previewFailed.value = false
  previewKind.value = draft.mediaKind === 'video' ? 'video' : 'image'
  previewUrl.value = String(draft.mediaUrl || '').trim()
}

function setKind(kind) {
  draft.mediaKind = kind
  showPreview()
}

function close() {
  emit('close')
}

function save() {
  saveStory(props.article, { ...draft })
  emit('close')
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

fillFromArticle(props.article)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  nextTick(() => dialogRef.value?.focus())
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        class="absolute inset-0 bg-paper/40"
        aria-label="Close editor"
        @click="close"
      />

      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-edit-title"
        tabindex="-1"
        class="panel relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden outline-none"
      >
        <div class="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p class="eyebrow">Edit story</p>
            <h2 id="story-edit-title" class="mt-1 font-display text-2xl text-paper">
              Current copy
            </h2>
            <p class="mt-1 text-xs text-paper-muted">
              Review the image or play the short, then change only what you want to keep.
            </p>
          </div>
          <button type="button" class="icon-btn" aria-label="Close" @click="close">
            Close
          </button>
        </div>

        <div class="grid min-h-0 flex-1 gap-5 overflow-auto px-5 py-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
          <div class="space-y-3">
            <p class="eyebrow">Media</p>
            <div class="overflow-hidden rounded-xl border border-line bg-ink">
              <video
                v-if="previewKind === 'video' && previewUrl && !previewFailed"
                :key="previewUrl"
                :src="previewUrl"
                controls
                playsinline
                preload="metadata"
                class="max-h-72 w-full bg-black"
                @error="previewFailed = true"
              />
              <img
                v-else-if="previewUrl && !previewFailed"
                :key="previewUrl"
                :src="previewUrl"
                alt=""
                class="max-h-72 w-full object-contain"
                @error="previewFailed = true"
              >
              <p v-else class="px-4 py-12 text-center text-sm leading-relaxed text-paper-muted">
                {{ previewFailed ? 'This link did not load. Check it before saving.' : 'No media link yet.' }}
              </p>
            </div>
            <p v-if="previewUrl" class="break-all text-[11px] leading-relaxed text-paper-muted">
              {{ previewUrl }}
            </p>
          </div>

          <div class="space-y-3">
            <label class="block">
              <span class="eyebrow">Score</span>
              <input v-model.number="draft.score" type="number" min="0" max="100" class="field mt-1 h-10 text-sm">
            </label>

            <label class="block">
              <span class="eyebrow">Title</span>
              <input v-model="draft.title" type="text" class="field mt-1 h-10 text-sm">
            </label>

            <label class="block">
              <span class="eyebrow">Story text</span>
              <textarea v-model="draft.brief" rows="4" class="field mt-1 h-auto py-2 text-sm leading-relaxed" />
            </label>

            <div class="grid gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="eyebrow">Source</span>
                <input v-model="draft.sourceName" type="text" class="field mt-1 h-10 text-sm">
              </label>
              <label class="block">
                <span class="eyebrow">Countries</span>
                <input v-model="draft.countries" type="text" class="field mt-1 h-10 text-sm" placeholder="Egypt, Saudi Arabia">
              </label>
              <label class="block">
                <span class="eyebrow">Date</span>
                <input v-model="draft.publishedAt" type="date" class="field mt-1 h-10 text-sm">
              </label>
              <label class="block">
                <span class="eyebrow">Subcategory</span>
                <select v-model="draft.category" class="field mt-1 h-10 text-sm">
                  <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
            </div>

            <div>
              <span class="eyebrow">Media link</span>
              <div class="mt-1 flex gap-1">
                <button
                  type="button"
                  class="rounded-md px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em]"
                  :class="draft.mediaKind === 'image' ? 'bg-gold text-white' : 'border border-line text-paper-muted'"
                  @click="setKind('image')"
                >
                  Image
                </button>
                <button
                  type="button"
                  class="rounded-md px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em]"
                  :class="draft.mediaKind === 'video' ? 'bg-gold text-white' : 'border border-line text-paper-muted'"
                  @click="setKind('video')"
                >
                  Short
                </button>
              </div>
              <input
                v-model="draft.mediaUrl"
                type="url"
                class="field mt-2 h-10 text-sm"
                placeholder="https://…"
                @change="showPreview"
                @blur="showPreview"
              >
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" class="icon-btn" @click="close">
            Cancel
          </button>
          <button type="button" class="btn-primary h-10" @click="save">
            Save
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
