<script setup lang="ts">
import type { ProductDTO } from '~/types'

const props = defineProps<{ open: boolean; product: ProductDTO | null }>()
const emit = defineEmits<{ close: [] }>()

const placed = ref(false)

const recommendedQty = computed(() =>
  props.product ? Math.max(props.product.reorderThreshold * 2 - props.product.stock, props.product.reorderThreshold) : 0,
)
const estCostCents = computed(() => (props.product ? recommendedQty.value * props.product.costCents : 0))

watch(
  () => props.open,
  (v) => {
    if (v) placed.value = false
  },
)

function createPo() {
  placed.value = true
}
</script>

<template>
  <Modal :open="open" title="Reorder stock" :subtitle="product ? `${product.sku} · ${product.name}` : ''" @close="emit('close')">
    <div v-if="product && !placed" class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-slate-500 dark:text-slate-400">On hand</span>
        <span class="text-sm font-semibold tabular-nums">{{ formatNumber(product.stock) }}</span>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-slate-500 dark:text-slate-400">Reorder threshold</span>
        <span class="text-sm font-semibold tabular-nums">{{ formatNumber(product.reorderThreshold) }}</span>
      </div>
      <div class="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <span class="text-sm text-slate-500 dark:text-slate-400">Recommended order qty</span>
        <span class="text-base font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{{ formatNumber(recommendedQty) }}</span>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-slate-500 dark:text-slate-400">Estimated reorder cost</span>
        <span class="text-base font-bold tabular-nums">{{ formatMoney(estCostCents) }}</span>
      </div>
      <p class="text-xs text-slate-400">{{ formatNumber(recommendedQty) }} units × {{ formatMoney(product.costCents) }} unit cost · demo estimate</p>
    </div>

    <div v-else-if="product && placed" class="space-y-2 py-4 text-center">
      <p class="text-2xl">✓</p>
      <p class="text-sm font-semibold">Purchase order created</p>
      <p class="text-xs text-slate-400">
        {{ formatNumber(recommendedQty) }} units of {{ product.sku }} for {{ formatMoney(estCostCents) }} · demo only, no data changed.
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <button class="btn btn-ghost" @click="emit('close')">{{ placed ? 'Close' : 'Cancel' }}</button>
        <button v-if="!placed" class="btn btn-primary" @click="createPo">Create purchase order</button>
      </div>
    </template>
  </Modal>
</template>
