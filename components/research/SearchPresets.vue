<script setup>
defineProps({
  presets: {
    type: Array,
    default: () => []
  },
  activeId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select'])
</script>

<template>
  <div>
    <p class="eyebrow mb-2">Quick presets</p>
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="preset in presets"
        :key="preset.id"
        type="button"
        class="rounded-md border px-2.5 py-1 text-xs"
        :class="preset.id === activeId
          ? 'border-gold bg-gold/15 text-paper'
          : 'border-line text-paper-muted hover:text-paper'"
        @click="emit('select', preset)"
      >
        {{ preset.label }}
      </button>
    </div>
  </div>
</template>
