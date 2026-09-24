<script setup>
defineProps({
  size: {
    type: String,
    default: 'default'
  }
})

const { modes, currentMode, setMode } = useResearchMode()
</script>

<template>
  <div
    class="inline-flex rounded-lg border border-line bg-ink-raised p-1"
    role="tablist"
    aria-label="Research mode"
  >
    <button
      v-for="mode in modes"
      :key="mode.id"
      type="button"
      role="tab"
      :aria-selected="mode.id === currentMode.id"
      class="rounded-md font-medium"
      :class="[
        size === 'compact' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
        mode.id === currentMode.id ? 'bg-gold text-ink' : 'text-paper hover:bg-ink-overlay'
      ]"
      @click="setMode(mode.id)"
    >
      {{ mode.label }}
    </button>
  </div>
</template>
