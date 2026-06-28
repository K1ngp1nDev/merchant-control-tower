<script setup lang="ts">
import type { ProductDTO } from '~/types'

const props = defineProps<{ open: boolean; product: ProductDTO | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const data = useDataStore()
const next = ref(0)

watch(
  () => props.open,
  (v) => {
    if (v && props.product) next.value = props.product.stock
  },
  { immediate: true },
)

const delta = computed(() => (props.product ? next.value - props.product.stock : 0))

function step(by: number) {
  next.value = Math.max(0, (Number(next.value) || 0) + by)
}
function clamp() {
  next.value = Math.max(0, Math.floor(Number(next.value) || 0))
}
function save() {
  if (!props.product) return
  clamp()
  data.adjustStock(props.product.id, next.value)
  emit('saved')
  emit('close')
}
</script>

<template>
  <Modal :open="open" title="Adjust stock" :subtitle="product ? `${product.sku} · ${product.name}` : ''" @close="emit('close')">
    <div v-if="product" class="space-y-5">
      <div class="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
        <span class="text-sm text-slate-500 dark:text-slate-400">Current on hand</span>
        <span class="text-sm font-semibold tabular-nums">{{ formatNumber(product.stock) }}</span>
      </div>

      <div>
        <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">New stock level</span>
        <div class="mt-1 flex items-stretch gap-2">
          <button class="btn btn-outline !px-3 text-lg leading-none" aria-label="Decrease" @click="step(-1)">−</button>
          <input v-model.number="next" type="number" min="0" class="field flex-1 text-center text-base font-semibold tabular-nums" @change="clamp" />
          <button class="btn btn-outline !px-3 text-lg leading-none" aria-label="Increase" @click="step(1)">+</button>
        </div>
        <div class="mt-2 flex flex-wrap gap-2">
          <button class="chip bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" @click="step(-10)">−10</button>
          <button class="chip bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" @click="step(-5)">−5</button>
          <button class="chip bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" @click="step(5)">+5</button>
          <button class="chip bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" @click="step(10)">+10</button>
        </div>
      </div>

      <p v-if="delta !== 0" class="text-xs" :class="delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
        {{ delta > 0 ? '+' : '' }}{{ formatNumber(delta) }} vs current · reorder threshold {{ formatNumber(product.reorderThreshold) }}
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
        <button class="btn btn-primary" :disabled="delta === 0" @click="save">Save</button>
      </div>
    </template>
  </Modal>
</template>
