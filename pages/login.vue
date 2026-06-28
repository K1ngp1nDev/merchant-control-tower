<script setup lang="ts">
definePageMeta({ layout: false })

const auth = useAuthStore()
const router = useRouter()
const email = ref('demo@example.com')
const password = ref('demo12345')
const loading = ref(false)
const error = ref<string | null>(null)

async function submit() {
  loading.value = true
  error.value = null
  try {
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch {
    error.value = 'Invalid credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative grid min-h-screen place-items-center overflow-hidden bg-slate-100 px-4 dark:bg-slate-950">
    <div class="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
    <div class="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />

    <div class="absolute right-4 top-4"><ThemeToggle /></div>

    <div class="card relative w-full max-w-md p-8">
      <div class="mb-6 flex items-center gap-3">
        <div class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-lg font-extrabold text-white">M</div>
        <div>
          <h1 class="text-lg font-bold leading-tight">Merchant Control Tower</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">E-commerce operations analytics console</p>
        </div>
      </div>

      <p class="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Sign in to the operations workspace. Synthetic demo — no real customer data.
      </p>

      <form class="space-y-4" @submit.prevent="submit">
        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Email</span>
          <input v-model="email" class="field" type="email" autocomplete="username" required />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Password</span>
          <input v-model="password" class="field" type="password" autocomplete="current-password" required />
        </label>

        <p v-if="error" class="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
          {{ error }}
        </p>

        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <div class="mt-5 rounded-xl border border-dashed border-slate-300 p-3 text-sm dark:border-slate-700">
        <div class="mb-1 flex items-center justify-between">
          <span class="font-semibold text-slate-600 dark:text-slate-300">Demo account</span>
          <button
            type="button"
            class="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            @click="email = 'demo@example.com'; password = 'demo12345'"
          >
            Autofill
          </button>
        </div>
        <p class="font-mono text-xs text-slate-500 dark:text-slate-400">demo&#64;example.com</p>
        <p class="font-mono text-xs text-slate-500 dark:text-slate-400">demo12345</p>
      </div>
    </div>
  </div>
</template>
