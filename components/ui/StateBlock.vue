<script setup lang="ts">
defineProps<{
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyText?: string
}>()
</script>

<template>
  <div v-if="loading" class="grid place-items-center py-20 text-slate-400">
    <span class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
  </div>
  <div v-else-if="error" class="card p-6 text-center text-rose-600 dark:text-rose-300">{{ error }}</div>
  <div v-else-if="empty" class="card p-10 text-center text-sm text-slate-400">{{ emptyText || 'Nothing to show.' }}</div>
  <slot v-else />
</template>
