import { createProject as buildProject } from '~/data/models'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref([])
  const activeProjectId = ref(null)

  const activeProject = computed(() => {
    return projects.value.find((project) => project.id === activeProjectId.value) || null
  })

  function createProject({ name, mode }) {
    const timestamp = new Date().toISOString()
    const project = buildProject({
      id: crypto.randomUUID(),
      name: name?.trim() || 'Untitled briefing',
      mode,
      createdAt: timestamp,
      updatedAt: timestamp
    })

    projects.value.unshift(project)
    activeProjectId.value = project.id

    return project
  }

  function setActiveProject(projectId) {
    activeProjectId.value = projectId
  }

  function updateProject(projectId, patch = {}) {
    const project = projects.value.find((item) => item.id === projectId)

    if (!project) {
      return null
    }

    Object.assign(project, patch, {
      updatedAt: new Date().toISOString()
    })

    return project
  }

  function removeProject(projectId) {
    projects.value = projects.value.filter((project) => project.id !== projectId)

    if (activeProjectId.value === projectId) {
      activeProjectId.value = projects.value[0]?.id || null
    }
  }

  function resetProjects() {
    projects.value = []
    activeProjectId.value = null
  }

  return {
    projects,
    activeProjectId,
    activeProject,
    createProject,
    setActiveProject,
    updateProject,
    removeProject,
    resetProjects
  }
})
