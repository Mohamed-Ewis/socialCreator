import { PLACEHOLDER_NEWS } from '~/data/placeholderNews'
import { RAW_PROVIDER_SAMPLES } from '~/data/rawProviderSamples'
import { normalizeNewsResponse } from '~/utils/normalizeNews'

export const MOCK_NEWS = normalizeNewsResponse([
  ...PLACEHOLDER_NEWS,
  ...RAW_PROVIDER_SAMPLES.articles
])
