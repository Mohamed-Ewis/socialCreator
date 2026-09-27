export const IMAGE_STATUS = {
  idle: 'idle',
  generating: 'generating',
  succeeded: 'succeeded',
  failed: 'failed'
}

export function createEmptyImageJob(overrides = {}) {
  return {
    storyId: '',
    status: IMAGE_STATUS.idle,
    url: '',
    path: '',
    prompt: '',
    title: '',
    brief: '',
    errorMessage: '',
    model: '',
    size: '',
    revisedPrompt: '',
    generatedAt: null,
    ...overrides
  }
}
