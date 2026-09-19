export const STORY_CATEGORIES = [
  {
    id: 'economy-political',
    label: 'Politics & Economy',
    shortLabel: 'Economy',
    videoSlot: 1,
    accentClass: 'bg-economy/20 text-economy',
    description: 'Politics, markets, energy, and policy. Feeds the Economy video for the current region.'
  },
  {
    id: 'sports',
    label: 'Sports',
    shortLabel: 'Sports',
    videoSlot: 2,
    accentClass: 'bg-sports/20 text-sports',
    description: 'Matches, transfers, and tournaments. Feeds the Sports video for the current region.'
  },
  {
    id: 'trend',
    label: 'Trends',
    shortLabel: 'Trends',
    videoSlot: 3,
    accentClass: 'bg-trend/20 text-trend',
    description: 'Culture, technology, and viral moments. Feeds the Trends video for the current region.'
  }
]

export const ALL_CATEGORY = {
  id: 'all',
  label: 'All',
  shortLabel: 'All',
  videoSlot: null,
  accentClass: 'bg-gold/15 text-gold',
  description: 'Every subcategory for the selected region, ranked by importance.'
}

export function getCategoryById(categoryId) {
  if (categoryId === 'all') {
    return ALL_CATEGORY
  }

  return STORY_CATEGORIES.find((category) => category.id === categoryId) || ALL_CATEGORY
}
