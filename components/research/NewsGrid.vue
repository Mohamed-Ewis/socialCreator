<script setup>
const newsStore = useNewsStore()
const searchStore = useSearchStore()
const { currentMode } = useResearchMode()

const loading = computed(() => searchStore.isSearching)
const articles = computed(() => newsStore.articles)
const resultCount = computed(() => articles.value.length)
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
        <NewsTable />
      </div>
      <div class="grid gap-2 md:hidden">
        <NewsCard
          v-for="article in articles"
          :key="article.id"
          :article="article"
        />
      </div>
    </template>
  </section>
</template>
