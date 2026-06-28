export default defineNuxtPlugin(() => {
  useAuthStore().init()
  useThemeStore().init()
})
