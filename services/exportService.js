import { buildExportPayload } from '~/utils/scripts'

export function exportSelectedStories({ region, queues, scripts } = {}) {
  if (!region || !queues) {
    return {
      implemented: false,
      stories: []
    }
  }

  return buildExportPayload({ region, queues, scripts })
}
