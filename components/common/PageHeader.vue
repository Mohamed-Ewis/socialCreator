<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: ''
  },
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
  <div class="mb-8 max-w-3xl">
    <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
    <h1 class="mt-2 font-display text-4xl tracking-tight text-paper">{{ title }}</h1>
    <p v-if="description" class="mt-3 max-w-2xl text-base leading-relaxed text-paper-muted">
      {{ description }}
    </p>
  </div>
</template>
