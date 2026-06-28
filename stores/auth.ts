import { defineStore } from 'pinia'

interface User {
  email: string
  name: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as User | null,
  }),
  getters: {
    isAuthed: (s) => !!s.token,
  },
  actions: {
    demoAuthDisabled() {
      const config = useRuntimeConfig()
      return config.public.demoAuthDisabled === true || config.public.demoAuthDisabled === 'true'
    },
    useDemoSession() {
      this.token = 'demo-session-token'
      this.user = { email: 'demo@example.com', name: 'Demo Merchant' }
    },
    init() {
      if (this.demoAuthDisabled()) {
        this.useDemoSession()
        return
      }
      if (!import.meta.client) return
      const raw = localStorage.getItem('mct-auth')
      if (!raw) return
      try {
        const parsed = JSON.parse(raw)
        this.token = parsed.token
        this.user = parsed.user
      } catch {
        /* ignore */
      }
    },
    async login(email: string, password: string) {
      const res = await $fetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      this.token = res.token
      this.user = res.user
      if (import.meta.client) localStorage.setItem('mct-auth', JSON.stringify(res))
    },
    logout() {
      if (this.demoAuthDisabled()) {
        this.useDemoSession()
        return
      }
      this.token = null
      this.user = null
      if (import.meta.client) localStorage.removeItem('mct-auth')
    },
  },
})
