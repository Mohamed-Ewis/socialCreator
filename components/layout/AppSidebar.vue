<script setup>
const { items } = useAppNav()
const { categories } = useCategories()
const { currentMode } = useResearchMode()
const newsStore = useNewsStore()
const route = useRoute()
</script>

<template>
  <aside class="hidden w-56 shrink-0 border-r border-line bg-ink-chrome px-3 py-5 md:flex md:flex-col">
    <p class="eyebrow px-2">Workspace</p>
    <nav class="mt-3 space-y-1">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="nav-link"
      >
        <span class="flex-1">
          <span class="block font-medium text-paper">{{ item.label }}</span>
          <span class="block text-xs text-paper-muted">{{ item.hint }}</span>
        </span>
      </NuxtLink>
    </nav>

    <div class="mt-8 px-2">
      <p class="eyebrow">Workflow</p>
      <nav class="mt-3 space-y-1">
        <NuxtLink
          to="/research"
          class="nav-link"
          :class="route.path === '/research' ? 'router-link-exact-active' : ''"
        >
          <span class="text-sm">1. Select</span>
        </NuxtLink>
        <NuxtLink
          to="/research/lineup"
          class="nav-link"
          :class="!newsStore.submittedCount ? 'pointer-events-none opacity-40' : ''"
        >
          <span class="text-sm">2. Lineup</span>
        </NuxtLink>
        <NuxtLink
          to="/research/scripts"
          class="nav-link"
          :class="!newsStore.submittedCount ? 'pointer-events-none opacity-40' : ''"
        >
          <span class="text-sm">3. Scripts</span>
        </NuxtLink>
        <NuxtLink
          to="/research/video"
          class="nav-link"
          :class="!newsStore.submittedCount ? 'pointer-events-none opacity-40' : ''"
        >
          <span class="text-sm">4. Video</span>
        </NuxtLink>
      </nav>
    </div>

    <div class="mt-8 px-2">
      <p class="eyebrow">Active desk</p>
      <p class="mt-2 font-display text-xl leading-tight text-paper">{{ currentMode.label }}</p>
      <p class="mt-2 text-xs leading-relaxed text-paper-muted">
        {{ newsStore.checkedCount }} checked · {{ currentMode.videoLanguage }}
      </p>
    </div>

    <div class="mt-6 px-2">
      <p class="eyebrow">Video queues</p>
      <ul class="mt-3 space-y-2">
        <li
          v-for="category in categories"
          :key="category.id"
          class="flex items-center justify-between rounded-lg border border-line px-2.5 py-2"
        >
          <span class="text-sm">{{ category.shortLabel }}</span>
          <span class="text-[11px] text-paper-muted">
            {{ newsStore.countForQueue(currentMode.id, category.id) }}
          </span>
        </li>
      </ul>
    </div>

    <p class="mt-auto px-2 pt-8 text-[11px] leading-relaxed text-paper-muted">
      Filter, check, order the lineup, write scripts, then render video.
    </p>
  </aside>
</template>
