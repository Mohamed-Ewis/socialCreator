import { RESEARCH_MODES, getModeById } from '~/data/modes'

export function useResearchMode() {
  const searchStore = useSearchStore()

  const modes = RESEARCH_MODES
  const currentMode = computed(() => getModeById(searchStore.mode))

  function setMode(modeId) {
    searchStore.setMode(modeId)
  }

  return {
    modes,
    currentMode,
    setMode
  }
}
