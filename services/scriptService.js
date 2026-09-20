import { compactQueue } from '~/utils/scripts'

export async function generateVideoScriptRequest({
  region,
  category,
  stories,
  focusStoryId = null,
  existingScript = null
}) {
  return $fetch('/api/scripts/generate', {
    method: 'POST',
    body: {
      region,
      category,
      stories: compactQueue(stories),
      focusStoryId,
      existingScript
    }
  })
}

export async function exportBriefingRequest(payload) {
  return $fetch('/api/export', {
    method: 'POST',
    body: payload
  })
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
