export default defineNuxtRouteMiddleware((to) => {
  // Auth lives in localStorage; only enforce on the client to avoid SSR redirects.
  if (import.meta.server) return
  const auth = useAuthStore()
  if (to.path === '/') return navigateTo(auth.isAuthed ? '/dashboard' : '/login')
  if (!auth.isAuthed && to.path !== '/login') return navigateTo('/login')
  if (auth.isAuthed && to.path === '/login') return navigateTo('/dashboard')
})
