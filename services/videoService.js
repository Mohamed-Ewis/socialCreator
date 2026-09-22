export async function renderCategoryVideoRequest(payload) {
  return $fetch('/api/video/render', {
    method: 'POST',
    body: payload
  })
}

export async function fetchVideoStatusRequest(id) {
  return $fetch('/api/video/status', {
    query: { id }
  })
}
