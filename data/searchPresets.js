export const SEARCH_PRESETS = {
  'middle-east': [
    { id: 'me-all', label: 'Middle East', query: '', filters: { country: 'all', region: 'all', category: 'all' } },
    { id: 'me-egypt', label: 'Egypt', query: 'Egypt', filters: { country: 'Egypt', region: 'all', category: 'all' } },
    { id: 'me-saudi', label: 'Saudi Arabia', query: 'Saudi', filters: { country: 'Saudi Arabia', region: 'all', category: 'all' } },
    { id: 'me-iran', label: 'Iran', query: 'Iran', filters: { country: 'Iran', region: 'all', category: 'all' } },
    { id: 'me-palestine', label: 'Palestine', query: 'Palestine', filters: { country: 'Palestine', region: 'all', category: 'all' } },
    { id: 'me-israel', label: 'Israel', query: 'Israel', filters: { country: 'Israel', region: 'all', category: 'all' } },
    { id: 'me-yemen', label: 'Yemen', query: 'Yemen', filters: { country: 'Yemen', region: 'all', category: 'all' } },
    { id: 'me-gulf', label: 'Gulf', query: 'Gulf', filters: { country: 'all', region: 'Gulf', category: 'all' } },
    { id: 'me-energy', label: 'Oil & Energy', query: 'oil energy OPEC', filters: { country: 'all', region: 'all', category: 'economy-political' } }
  ],
  world: [
    { id: 'world-all', label: 'World', query: '', filters: { country: 'all', region: 'all', category: 'all' } },
    { id: 'world-politics', label: 'Politics', query: 'politics', filters: { category: 'economy-political', country: 'all', region: 'all' } },
    { id: 'world-economy', label: 'Economy', query: 'economy markets', filters: { category: 'economy-political', country: 'all', region: 'all' } },
    { id: 'world-tech', label: 'Technology', query: 'technology', filters: { category: 'trend', country: 'all', region: 'all' } },
    { id: 'world-ai', label: 'AI', query: 'AI', filters: { category: 'trend', country: 'all', region: 'all' } },
    { id: 'world-science', label: 'Science', query: 'science', filters: { category: 'trend', country: 'all', region: 'all' } },
    { id: 'world-sports', label: 'Sports', query: '', filters: { category: 'sports', country: 'all', region: 'all' } },
    { id: 'world-trending', label: 'Trending', query: '', filters: { category: 'trend', country: 'all', region: 'all' } }
  ]
}
