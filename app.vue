<template>
  <ClientOnly>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <template #fallback>
      <div class="grid min-h-screen place-items-center bg-slate-100 text-slate-400 dark:bg-slate-950">Loading…</div>
    </template>
  </ClientOnly>
</template>
