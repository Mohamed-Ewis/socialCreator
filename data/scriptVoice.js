export const SCRIPT_VOICES = {
  'middle-east': {
    id: 'egyptian-light',
    region: 'middle-east',
    language: 'ar',
    label: 'Egyptian, light colloquial',
    dir: 'rtl'
  },
  world: {
    id: 'american-conversational',
    region: 'world',
    language: 'en',
    label: 'American conversational',
    dir: 'ltr'
  }
}

export const SCRIPT_CATEGORY_LABELS = {
  'economy-political': {
    ar: 'السياسة والاقتصاد',
    en: 'politics and the economy'
  },
  sports: {
    ar: 'الرياضة',
    en: 'sports'
  },
  trend: {
    ar: 'الترند',
    en: 'trends'
  }
}

export function getVoiceForRegion(region) {
  return SCRIPT_VOICES[region] || SCRIPT_VOICES['middle-east']
}

export function categorySpokenLabel(categoryId, language) {
  const labels = SCRIPT_CATEGORY_LABELS[categoryId] || SCRIPT_CATEGORY_LABELS['economy-political']
  return language === 'ar' ? labels.ar : labels.en
}

export const SCRIPT_RULES = [
  'Write spoken host copy, not an article.',
  'Keep names, numbers, dates, and quotes exact. Do not dialect-ify them.',
  'Each story beat should land in about 12–20 seconds.',
  'The hook is 5–8 seconds. The outro is short and points to the next video.',
  'Do not invent facts, figures, or developments missing from title/brief.',
  'If the brief is thin, stay neutral or set needsCheck to true. You may mark a gap with [needs check].',
  'Keep the story order exactly as given.',
  'onScreen is a short lower-third, max 8 words.'
]

export const VOICE_EXAMPLES = {
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

export function buildSystemPrompt(voice) {
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

export function buildUserPrompt({ voice, categoryId, stories, focusStoryId = null }) {
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
