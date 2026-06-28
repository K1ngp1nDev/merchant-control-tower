import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({ isDark: false }),
  actions: {
    apply() {
      if (import.meta.client) document.documentElement.classList.toggle('dark', this.isDark)
    },
    init() {
      if (!import.meta.client) return
      const stored = localStorage.getItem('mct-theme')
      this.isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
      this.apply()
    },
    toggle() {
      this.isDark = !this.isDark
      if (import.meta.client) localStorage.setItem('mct-theme', this.isDark ? 'dark' : 'light')
      this.apply()
    },
  },
})
