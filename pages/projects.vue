<script setup>
const searchStore = useSearchStore()
const projectsStore = useProjectsStore()
const draftName = ref('')

function onCreateProject() {
  projectsStore.createProject({
    name: draftName.value,
    mode: searchStore.mode
  })
  draftName.value = ''
}
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Projects"
      title="Briefing batches"
      description="Each project holds a manual selection of stories across the three video categories. Persistence to IndexedDB comes later."
    />

    <form class="mb-6 flex flex-col gap-3 sm:flex-row" @submit.prevent="onCreateProject">
      <input
        v-model="draftName"
        type="text"
        name="name"
        placeholder="Briefing name"
        class="h-12 flex-1 rounded-2xl border border-line bg-ink-raised px-4 text-sm outline-none placeholder:text-paper-muted focus:border-gold/50"
      >
      <button type="submit" class="h-12 rounded-2xl bg-gold px-5 text-sm font-medium text-ink">
        New project
      </button>
    </form>

    <EmptyState
      v-if="!projectsStore.projects.length"
      title="No projects yet"
      description="Create a local in-memory project to hold a future 20–30 story export. Nothing is saved to disk yet."
    />

    <ul v-else class="grid gap-3">
      <li
        v-for="project in projectsStore.projects"
        :key="project.id"
        class="panel flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p class="font-display text-xl">{{ project.name }}</p>
          <p class="mt-1 text-sm text-paper-muted">
            {{ project.mode === 'world' ? 'World' : 'Middle East' }}
            · In memory only
          </p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-xl border border-line px-3 py-2 text-sm"
            @click="projectsStore.setActiveProject(project.id)"
          >
            {{ projectsStore.activeProjectId === project.id ? 'Active' : 'Set active' }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-line px-3 py-2 text-sm text-paper-muted"
            @click="projectsStore.removeProject(project.id)"
          >
            Remove
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
