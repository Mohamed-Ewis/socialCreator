<script setup>
const { modes, setMode } = useResearchMode()
const { categories } = useCategories()
const router = useRouter()

const steps = [
  'Choose Middle East or World',
  'Choose All, Politics & Economy, Sports, or Trends',
  'Check the important stories in the table',
  'Submit to the lineup step',
  'Drag to order each video'
]

function openDesk(modeId) {
  setMode(modeId)
  router.push('/research')
}
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Overview"
      title="A newsroom for daily video briefs."
      description="Collect Economy, Sports, and Trends stories for Middle East and World. Each region becomes three videos."
    />

    <section class="grid gap-4 lg:grid-cols-2">
      <button
        v-for="mode in modes"
        :key="mode.id"
        type="button"
        class="panel p-6 text-left transition-colors hover:border-gold/30"
        @click="openDesk(mode.id)"
      >
        <div class="flex items-center justify-between">
          <StatusPill :label="mode.videoLanguage" :tone-class="mode.id === 'world' ? 'bg-steel/15 text-steel' : 'bg-gold/15 text-gold'" />
          <span class="text-xs uppercase tracking-[0.16em] text-paper-muted">Open desk</span>
        </div>
        <h2 class="mt-5 font-display text-3xl text-paper">{{ mode.label }}</h2>
        <p class="mt-3 text-sm leading-relaxed text-paper-muted">{{ mode.description }}</p>
      </button>
    </section>

    <section class="mt-8 grid gap-4 md:grid-cols-3">
      <article
        v-for="category in categories"
        :key="category.id"
        class="panel p-5"
      >
        <StatusPill :label="`Video ${category.videoSlot}`" :tone-class="category.accentClass" />
        <h3 class="mt-4 font-display text-2xl text-paper">{{ category.label }}</h3>
        <p class="mt-2 text-sm leading-relaxed text-paper-muted">{{ category.description }}</p>
      </article>
    </section>

    <section class="panel mt-8 p-6">
      <p class="eyebrow">Pipeline</p>
      <ol class="mt-4 grid gap-3 md:grid-cols-5">
        <li
          v-for="(step, index) in steps"
          :key="step"
          class="rounded-xl border border-line px-4 py-4"
        >
          <span class="text-[11px] uppercase tracking-[0.16em] text-gold">0{{ index + 1 }}</span>
          <p class="mt-2 text-sm leading-relaxed text-paper">{{ step }}</p>
        </li>
      </ol>
    </section>
  </div>
</template>
