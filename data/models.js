import { CATEGORY_IDS } from '~/utils/constants'

export function createArticle(overrides = {}) {
  return {
    id: '',
    title: '',
    url: '',
    source: '',
    publishedAt: null,
    language: '',
    excerpt: '',
    country: '',
    region: '',
    mode: '',
    category: '',
    importanceScore: 0,
    raw: null,
    ...overrides
  }
}

export function createEmptyQueues() {
  return {
    'middle-east': {
      'economy-political': [],
      sports: [],
      trend: []
    },
    world: {
      'economy-political': [],
      sports: [],
      trend: []
    }
  }
}

export function createProject(overrides = {}) {
  return {
    id: '',
    name: '',
    mode: 'middle-east',
    notes: '',
    selectedStoryIds: {
      'middle-east': {
        'economy-political': [],
        sports: [],
        trend: []
      },
      world: {
        'economy-political': [],
        sports: [],
        trend: []
      }
    },
    createdAt: null,
    updatedAt: null,
    ...overrides
  }
}

export function isCategoryId(value) {
  return CATEGORY_IDS.includes(value)
}
