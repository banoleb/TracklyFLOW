export default defineNuxtConfig({
  devtools: { enabled: false },
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:5000'
    }
  },
  app: {
    head: {
      title: 'Notes – TracklyFLOW',
      meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },
  css: ['~/assets/main.css']
})
