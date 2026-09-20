export const SCRIPT_STATUS = {
  idle: 'idle',
  generating: 'generating',
  ready: 'ready',
  error: 'error'
}

export function createScriptBeat(overrides = {}) {
  return {
    storyId: '',
    order: 1,
    spoken: '',
    onScreen: '',
    source: '',
    url: '',
    estimatedSeconds: 15,
    needsCheck: false,
    ...overrides
  }
}

export function createVideoScript(overrides = {}) {
  return {
    id: '',
    region: 'middle-east',
    category: 'economy-political',
    language: 'ar',
    voice: 'egyptian-light',
    hook: '',
    beats: [],
    outro: '',
    estimatedSeconds: 0,
    generatedAt: null,
    provider: 'local',
    ...overrides
  }
}

export function createEmptyScriptMap() {
  return {
    'middle-east': {
      'economy-political': null,
      sports: null,
      trend: null
    },
    world: {
      'economy-political': null,
      sports: null,
      trend: null
    }
  }
}

export function isScriptCategoryId(value) {
  return ['economy-political', 'sports', 'trend'].includes(value)
}
