<script setup lang="ts">
withDefaults(defineProps<{ placeholder?: string }>(), { placeholder: 'Search…' })
const model = defineModel<string>()
</script>

<template>
  <div class="relative w-full">
    <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
    <input v-model="model" class="field pl-9" :placeholder="placeholder" type="search" />
  </div>
</template>
