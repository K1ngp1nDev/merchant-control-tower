<script setup lang="ts">
const auth = useAuthStore()
await navigateTo(auth.isAuthed ? '/dashboard' : '/login')
</script>

<template>
  <div />
</template>
