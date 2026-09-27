/**
 * AI image generator (server-only).
 * - OpenAI / OpenAI-compatible: POST /images/generations
 * - Gemini (generativelanguage base or IMAGE_PROVIDER=gemini): native
 *   generateContent with an image model (Nano Banana). Imagen predict is shut down.
 * Self-contained — Nitro ESM cannot reliably resolve imports outside server/.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const DEFAULT_BASE = 'https://api.openai.com/v1'
const DEFAULT_IMAGE_MODEL = 'dall-e-3'
const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image'
const DEFAULT_IMAGE_SIZE = '1024x1024'
const GEMINI_NATIVE_ROOT = 'https://generativelanguage.googleapis.com/v1beta'

function asString(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function isGeminiBase(apiBase) {
  return asString(apiBase).includes('generativelanguage.googleapis.com')
}

function isOpenAiOnlyImageModel(model) {
  const m = asString(model).toLowerCase()
  return !m
    || m.startsWith('dall-e')
    || m.startsWith('gpt-image')
    || m === 'chatgpt-image-latest'
}

function isImagenModel(model) {
  return asString(model).toLowerCase().startsWith('imagen-')
}

/**
 * Resolve which image backend to use.
 * Explicit IMAGE_PROVIDER wins; otherwise detect Gemini from API base / key alias.
 */
export function resolveImageProvider({
  imageProvider = '',
  apiBase = '',
  geminiApiKey = ''
} = {}) {
  const explicit = asString(imageProvider).toLowerCase()
  if (explicit === 'gemini' || explicit === 'google') {
    return 'gemini'
  }
  if (explicit === 'openai') {
    return 'openai'
  }
  if (isGeminiBase(apiBase) || asString(geminiApiKey)) {
    return 'gemini'
  }
  return 'openai'
}

function resolveGeminiImageModel(requested) {
  const model = asString(requested)
  if (!model || isOpenAiOnlyImageModel(model)) {
    return DEFAULT_GEMINI_IMAGE_MODEL
  }
  if (isImagenModel(model)) {
    // Imagen was shut down on the Gemini Developer API (Aug 2026).
    // Map common ids to the current Nano Banana flash image model.
    return DEFAULT_GEMINI_IMAGE_MODEL
  }
  return model
}

/**
 * Map OpenAI-style WxH sizes to Gemini imageConfig.
 */
function sizeToGeminiImageConfig(size) {
  const s = asString(size).toLowerCase()
  const map = {
    '256x256': { aspectRatio: '1:1', imageSize: '512' },
    '512x512': { aspectRatio: '1:1', imageSize: '512' },
    '1024x1024': { aspectRatio: '1:1', imageSize: '1K' },
    '1792x1024': { aspectRatio: '16:9', imageSize: '1K' },
    '1024x1792': { aspectRatio: '9:16', imageSize: '1K' },
    '1536x1024': { aspectRatio: '3:2', imageSize: '1K' },
    '1024x1536': { aspectRatio: '2:3', imageSize: '1K' }
  }
  return map[s] || { aspectRatio: '1:1', imageSize: '1K' }
}

/**
 * Build an English visual prompt from story fields.
 * English tends to work better for image models even when the story is Arabic.
 */
export function buildImagePrompt(story = {}, options = {}) {
  const title = asString(story.title)
  const brief = asString(story.brief || story.excerpt || story.description)
  const source = typeof story.source === 'string'
    ? asString(story.source)
    : asString(story.source?.name)
  const countries = Array.isArray(story.countries)
    ? story.countries.filter(Boolean).join(', ')
    : ''

  const subject = [title, brief].filter(Boolean).join('. ')
  const contextBits = []

  if (countries) {
    contextBits.push(`Setting/region cues: ${countries}.`)
  }

  if (source) {
    contextBits.push(`News context from ${source}.`)
  }

  const style = asString(options.style)
    || 'Editorial news illustration, cinematic lighting, photorealistic, suitable for social media, no text, no logos, no watermarks.'

  return [
    'Create a single social-ready news image.',
    subject ? `Subject: ${subject}` : 'Subject: breaking news scene.',
    ...contextBits,
    style,
    'Do not render readable text, headlines, or captions inside the image.'
  ].filter(Boolean).join(' ')
}

function sanitizeFilePart(value) {
  return asString(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'story'
}

async function ensureOutputDir() {
  const dir = join(process.cwd(), 'public', 'generated', 'images')
  await mkdir(dir, { recursive: true })
  return dir
}

async function saveBase64Image(b64, storyId, mimeType = 'image/png') {
  const dir = await ensureOutputDir()
  const ext = asString(mimeType).includes('jpeg') || asString(mimeType).includes('jpg')
    ? 'jpg'
    : 'png'
  const filename = `${sanitizeFilePart(storyId)}-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
  const absolute = join(dir, filename)
  await writeFile(absolute, Buffer.from(b64, 'base64'))
  return {
    path: `/generated/images/${filename}`,
    absolute
  }
}

async function downloadAndSave(url, storyId) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not download generated image (${response.status}).`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const dir = await ensureOutputDir()
  const contentType = response.headers.get('content-type') || ''
  const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png'
  const filename = `${sanitizeFilePart(storyId)}-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
  const absolute = join(dir, filename)
  await writeFile(absolute, buffer)

  return {
    path: `/generated/images/${filename}`,
    absolute
  }
}

function imageModelError(model, status, payload) {
  const detail = asString(
    payload?.error?.message
      || payload?.error?.status
      || (Array.isArray(payload?.error?.details) ? payload.error.details[0]?.reason : '')
  )
  const prefix = `Image model ${model} failed with ${status}.`
  return detail ? `${prefix} ${detail}` : prefix
}

function geminiFriendlyError(model, status, payload) {
  const base = imageModelError(model, status, payload)
  const detail = asString(payload?.error?.message).toLowerCase()
  const statusText = asString(payload?.error?.status).toUpperCase()

  if (status === 404 || detail.includes('not found') || detail.includes('is not found')) {
    return `${base} Set OPENAI_IMAGE_MODEL to a Gemini image model such as ${DEFAULT_GEMINI_IMAGE_MODEL} or gemini-3.1-flash-image (Imagen models are shut down on the Gemini API).`
  }

  if (
    status === 429
    || statusText.includes('RESOURCE_EXHAUSTED')
    || detail.includes('quota')
    || detail.includes('rate')
  ) {
    return `${base} Gemini image quota/billing limit hit (free tier often has limit 0 for image models). Enable billing in Google AI Studio or wait and retry.`
  }

  if (
    status === 403
    || (status === 400 && (detail.includes('billing') || detail.includes('permission') || detail.includes('not enabled')))
  ) {
    return `${base} Gemini image generation may require billing or the model may not be enabled for this API key.`
  }

  if (isImagenModel(model)) {
    return `${base} Imagen is shut down on the Gemini Developer API. Use OPENAI_IMAGE_MODEL=${DEFAULT_GEMINI_IMAGE_MODEL} (or gemini-3.1-flash-image).`
  }

  return `${base} Gemini native image generation uses generateContent (not OpenAI /images/generations).`
}

/**
 * Gemini native image generation via models/{model}:generateContent.
 * Returns { b64, mimeType, text, model }.
 */
async function requestGeminiImageGeneration({
  apiKey,
  model,
  size,
  prompt
}) {
  const resolvedModel = resolveGeminiImageModel(model)
  const imageConfig = sizeToGeminiImageConfig(size)
  const url = `${GEMINI_NATIVE_ROOT}/models/${encodeURIComponent(resolvedModel)}:generateContent`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000)

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })

    const raw = await response.text()
    let payload = {}

    try {
      payload = raw ? JSON.parse(raw) : {}
    } catch {
      payload = {}
    }

    if (!response.ok) {
      // Retry once without imageConfig for older image models that reject it.
      if (response.status === 400) {
        const retryBody = {
          contents: body.contents,
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        }

        const retry = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(retryBody),
          signal: controller.signal
        })

        const retryRaw = await retry.text()
        let retryPayload = {}

        try {
          retryPayload = retryRaw ? JSON.parse(retryRaw) : {}
        } catch {
          retryPayload = {}
        }

        if (!retry.ok) {
          const error = new Error(geminiFriendlyError(resolvedModel, retry.status, retryPayload))
          error.status = retry.status
          error.payload = retryPayload
          throw error
        }

        payload = retryPayload
      } else {
        const error = new Error(geminiFriendlyError(resolvedModel, response.status, payload))
        error.status = response.status
        error.payload = payload
        throw error
      }
    }

    const parts = payload?.candidates?.[0]?.content?.parts
    if (!Array.isArray(parts) || parts.length === 0) {
      const blockReason = asString(
        payload?.promptFeedback?.blockReason
          || payload?.candidates?.[0]?.finishReason
      )
      throw new Error(
        blockReason
          ? `Gemini returned no image (finish/block: ${blockReason}). Try a different prompt.`
          : 'Gemini returned no image parts. Try OPENAI_IMAGE_MODEL=gemini-2.5-flash-image or gemini-3.1-flash-image.'
      )
    }

    let b64 = ''
    let mimeType = 'image/png'
    let text = ''

    for (const part of parts) {
      if (part?.text) {
        text += String(part.text)
      }
      const inline = part?.inlineData || part?.inline_data
      if (inline?.data) {
        b64 = inline.data
        mimeType = asString(inline.mimeType || inline.mime_type) || 'image/png'
      }
    }

    if (!b64) {
      throw new Error(
        text
          ? `Gemini responded with text only (no image bytes): ${text.slice(0, 240)}`
          : 'Gemini response contained no inline image data.'
      )
    }

    return {
      b64,
      mimeType,
      text,
      model: resolvedModel
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function requestOpenAiImageGeneration({
  apiKey,
  apiBase,
  model,
  size,
  prompt
}) {
  const base = asString(apiBase) || DEFAULT_BASE
  const url = `${base.replace(/\/$/, '')}/images/generations`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90000)

  const body = {
    model,
    prompt,
    n: 1,
    size: size || DEFAULT_IMAGE_SIZE,
    response_format: 'b64_json'
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })

    const raw = await response.text()
    let payload = {}

    try {
      payload = raw ? JSON.parse(raw) : {}
    } catch {
      payload = {}
    }

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        if (isGeminiBase(apiBase)) {
          const error = new Error(
            `${imageModelError(model, response.status, payload)} Gemini OpenAI-compatible base does not support /images/generations. The server should auto-route to Gemini native image models when IMAGE_PROVIDER=gemini or OPENAI_API_BASE points at generativelanguage.googleapis.com.`
          )
          error.status = response.status
          error.payload = payload
          throw error
        }

        const retryBody = {
          model,
          prompt,
          n: 1
        }

        if (size) {
          retryBody.size = size
        }

        const retry = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(retryBody),
          signal: controller.signal
        })

        const retryRaw = await retry.text()
        let retryPayload = {}

        try {
          retryPayload = retryRaw ? JSON.parse(retryRaw) : {}
        } catch {
          retryPayload = {}
        }

        if (!retry.ok) {
          const error = new Error(imageModelError(model, retry.status, retryPayload))
          error.status = retry.status
          error.payload = retryPayload
          throw error
        }

        return retryPayload
      }

      const error = new Error(imageModelError(model, response.status, payload))
      error.status = response.status
      error.payload = payload
      throw error
    }

    return payload
  } finally {
    clearTimeout(timeout)
  }
}

export async function generateStoryImage({
  story = {},
  apiKey = '',
  apiBase = '',
  model = DEFAULT_IMAGE_MODEL,
  size = DEFAULT_IMAGE_SIZE,
  prompt: promptOverride = '',
  imageProvider = '',
  geminiApiKey = ''
}) {
  const prompt = asString(promptOverride) || buildImagePrompt(story)
  const storyId = asString(story.id) || 'story'
  const resolvedSize = asString(size) || DEFAULT_IMAGE_SIZE
  const key = asString(apiKey) || asString(geminiApiKey)
  const provider = resolveImageProvider({
    imageProvider,
    apiBase,
    geminiApiKey
  })

  if (!key) {
    throw new Error('OPENAI_API_KEY (or GEMINI_API_KEY) is not configured on the server.')
  }

  if (!asString(story.title) && !asString(story.brief || story.excerpt)) {
    throw new Error('A story title or description is required to generate an image.')
  }

  if (provider === 'gemini') {
    const gemini = await requestGeminiImageGeneration({
      apiKey: key,
      model,
      size: resolvedSize,
      prompt
    })

    const saved = await saveBase64Image(gemini.b64, storyId, gemini.mimeType)

    return {
      storyId,
      prompt,
      revisedPrompt: asString(gemini.text),
      model: gemini.model,
      size: resolvedSize,
      path: saved.path,
      url: saved.path,
      provider: 'gemini',
      generatedAt: new Date().toISOString()
    }
  }

  const resolvedModel = asString(model) || DEFAULT_IMAGE_MODEL
  const payload = await requestOpenAiImageGeneration({
    apiKey: key,
    apiBase,
    model: resolvedModel,
    size: resolvedSize,
    prompt
  })

  const item = Array.isArray(payload?.data) ? payload.data[0] : null

  if (!item) {
    throw new Error('Image API returned no image data.')
  }

  let saved = null

  if (item.b64_json) {
    saved = await saveBase64Image(item.b64_json, storyId)
  } else if (item.url) {
    saved = await downloadAndSave(item.url, storyId)
  } else {
    throw new Error('Image API returned neither b64_json nor url.')
  }

  return {
    storyId,
    prompt,
    revisedPrompt: asString(item.revised_prompt),
    model: resolvedModel,
    size: resolvedSize,
    path: saved.path,
    url: saved.path,
    provider: 'openai',
    generatedAt: new Date().toISOString()
  }
}

export const IMAGE_DEFAULTS = {
  model: DEFAULT_IMAGE_MODEL,
  geminiModel: DEFAULT_GEMINI_IMAGE_MODEL,
  size: DEFAULT_IMAGE_SIZE,
  base: DEFAULT_BASE
}
