export default defineNuxtConfig({
  compatibilityDate: '2026-09-19',
  devtools: { enabled: true },
  ssr: true,
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js'
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  pinia: {
    storesDirs: ['./stores/**']
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'News Research',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Internal dashboard for collecting Economy, Sports, and Trends stories for Middle East and World videos.'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap'
        }
      ]
    }
  },
  runtimeConfig: {
    // Server-only. Mapped from THE_NEWS_API_KEY / NUXT_THE_NEWS_API_KEY.
    theNewsApiKey: '',
    // Optional alias from NEWS_API_KEY.
    newsApiKey: '',
    // Server-only. Mapped from OPENAI_API_KEY / NUXT_OPENAI_API_KEY.
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiApiBase: process.env.OPENAI_API_BASE || '',
    openaiModel: process.env.OPENAI_MODEL || '',
    public: {
      appName: 'News Research'
    }
  }
})

