<script setup>
import { FILTER_COUNTRIES, FILTER_REGIONS, FILTER_SOURCES } from '~/data/filterOptions'
import { STORY_CATEGORIES } from '~/data/categories'
import { LANGUAGE_OPTIONS, SORT_OPTIONS, TIME_RANGE_OPTIONS } from '~/utils/constants'

const searchStore = useSearchStore()
const { currentMode } = useResearchMode()
const filtersOpen = ref(false)

const categoryOptions = computed(() => [
  { id: 'all', label: 'All categories' },
  ...STORY_CATEGORIES.map((category) => ({ id: category.id, label: category.label }))
])

const countryOptions = computed(() => FILTER_COUNTRIES[currentMode.value.id] || FILTER_COUNTRIES['middle-east'])
const regionOptions = computed(() => FILTER_REGIONS[currentMode.value.id] || FILTER_REGIONS['middle-east'])
const sourceOptions = computed(() => FILTER_SOURCES[currentMode.value.id] || FILTER_SOURCES['middle-east'])

function onChange(key, event) {
  searchStore.setFilter(key, event.target.value)
}

function resetFilters() {
  searchStore.resetFilters()
}
</script>

<template>
  <section class="panel p-3">
    <div class="mb-3 flex items-center justify-between">
      <p class="eyebrow">Filters</p>
      <div class="flex items-center gap-2">
        <button type="button" class="ghost-btn lg:hidden" @click="filtersOpen = !filtersOpen">
          {{ filtersOpen ? 'Hide' : 'Show' }}
        </button>
        <button type="button" class="ghost-btn" @click="resetFilters">
          Reset
        </button>
      </div>
    </div>

    <div
      class="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7"
      :class="filtersOpen ? 'grid' : 'hidden lg:grid'"
    >
      <label class="block">
        <span class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-paper-muted">Time range</span>
        <select class="field" :value="searchStore.filters.timeRange" @change="onChange('timeRange', $event)">
          <option v-for="option in TIME_RANGE_OPTIONS" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="block">
        <span class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-paper-muted">Category</span>
        <select class="field" :value="searchStore.filters.category" @change="onChange('category', $event)">
          <option v-for="option in categoryOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="block">
        <span class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-paper-muted">Country</span>
        <select class="field" :value="searchStore.filters.country" @change="onChange('country', $event)">
          <option v-for="option in countryOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="block">
        <span class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-paper-muted">Region</span>
        <select class="field" :value="searchStore.filters.region" @change="onChange('region', $event)">
          <option v-for="option in regionOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="block">
        <span class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-paper-muted">Language</span>
        <select class="field" :value="searchStore.filters.language" @change="onChange('language', $event)">
          <option v-for="option in LANGUAGE_OPTIONS" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="block">
        <span class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-paper-muted">Source</span>
        <select class="field" :value="searchStore.filters.source" @change="onChange('source', $event)">
          <option v-for="option in sourceOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="block">
        <span class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-paper-muted">Sort by</span>
        <select class="field" :value="searchStore.filters.sortBy" @change="onChange('sortBy', $event)">
          <option v-for="option in SORT_OPTIONS" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>
  </section>
</template>
