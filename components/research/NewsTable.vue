<script setup>
import { getCategoryById } from '~/data/categories'
import { formatShortDate } from '~/utils/formatDate'

const newsStore = useNewsStore()
const articles = computed(() => newsStore.articles)

const allVisibleChecked = computed(() => {
  return articles.value.length > 0 && articles.value.every((article) => newsStore.isChecked(article.id))
})

function toggleAll(event) {
  newsStore.setCheckedAll(articles.value, event.target.checked)
}

function sourceName(article) {
  return article.source?.name || 'Unknown'
}

function countriesLabel(article) {
  return (article.countries || []).join(', ') || '—'
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
            <td class="px-2 py-3 align-top font-display text-base text-gold">
              {{ article.importance?.score || 0 }}
            </td>
            <td class="min-w-[280px] px-2 py-3 align-top">
              <p class="font-medium leading-snug text-paper">{{ article.title }}</p>
              <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-paper-muted">{{ article.brief }}</p>
            </td>
            <td class="whitespace-nowrap px-2 py-3 align-top text-xs text-paper-muted">
              {{ sourceName(article) }}
            </td>
            <td class="px-2 py-3 align-top text-xs text-paper-muted">
              {{ countriesLabel(article) }}
            </td>
            <td class="whitespace-nowrap px-2 py-3 align-top text-xs text-paper-muted">
              {{ article.publishedAt ? formatShortDate(article.publishedAt) : '—' }}
            </td>
            <td class="px-2 py-3 align-top">
              <StatusPill
                :label="getCategoryById(article.category).shortLabel"
                :tone-class="getCategoryById(article.category).accentClass"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
