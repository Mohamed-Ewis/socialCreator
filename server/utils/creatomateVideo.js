/**
 * Creatomate source builder (server-only).
 * Self-contained — Nitro ESM cannot reliably resolve imports outside server/.
 */

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const Creatomate = require('creatomate')

const {
  Client,
  Source,
  Composition,
  Video,
  Image,
  Text,
  Rectangle,
  Fade,
  Font,
  Shadow
} = Creatomate

const CATEGORY_LABELS = {
  'economy-political': { ar: 'السياسة والاقتصاد', en: 'Politics & Economy' },
  sports: { ar: 'الرياضة', en: 'Sports' },
  trend: { ar: 'الترند', en: 'Trends' }
}

function asString(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function categoryLabel(categoryId, language) {
  const labels = CATEGORY_LABELS[categoryId] || CATEGORY_LABELS['economy-political']
  return language === 'ar' ? labels.ar : labels.en
}

function mediaFromStory(story) {
  const media = story?.media && typeof story.media === 'object' ? story.media : null
  const url = asString(media?.url) || asString(story?.image?.url)

  if (!url) {
    return { kind: 'none', url: '' }
  }

  const kind = media?.kind === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(url)
    ? 'video'
    : 'image'

  return { kind, url }
}

function beatForStory(script, story) {
  return (script?.beats || []).find((beat) => beat.storyId === story.id) || null
}

function sceneDuration(story, beat) {
  const fromBeat = Number(beat?.estimatedSeconds)
  if (Number.isFinite(fromBeat) && fromBeat > 0) {
    return clamp(fromBeat, 4, 12)
  }

  return 6
}

function overlayText(story, beat) {
  return asString(beat?.onScreen) || asString(story?.title) || 'Story'
}

function spokenHint(beat, story) {
  return asString(beat?.spoken) || asString(story?.brief) || asString(story?.title)
}

function textOverlay({ text, language, size = '6.4 vh', yAlignment = '100%' }) {
  return new Text({
    text,
    width: '100%',
    height: '100%',
    xPadding: '4 vmin',
    yPadding: '7 vmin',
    xAlignment: language === 'ar' ? '100%' : '50%',
    yAlignment,
    font: new Font('Aileron', 800, 'normal', size),
    shadow: new Shadow('rgba(0,0,0,0.65)', '1.4 vmin'),
    fillColor: '#ffffff',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backgroundXPadding: '18%',
    backgroundYPadding: '28%',
    backgroundBorderRadius: '18%'
  })
}

function mediaElement({ media, duration }) {
  if (media.kind === 'video' && media.url) {
    return new Video({
      source: media.url,
      width: '100%',
      height: '100%',
      fit: 'cover',
      duration: 'media',
      trimDuration: duration,
      volume: '0%'
    })
  }

  if (media.url) {
    return new Image({
      source: media.url,
      width: '100%',
      height: '100%',
      fit: 'cover'
    })
  }

  return new Rectangle({
    width: '100%',
    height: '100%',
    fillColor: '#0f172a'
  })
}

function buildIntro({ language, categoryId, title, hook }) {
  const tagline = categoryLabel(categoryId, language)
  const mainTitle = asString(title) || tagline
  const hookText = asString(hook) || (language === 'ar' ? 'ملخص سريع.' : 'Quick rundown.')

  return new Composition({
    track: 1,
    duration: 5,
    elements: [
      new Rectangle({
        width: '100%',
        height: '100%',
        fillColor: '#0b1220'
      }),
      new Text({
        text: tagline,
        width: '100%',
        height: '18%',
        y: '28%',
        xPadding: '5 vmin',
        xAlignment: language === 'ar' ? '100%' : '50%',
        yAlignment: '50%',
        font: new Font('Aileron', 600, 'normal', '4.2 vh'),
        fillColor: '#93c5fd'
      }),
      new Text({
        text: mainTitle,
        width: '100%',
        height: '28%',
        y: '46%',
        xPadding: '5 vmin',
        xAlignment: language === 'ar' ? '100%' : '50%',
        yAlignment: '50%',
        font: new Font('Aileron', 800, 'normal', '7.2 vh'),
        fillColor: '#ffffff'
      }),
      new Text({
        text: hookText,
        width: '100%',
        height: '22%',
        y: '74%',
        xPadding: '5 vmin',
        xAlignment: language === 'ar' ? '100%' : '50%',
        yAlignment: '50%',
        font: new Font('Aileron', 500, 'normal', '3.8 vh'),
        fillColor: '#cbd5e1'
      })
    ]
  })
}

function buildStoryScene({ story, beat, language, withFade }) {
  const duration = sceneDuration(story, beat)
  const media = mediaFromStory(story)
  const line = overlayText(story, beat)
  const composition = {
    track: 1,
    duration,
    elements: [
      mediaElement({ media, duration }),
      textOverlay({ text: line, language })
    ]
  }

  if (withFade) {
    composition.transition = new Fade({ duration: 0.8 })
  }

  return new Composition(composition)
}

function buildOutro({ language, outro }) {
  const text = asString(outro) || (language === 'ar' ? 'اشترك عشان توصلك الباقي.' : 'More after this.')

  return new Composition({
    track: 1,
    duration: 4,
    transition: new Fade({ duration: 0.8 }),
    elements: [
      new Rectangle({
        width: '100%',
        height: '100%',
        fillColor: '#0b1220'
      }),
      textOverlay({
        text,
        language,
        size: '5.6 vh',
        yAlignment: '50%'
      })
    ]
  })
}

export function buildCreatomateSource({ region, category, stories = [], script = null }) {
  const language = asString(script?.language) || (region === 'world' ? 'en' : 'ar')
  const title = language === 'ar'
    ? categoryLabel(category, 'ar')
    : categoryLabel(category, 'en')
  const elements = [
    buildIntro({
      language,
      categoryId: category,
      title,
      hook: script?.hook
    })
  ]

  stories.forEach((story, index) => {
    const beat = beatForStory(script, story)
    elements.push(buildStoryScene({
      story,
      beat,
      language,
      withFade: true
    }))
    // Keep spoken line available for a future narration pass.
    void spokenHint(beat, story)
  })

  elements.push(buildOutro({
    language,
    outro: script?.outro
  }))

  return new Source({
    outputFormat: 'mp4',
    width: 1280,
    height: 720,
    frameRate: 30,
    fillColor: '#0b1220',
    elements
  })
}

export function createCreatomateClient(apiKey) {
  return new Client(apiKey)
}

export async function startCategoryRender({ apiKey, region, category, stories, script }) {
  const client = createCreatomateClient(apiKey)
  const source = buildCreatomateSource({ region, category, stories, script })
  const renders = await client.startRender({
    source,
    metadata: JSON.stringify({ region, category })
  })

  return renders?.[0] || null
}

export async function fetchCreatomateRender({ apiKey, renderId }) {
  const client = createCreatomateClient(apiKey)
  return client.fetchRender(renderId)
}
