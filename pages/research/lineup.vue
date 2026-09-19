<script setup>
definePageMeta({
  layout: 'research',
  middleware: () => {
    const newsStore = useNewsStore()

    if (!newsStore.submittedCount) {
      return navigateTo('/research')
    }
  }
})

const newsStore = useNewsStore()
const { modes } = useResearchMode()
const router = useRouter()

const regionMeta = computed(() => {
  return modes.find((mode) => mode.id === newsStore.submittedRegion) || modes[0]
})

const hasLineup = computed(() => newsStore.submittedCount > 0)

function goBack() {
  router.push('/research')
}
</script>

<template>
  <div v-if="hasLineup" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="eyebrow">Step 2 of 2</p>
        <h1 class="mt-1 font-display text-3xl tracking-tight">Order the videos</h1>
        <p class="mt-1 max-w-2xl text-sm text-paper-muted">
          {{ regionMeta.label }} · {{ regionMeta.videoLanguage }}. Drag stories inside each subcategory to set the video order.
        </p>
      </div>
      <button type="button" class="icon-btn" @click="goBack">
        Back to select
      </button>
    </div>

    <p class="text-sm text-paper">
      {{ newsStore.submittedCount }} submitted
      <span class="text-paper-muted"> · Politics & Economy, Sports, and Trends become three videos</span>
    </p>

    <SelectionPanel />
  </div>
</template>
