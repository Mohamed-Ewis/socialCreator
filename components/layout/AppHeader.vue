<script setup>
const { appName } = useAppNav()
const { currentMode } = useResearchMode()
const { runSearch, focusSearchInput } = useLocalSearch()
const route = useRoute()
const router = useRouter()

async function onHeaderSearch() {
  if (route.path !== '/research') {
    await router.push('/research')
  }

  await nextTick()
  focusSearchInput()
  await runSearch()
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-line bg-ink-chrome/90 backdrop-blur-md">
    <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-5">
      <div class="flex min-w-0 items-center gap-3">
        <RouterLink
          to="/"
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-gold font-display text-xs font-semibold text-ink hover:bg-gold/80 transition-colors"
          aria-label="Go to homepage"
        >
          NR
        </RouterLink>
 
        <div class="min-w-0">
          <p class="truncate font-display text-base leading-none tracking-tight text-paper">{{ appName }}</p>
          <p class="mt-1 truncate text-[11px] text-paper-muted">
            {{ currentMode.label }}
            <span class="text-paper-muted/70">· {{ currentMode.videoLanguage }} · Economy, Sports, Trends</span>
          </p>
        </div>
      </div>

      <ModeSwitcher size="compact" />

      <div class="flex items-center gap-2">
        <button type="button" class="icon-btn" @click="onHeaderSearch">
          Search
        </button>
        <button
          type="button"
          class="icon-btn"
          title="Settings will be added later"
        >
          Settings
        </button>
      </div>
    </div>
  </header>
</template>
