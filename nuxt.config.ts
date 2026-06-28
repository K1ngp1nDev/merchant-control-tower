// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  components: [{ path: '~/components', pathPrefix: false }],
  pinia: { storesDirs: ['./stores/**'] },
  runtimeConfig: {
    public: {
      demoAuthDisabled: process.env.DEMO_AUTH_DISABLED === 'true',
    },
  },
  app: {
    head: {
      title: 'Merchant Control Tower',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'E-commerce operations analytics console — orders, inventory, revenue, fulfillment & returns (synthetic demo).',
        },
      ],
    },
  },
})
