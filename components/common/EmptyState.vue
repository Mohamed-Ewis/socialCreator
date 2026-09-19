<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-line px-8 py-16 text-center">
    <p class="font-display text-2xl text-paper">{{ title }}</p>
    <p v-if="description" class="mt-3 max-w-md text-sm leading-relaxed text-paper-muted">
      {{ description }}
    </p>
    <slot />
  </div>
</template>
