<script setup lang="ts">
const auth = useAuthStore()
const data = useDataStore()
const router = useRouter()

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { to: '/orders', label: 'Orders', icon: 'M3 6h18M3 12h18M3 18h12' },
  { to: '/inventory', label: 'Inventory', icon: 'M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
  { to: '/customers', label: 'Customers', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9' },
  { to: '/returns', label: 'Returns', icon: 'M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8' },
  { to: '/insights', label: 'Insights', icon: 'M3 3v18h18M7 14l4-4 4 4 5-6' },
]

onMounted(() => data.load())

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950">
    <!-- Desktop sidebar -->
    <aside
      class="hidden border-r border-slate-200 bg-white px-3 py-5 dark:border-slate-800 dark:bg-slate-900 lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col"
    >
      <div class="mb-7 flex items-center gap-2.5 px-2">
        <div class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-extrabold text-white">M</div>
        <div class="leading-tight">
          <p class="text-sm font-bold">Control Tower</p>
          <p class="text-[11px] text-slate-400">Merchant Ops</p>
        </div>
      </div>
      <nav class="flex flex-col gap-1">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          active-class="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path :d="item.icon" />
          </svg>
          {{ item.label }}
        </NuxtLink>
      </nav>
      <p class="mt-auto px-2 text-[11px] text-slate-400">Synthetic demo data only.</p>
    </aside>

    <div class="lg:pl-60">
      <!-- Top bar -->
      <header
        class="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 sm:px-6"
      >
        <div class="flex items-center gap-2 lg:hidden">
          <div class="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-xs font-extrabold text-white">M</div>
          <span class="text-sm font-bold">Control Tower</span>
        </div>
        <p class="hidden text-sm font-semibold text-slate-500 dark:text-slate-400 lg:block">
          E-commerce Operations Analytics Console
        </p>
        <div class="flex items-center gap-2">
          <ThemeToggle />
          <span class="hidden text-sm font-medium text-slate-600 dark:text-slate-300 sm:block">{{ auth.user?.name }}</span>
          <button type="button" class="btn btn-ghost !px-3 !py-2" @click="logout">Log out</button>
        </div>
      </header>

      <!-- Mobile nav -->
      <nav class="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          active-class="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
          class="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
