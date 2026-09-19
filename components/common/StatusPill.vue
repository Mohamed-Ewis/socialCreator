<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  toneClass: {
    type: String,
    default: 'bg-gold/15 text-gold'
  }
})
</script>

<template>
  <span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]" :class="toneClass">
    {{ label }}
  </span>
</template>
