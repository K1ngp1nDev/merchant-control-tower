<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="card p-5">
    <div class="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-slate-400">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </div>
</template>
