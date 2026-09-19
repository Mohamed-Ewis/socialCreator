<script setup>
definePageMeta({
  layout: 'research'
})

const searchStore = useSearchStore()
const newsStore = useNewsStore()
const router = useRouter()
const { currentMode } = useResearchMode()
const { currentCategory } = useCategories()
const { runSearch, applyFilters, clearSearch } = useLocalSearch()

newsStore.setPanelMode(searchStore.mode)
runSearch({ simulate: false })

watch(() => searchStore.mode, () => {
  newsStore.setPanelMode(searchStore.mode)
  runSearch()
})

watch(() => searchStore.filters.category, () => {
  applyFilters()
})

async function onSearch() {
  await runSearch()
}

function onClear() {
  clearSearch()
}

function onSubmit() {
  if (!newsStore.checkedCount) {
    return
  }

  newsStore.submitSelection(searchStore.mode)
  router.push('/research/lineup')
}
</script>

<template>
  <div class="flex flex-col gap-4 pb-20">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="eyebrow">Step 1 of 2</p>
        <h1 class="mt-1 font-display text-3xl tracking-tight text-paper">Select stories</h1>
        <p class="mt-1 max-w-2xl text-sm text-paper-muted">
          Choose Middle East or World, then a subcategory. Check the stories for that video set and submit.
        </p>
      </div>
      <p class="text-xs text-paper-muted">{{ currentMode.videoLanguage }} desk</p>
    </div>

    <div>
      <p class="eyebrow mb-2">Region</p>
      <ModeSwitcher />
    </div>

    <CategoryTabs />

    <SearchBar
      :model-value="searchStore.query"
      :loading="searchStore.isSearching"
      placeholder="Filter the ranked list…"
      @update:model-value="searchStore.setQuery"
      @search="onSearch"
      @clear="onClear"
    />

    <NewsGrid />

    <div class="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink-chrome/95 px-4 py-3 backdrop-blur md:static md:rounded-xl md:border md:bg-ink-raised md:px-4">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p class="text-sm text-paper">
          {{ newsStore.checkedCount }} selected
          <span class="text-paper-muted"> · {{ currentMode.label }} · {{ currentCategory.label }}</span>
        </p>
        <button
          type="button"
          class="h-10 rounded-xl bg-gold px-5 text-sm font-medium text-white disabled:opacity-40"
          :disabled="!newsStore.checkedCount"
          @click="onSubmit"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
</template>
