<script setup>
const { items } = useAppNav()
</script>

<template>
  <nav class="flex gap-1 overflow-x-auto border-b border-line bg-ink-chrome px-4 py-2 md:hidden">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-paper-muted"
      exact-active-class="bg-ink-overlay text-paper"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
