import { createVideoScript } from '~/data/scriptModel'
import { getVoiceForRegion } from '~/data/scriptVoice'
import { CATEGORY_IDS } from '~/utils/constants'

export function sourceName(story) {
  if (!story) {
    return 'Unknown'
  }

  if (typeof story.source === 'string' && story.source.trim()) {
    return story.source.trim()
  }

  return story.source?.name || 'Unknown'
}

export function compactStory(story, index = 0) {
  return {
    id: story.id,
    title: story.title || '',
    brief: story.brief || story.excerpt || '',
    url: story.url || '',
    source: sourceName(story),
    countries: Array.isArray(story.countries) ? story.countries : [],
    category: story.category || '',
    region: story.region || '',
    order: story.video?.order || index + 1
  }
}

export function compactQueue(stories = []) {
  return stories.map((story, index) => compactStory(story, index))
}

export function lineupSignature(queues, region) {
  return CATEGORY_IDS.map((categoryId) => {
    const ids = (queues?.[region]?.[categoryId] || []).map((item) => item.id)
    return `${categoryId}:${ids.join(',')}`
  }).join('|')
}

export function estimateSeconds(text, language = 'en') {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length

  if (!words) {
    return 0
  }

  const wordsPerSecond = language === 'ar' ? 2.2 : 2.5
  return Math.max(4, Math.round(words / wordsPerSecond))
}

export function recomputeScriptDuration(script) {
  if (!script) {
    return script
  }

  const language = script.language || 'en'
  const beats = (script.beats || []).map((beat) => ({
    ...beat,
    estimatedSeconds: estimateSeconds(beat.spoken, language)
  }))

  const hookSeconds = estimateSeconds(script.hook, language)
  const outroSeconds = estimateSeconds(script.outro, language)
  const beatSeconds = beats.reduce((sum, beat) => sum + beat.estimatedSeconds, 0)

  return {
    ...script,
    beats,
    estimatedSeconds: hookSeconds + beatSeconds + outroSeconds
  }
}

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0)
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60

  if (!minutes) {
    return `${remainder}s`
  }

  return `${minutes}m ${String(remainder).padStart(2, '0')}s`
}

export function buildExportPayload({ region, queues, scripts }) {
  const voice = getVoiceForRegion(region)

  return {
    exportedAt: new Date().toISOString(),
    region,
    voice: {
      id: voice.id,
      language: voice.language,
      label: voice.label
    },
    videos: CATEGORY_IDS.map((categoryId) => {
      const stories = compactQueue(queues?.[region]?.[categoryId] || [])
      const script = scripts?.[region]?.[categoryId] || null

      if (!stories.length && !script) {
        return null
      }

      return {
        category: categoryId,
        stories,
        script
      }
    }).filter(Boolean)
  }
}

export function emptyVideoScript(region, category, provider = 'local') {
  const voice = getVoiceForRegion(region)

  return createVideoScript({
    id: `${region}-${category}`,
    region,
    category,
    language: voice.language,
    voice: voice.id,
    provider,
    generatedAt: new Date().toISOString()
  })
}
