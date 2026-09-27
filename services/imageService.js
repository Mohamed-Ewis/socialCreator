export async function generateStoryImageRequest({ story, prompt = '' }) {
  return $fetch('/api/images/generate', {
    method: 'POST',
    body: {
      story,
      prompt: prompt || undefined
    }
  })
}
