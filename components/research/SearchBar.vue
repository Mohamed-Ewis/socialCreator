<script setup>
import { SEARCH_INPUT_ID } from '~/utils/constants'

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: 'Search stories, countries, topics…'
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'clear'])

function onSubmit() {
  emit('search')
}

function onClear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <form class="flex flex-col gap-2 sm:flex-row sm:items-center" @submit.prevent="onSubmit">
    <label class="sr-only" :for="SEARCH_INPUT_ID">Search news</label>
    <input
      :id="SEARCH_INPUT_ID"
      :value="modelValue"
      type="search"
      name="query"
      :placeholder="placeholder"
      class="h-12 w-full rounded-xl border border-line bg-ink-raised px-4 text-sm text-paper outline-none placeholder:text-paper-muted focus:border-gold"
      @input="emit('update:modelValue', $event.target.value)"
    >
    <div class="flex shrink-0 gap-2">
      <button
        type="submit"
        class="h-12 min-w-[104px] rounded-xl bg-gold px-5 text-sm font-medium text-ink disabled:opacity-60"
        :disabled="loading"
      >
        {{ loading ? 'Searching' : 'Search' }}
      </button>
      <button
        type="button"
        class="h-12 rounded-xl border border-line px-4 text-sm text-paper-muted hover:text-paper"
        @click="onClear"
      >
        Clear
      </button>
    </div>
  </form>
</template>
