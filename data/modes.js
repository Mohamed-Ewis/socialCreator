export const RESEARCH_MODES = [
  {
    id: 'middle-east',
    label: 'Middle East',
    shortLabel: 'ME',
    language: 'ar',
    videoLanguage: 'Arabic',
    accentClass: 'text-gold',
    description: 'Politics, conflicts, economy, energy, technology, sports, trends, and major regional events for the Arabic daily video.'
  },
  {
    id: 'world',
    label: 'World',
    shortLabel: 'World',
    language: 'en',
    videoLanguage: 'English',
    accentClass: 'text-steel',
    description: 'World politics, economy, business, technology, AI, science, sports, major events, and trends for the English daily video.'
  }
]

export function getModeById(modeId) {
  return RESEARCH_MODES.find((mode) => mode.id === modeId) || RESEARCH_MODES[0]
}
