<script setup>
const { filterCategories, currentCategory, setCategory } = useCategories()
</script>

<template>
  <div>
    <p class="eyebrow mb-2">Subcategory</p>
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="category in filterCategories"
        :key="category.id"
        type="button"
        class="rounded-md border px-3 py-1.5 text-xs font-medium"
        :class="category.id === currentCategory.id
          ? 'border-gold bg-gold text-white'
          : 'border-line bg-ink-raised text-paper hover:border-gold/40'"
        @click="setCategory(category.id)"
      >
        {{ category.label }}
      </button>
    </div>
  </div>
</template>
