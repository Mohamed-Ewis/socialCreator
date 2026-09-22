<script setup>
import { getCategoryById } from '~/data/categories'
import { formatShortDate } from '~/utils/formatDate'

const emit = defineEmits(['edit'])

const newsStore = useNewsStore()
const articles = computed(() => newsStore.articles)

const allVisibleChecked = computed(() => {
  return articles.value.length > 0 && articles.value.every((article) => newsStore.isChecked(article.id))
})

function toggleAll(event) {
  newsStore.setCheckedAll(articles.value, event.target.checked)
}

function countriesLabel(article) {
  return (article.countries || []).join(', ') || '—'
}

function openEditor(article) {
  emit('edit', article)
}
</script>

<template>
  <div class="panel overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="border-b border-line bg-ink-overlay text-[10px] uppercase tracking-[0.14em] text-paper">
          <tr>
            <th class="w-10 px-3 py-2">
              <input
                type="checkbox"
                class="h-4 w-4 accent-gold"
                :checked="allVisibleChecked"
                :indeterminate.prop="newsStore.checkedCount > 0 && !allVisibleChecked"
                aria-label="Select all visible stories"
                @change="toggleAll"
              >
            </th>
            <th class="px-2 py-2">Score</th>
            <th class="px-2 py-2">Story</th>
            <th class="px-2 py-2">Source</th>
            <th class="px-2 py-2">Countries</th>
            <th class="px-2 py-2">Date</th>
            <th class="px-2 py-2">Subcategory</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="article in articles"
            :key="article.id"
            class="border-b border-line/80 last:border-b-0"
            :class="article.selected ? 'bg-gold/10' : 'bg-ink-raised hover:bg-ink-overlay/80'"
          >
            <td class="px-3 py-3 align-top">
              <input
                type="checkbox"
                class="h-4 w-4 accent-gold"
                :checked="article.selected"
                :aria-label="`Select ${article.title}`"
                @change="newsStore.toggleChecked(article)"
              >
            </td>
            <td class="px-2 py-3 align-top">
              <button
                type="button"
                class="story-field font-display text-base text-gold"
                @click="openEditor(article)"
              >
                {{ article.importance?.score || 0 }}
              </button>
            </td>
            <td class="min-w-[280px] px-2 py-3 align-top">
              <button
                type="button"
                class="story-field block w-full"
                @click="openEditor(article)"
              >
                <span class="block font-medium leading-snug text-paper">{{ article.title }}</span>
                <span class="mt-1 line-clamp-2 block text-xs leading-relaxed text-paper-muted">{{ article.brief }}</span>
              </button>
            </td>
            <td class="px-2 py-3 align-top">
              <button
                type="button"
                class="story-field whitespace-nowrap text-xs text-paper-muted"
                @click="openEditor(article)"
              >
                {{ article.source?.name || 'Unknown' }}
              </button>
            </td>
            <td class="px-2 py-3 align-top">
              <button
                type="button"
                class="story-field text-xs text-paper-muted"
                @click="openEditor(article)"
              >
                {{ countriesLabel(article) }}
              </button>
            </td>
            <td class="px-2 py-3 align-top">
              <button
                type="button"
                class="story-field whitespace-nowrap text-xs text-paper-muted"
                @click="openEditor(article)"
              >
                {{ article.publishedAt ? formatShortDate(article.publishedAt) : '—' }}
              </button>
            </td>
            <td class="px-2 py-3 align-top">
              <button
                type="button"
                class="story-field"
                @click="openEditor(article)"
              >
                <StatusPill
                  :label="getCategoryById(article.category).shortLabel"
                  :tone-class="getCategoryById(article.category).accentClass"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
