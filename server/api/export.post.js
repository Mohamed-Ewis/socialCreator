const REGION_IDS = ['middle-east', 'world']

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const region = body?.region
  const videos = body?.videos

  if (!REGION_IDS.includes(region) || !Array.isArray(videos)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Export payload needs a valid region and videos array.'
    })
  }

  return {
    implemented: true,
    payload: {
      ...body,
      exportedAt: body?.exportedAt || new Date().toISOString()
    }
  }
})
