<script setup lang="ts">
const auth = useAuthStore()
const config = useRuntimeConfig()
const demoAuthDisabled =
  config.public.demoAuthDisabled === true || config.public.demoAuthDisabled === 'true'
await navigateTo(demoAuthDisabled || auth.isAuthed ? '/dashboard' : '/login')
</script>

<template>
  <div />
</template>
