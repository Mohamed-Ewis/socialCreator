/**
 * Spoken-script generator (server-only).
 * Self-contained — Nitro ESM cannot reliably resolve imports outside server/.
 */

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_BASE = 'https://api.openai.com/v1'

const SCRIPT_VOICES = {
  'middle-east': {
    id: 'egyptian-light',
    region: 'middle-east',
    language: 'ar',
    label: 'Egyptian, light colloquial'
  },
  world: {
    id: 'american-conversational',
    region: 'world',
    language: 'en',
    label: 'American conversational'
  }
}

const SCRIPT_CATEGORY_LABELS = {
  'economy-political': { ar: 'السياسة والاقتصاد', en: 'politics and the economy' },
  sports: { ar: 'الرياضة', en: 'sports' },
  trend: { ar: 'الترند', en: 'trends' }
}

const SCRIPT_RULES = [
  'Write spoken host copy, not an article.',
  'Keep names, numbers, dates, and quotes exact. Do not dialect-ify them.',
  'Each story beat should land in about 12–20 seconds.',
  'The hook is 5–8 seconds. The outro is short and points to the next video.',
  'Do not invent facts, figures, or developments missing from title/brief.',
  'If the brief is thin, stay neutral or set needsCheck to true. You may mark a gap with [needs check].',
  'Keep the story order exactly as given.',
  'onScreen is a short lower-third, max 8 words.'
]

const VOICE_EXAMPLES = {
  'egyptian-light': {
    hook: 'يلا نعدّي بسرعة على أهم أخبار السياسة والاقتصاد النهارده.',
    beat: 'من رويترز: البنك المركزي رفع الفايدة تاني بعد ضغط على الجنيه. الخبر بيقول إن تكلفة واردات الأكل طلعت، ومن غير ما نزوّد أرقام مش مكتوبة.',
    outro: 'ده ملخص السياسة والاقتصاد. نكمّل في الفيديو اللي بعده.'
  },
  'american-conversational': {
    hook: "Here's what matters in sports today — short, confirmed, no extra spin.",
    beat: "Reuters says the club froze European fixtures over security briefings. That's the update in the brief; we're not filling gaps.",
    outro: "That's the sports rundown. Next video is up after this."
  }
}

function asString(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function getVoiceForRegion(region) {
  return SCRIPT_VOICES[region] || SCRIPT_VOICES['middle-east']
}

function categorySpokenLabel(categoryId, language) {
  const labels = SCRIPT_CATEGORY_LABELS[categoryId] || SCRIPT_CATEGORY_LABELS['economy-political']
  return language === 'ar' ? labels.ar : labels.en
}

function createScriptBeat(overrides = {}) {
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

function createVideoScript(overrides = {}) {
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

function sourceName(story) {
  if (typeof story?.source === 'string' && story.source.trim()) {
    return story.source.trim()
  }

  return story?.source?.name || 'Unknown'
}

function estimateSeconds(text, language = 'en') {
  const words = asString(text).split(/\s+/).filter(Boolean).length

  if (!words) {
    return 0
  }

  const wordsPerSecond = language === 'ar' ? 2.2 : 2.5
  return Math.max(4, Math.round(words / wordsPerSecond))
}

function parseJsonObject(text) {
  const trimmed = asString(text)
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')

  if (start === -1 || end === -1) {
    throw new Error('Script model returned no JSON object.')
  }

  return JSON.parse(trimmed.slice(start, end + 1))
}

function withDuration(script) {
  const beats = (script.beats || []).map((beat) => ({
    ...beat,
    estimatedSeconds: estimateSeconds(beat.spoken, script.language)
  }))
  const estimatedSeconds = estimateSeconds(script.hook, script.language)
    + beats.reduce((sum, beat) => sum + beat.estimatedSeconds, 0)
    + estimateSeconds(script.outro, script.language)

  return {
    ...script,
    beats,
    estimatedSeconds
  }
}

function needsCheckFrom(story, spoken) {
  const brief = asString(story.brief || story.excerpt)
  const spokenText = asString(spoken).toLowerCase()

  return brief.length < 40 || spokenText.includes('[needs check]')
}

function onScreenFrom(title) {
  const words = asString(title).split(/\s+/).filter(Boolean)
  return words.slice(0, 8).join(' ')
}

function localBeat(story, index, voice) {
  const source = sourceName(story)
  const title = asString(story.title)
  const brief = asString(story.brief || story.excerpt)
  const spoken = voice.language === 'ar'
    ? `من ${source}: ${title}. ${brief || 'مفيش تفاصيل زيادة في الملخص.'} وده آخر اللي ظاهر في الخبر، من غير ما نزود حاجة مش مكتوبة.`
    : `${source} reports: ${title}. ${brief || 'No extra detail in the brief.'} That's all we can confirm from this item.`

  return createScriptBeat({
    storyId: story.id,
    order: story.order || index + 1,
    spoken,
    onScreen: onScreenFrom(title),
    source,
    url: asString(story.url),
    needsCheck: needsCheckFrom(story, spoken)
  })
}

function buildSystemPrompt(voice) {
  const dialectRules = voice.language === 'ar'
    ? [
        'Language: light Egyptian colloquial, like a young Reels news host.',
        'Not formal MSA, and not heavy street slang or comedy.',
        'Host chrome can be Egyptian; keep proper nouns and numbers precise.'
      ]
    : [
        'Language: conversational American English.',
        'Short sentences, contractions, present-tense leads.',
        'Not BBC-formal, and not slang-heavy.'
      ]

  return [
    'You write spoken scripts for daily social news videos.',
    ...dialectRules,
    ...SCRIPT_RULES,
    `Voice label: ${voice.label}.`,
    'Return JSON only with keys hook, outro, beats.',
    'Each beats item must include storyId, spoken, onScreen, needsCheck.'
  ].join('\n')
}

function buildUserPrompt({ voice, categoryId, stories, focusStoryId = null }) {
  const categoryLabel = categorySpokenLabel(categoryId, voice.language)
  const example = VOICE_EXAMPLES[voice.id]
  const lines = stories.map((story, index) => {
    const countries = (story.countries || []).join(', ') || 'n/a'
    return [
      `${index + 1}. id=${story.id}`,
      `title: ${story.title}`,
      `brief: ${story.brief || '(none)'}`,
      `source: ${story.source || 'Unknown'}`,
      `url: ${story.url || ''}`,
      `countries: ${countries}`
    ].join('\n')
  })

  const focus = focusStoryId
    ? `Rewrite only the beat for storyId=${focusStoryId}. Keep hook and outro empty strings. Return a beats array with that one item.`
    : 'Write hook, every beat in order, and outro for this one video.'

  return [
    `Region: ${voice.region}`,
    `Category: ${categoryId} (${categoryLabel})`,
    `Story count: ${stories.length}`,
    focus,
    '',
    'Example tone:',
    `hook: ${example.hook}`,
    `beat: ${example.beat}`,
    `outro: ${example.outro}`,
    '',
    'Stories:',
    lines.join('\n\n')
  ].join('\n')
}

export function buildLocalScript({ region, category, stories = [] }) {
  const voice = getVoiceForRegion(region)
  const categoryLabel = categorySpokenLabel(category, voice.language)
  const hook = voice.language === 'ar'
    ? `يلا نعدّي بسرعة على أهم أخبار ${categoryLabel} النهارده. اللي متأكد منه بس.`
    : `Here's what matters in ${categoryLabel} today — only what we can confirm.`
  const outro = voice.language === 'ar'
    ? `ده ملخص ${categoryLabel}. راجع المصدر لو حابب تتأكد، ونكمّل في الفيديو اللي بعده.`
    : `That's the ${categoryLabel} rundown. Check the sources if you want the full piece.`

  return withDuration(createVideoScript({
    id: `${region}-${category}`,
    region,
    category,
    language: voice.language,
    voice: voice.id,
    hook,
    beats: stories.map((story, index) => localBeat(story, index, voice)),
    outro,
    generatedAt: new Date().toISOString(),
    provider: 'local'
  }))
}

function mergeLlmScript({ region, category, stories, parsed, provider }) {
  const local = buildLocalScript({ region, category, stories })
  const beatsById = new Map((parsed.beats || []).map((beat) => [asString(beat.storyId), beat]))

  const beats = stories.map((story, index) => {
    const llmBeat = beatsById.get(story.id)
    const fallback = local.beats[index]

    if (!llmBeat) {
      return fallback
    }

    const spoken = asString(llmBeat.spoken) || fallback.spoken

    return createScriptBeat({
      ...fallback,
      spoken,
      onScreen: asString(llmBeat.onScreen) || fallback.onScreen,
      needsCheck: Boolean(llmBeat.needsCheck) || needsCheckFrom(story, spoken)
    })
  })

  return withDuration({
    ...local,
    hook: asString(parsed.hook) || local.hook,
    outro: asString(parsed.outro) || local.outro,
    beats,
    provider,
    generatedAt: new Date().toISOString()
  })
}

async function requestChatJson({ apiKey, apiBase, model, systemPrompt, userPrompt }) {
  const base = asString(apiBase) || DEFAULT_BASE
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45000)

  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: asString(model) || DEFAULT_MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }),
      signal: controller.signal
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = payload?.error?.message || `Script model failed with ${response.status}.`
      throw new Error(message)
    }

    const text = payload?.choices?.[0]?.message?.content
    return parseJsonObject(text)
  } finally {
    clearTimeout(timeout)
  }
}

export async function generateVideoScript({
  region,
  category,
  stories = [],
  apiKey = '',
  apiBase = '',
  model = DEFAULT_MODEL,
  focusStoryId = null,
  existingScript = null
}) {
  const local = buildLocalScript({ region, category, stories })

  if (!stories.length) {
    return { script: local, warning: null }
  }

  if (!asString(apiKey)) {
    return {
      script: local,
      warning: 'No OPENAI_API_KEY. Draft generator kept source wording inside host lines.'
    }
  }

  const voice = getVoiceForRegion(region)
  const systemPrompt = buildSystemPrompt(voice)
  const userPrompt = buildUserPrompt({
    voice,
    categoryId: category,
    stories,
    focusStoryId
  })

  try {
    const parsed = await requestChatJson({
      apiKey,
      apiBase,
      model,
      systemPrompt,
      userPrompt
    })

    if (focusStoryId && existingScript) {
      const focused = mergeLlmScript({
        region,
        category,
        stories,
        parsed,
        provider: 'openai'
      })
      const nextBeats = existingScript.beats.map((beat) => {
        const updated = focused.beats.find((item) => item.storyId === beat.storyId)
        return beat.storyId === focusStoryId && updated ? updated : beat
      })

      return {
        script: withDuration({
          ...existingScript,
          beats: nextBeats,
          provider: 'openai',
          generatedAt: new Date().toISOString()
        }),
        warning: null
      }
    }

    return {
      script: mergeLlmScript({
        region,
        category,
        stories,
        parsed,
        provider: 'openai'
      }),
      warning: null
    }
  } catch (error) {
    return {
      script: local,
      warning: error.name === 'AbortError'
        ? 'Script model timed out. Draft generator used instead.'
        : `${error.message} Draft generator used instead.`
    }
  }
}
