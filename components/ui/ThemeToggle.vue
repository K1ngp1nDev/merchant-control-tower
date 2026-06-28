<script setup lang="ts">
const theme = useThemeStore()
</script>

<template>
  <button
    type="button"
    class="btn btn-outline !px-2.5 !py-2"
    :aria-label="theme.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    @click="theme.toggle()"
  >
    <span class="text-base leading-none">{{ theme.isDark ? '☀︎' : '☾' }}</span>
  </button>
</template>
