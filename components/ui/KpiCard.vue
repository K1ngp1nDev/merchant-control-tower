<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string | number
    sub?: string
    accent?: string
    tone?: 'up' | 'down' | null
    clickable?: boolean
  }>(),
  { accent: '', tone: null, clickable: false },
)
</script>

<template>
  <component
    :is="clickable ? 'button' : 'div'"
    class="card w-full p-4 text-left"
    :class="clickable ? 'transition hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-500/50' : ''"
  >
    <p class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ label }}</p>
    <p class="mt-1 text-2xl font-bold tabular-nums" :class="accent">{{ value }}</p>
    <p v-if="sub" class="mt-0.5 text-xs" :class="tone === 'down' ? 'text-rose-500' : tone === 'up' ? 'text-emerald-500' : 'text-slate-400'">
      {{ sub }}
    </p>
  </component>
</template>
