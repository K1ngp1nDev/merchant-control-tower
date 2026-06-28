<script setup lang="ts">
const props = defineProps<{ open: boolean; title?: string; subtitle?: string }>()
const emit = defineEmits<{ close: [] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
watch(
  () => props.open,
  (v) => {
    if (import.meta.client) document.body.style.overflow = v ? 'hidden' : ''
  },
)
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />
    </Transition>
    <Transition name="slide">
      <aside
        v-if="open"
        class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
      >
        <header class="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div class="min-w-0">
            <h2 class="truncate text-base font-semibold">{{ title }}</h2>
            <p v-if="subtitle" class="truncate text-xs text-slate-400">{{ subtitle }}</p>
          </div>
          <button class="btn btn-ghost !px-2 !py-1 text-lg leading-none" aria-label="Close" @click="emit('close')">✕</button>
        </header>
        <div class="flex-1 overflow-y-auto p-5">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="border-t border-slate-200 p-4 dark:border-slate-800">
          <slot name="footer" />
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
