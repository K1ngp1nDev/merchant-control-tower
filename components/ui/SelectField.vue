<script setup lang="ts">
defineProps<{ label?: string }>()
const model = defineModel<string>()
</script>

<template>
  <label class="flex min-w-0 flex-col gap-1">
    <span v-if="label" class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{{ label }}</span>
    <select v-model="model" class="field">
      <slot />
    </select>
  </label>
</template>
