<script setup>
const newsStore = useNewsStore()
const searchStore = useSearchStore()
const { currentMode } = useResearchMode()

const loading = computed(() => searchStore.isSearching)
const articles = computed(() => newsStore.articles)
const resultCount = computed(() => articles.value.length)
const editingArticle = ref(null)

function openEditor(article) {
  editingArticle.value = article
}

function closeEditor() {
  editingArticle.value = null
}
</script>

<template>
  <section class="min-w-0">
    <div class="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <p class="eyebrow">Important stories</p>
        <p class="mt-1 text-sm text-paper">
          {{ resultCount }}
          {{ resultCount === 1 ? 'story' : 'stories' }}
          <span class="text-paper-muted"> · {{ currentMode.label }} · mock data</span>
        </p>
        <p class="mt-1 max-w-2xl text-xs leading-relaxed text-paper-muted">
          Click a story field to edit the current copy. The popup shows the image or plays the short before you save.
        </p>
      </div>
      <p v-if="loading" class="text-xs text-gold">Updating…</p>
    </div>

    <div v-if="loading && !articles.length" class="panel px-6 py-16 text-center">
      <p class="text-sm text-paper">Loading ranked stories…</p>
    </div>

    <EmptyState
      v-else-if="!articles.length"
      title="No matching stories"
      description="Change region or subcategory. The desk is still using local mock data."
    />

    <template v-else>
      <div class="hidden md:block">
        <NewsTable @edit="openEditor" />
      </div>
      <div class="grid gap-2 md:hidden">
        <NewsCard
          v-for="article in articles"
          :key="article.id"
          :article="article"
          @edit="openEditor"
        />
      </div>
      <StoryEditDialog
        v-if="editingArticle"
        :article="editingArticle"
        @close="closeEditor"
      />
    </template>
  </section>
</template>
