export default defineNuxtRouteMiddleware((to) => {
  // Auth lives in localStorage; only enforce on the client to avoid SSR redirects.
  if (import.meta.server) return
  const config = useRuntimeConfig()
  const demoAuthDisabled =
    config.public.demoAuthDisabled === true || config.public.demoAuthDisabled === 'true'
  if (demoAuthDisabled) {
    if (to.path === '/' || to.path === '/login') return navigateTo('/dashboard')
    return
  }
  const auth = useAuthStore()
  if (to.path === '/') return navigateTo(auth.isAuthed ? '/dashboard' : '/login')
  if (!auth.isAuthed && to.path !== '/login') return navigateTo('/login')
  if (auth.isAuthed && to.path === '/login') return navigateTo('/dashboard')
})
