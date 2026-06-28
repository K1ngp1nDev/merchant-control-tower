<script setup lang="ts">
import type { ReturnDTO, OrderDTO } from '~/types'

const props = defineProps<{ open: boolean; ret: ReturnDTO | null }>()
const emit = defineEmits<{ close: [] }>()

const data = useDataStore()

const order = computed<OrderDTO | null>(() =>
  props.ret ? data.orders.find((o) => o.id === props.ret!.orderId) ?? null : null,
)
</script>

<template>
  <Modal :open="open" :title="ret ? ret.orderNumber : 'Return'" :subtitle="ret?.productName" @close="emit('close')">
    <div v-if="ret" class="space-y-4">
      <!-- Return detail -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Order</p>
          <p class="truncate text-sm font-medium">{{ ret.orderNumber }}</p>
        </div>
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Channel</p>
          <p class="truncate text-sm font-medium">{{ ret.channel }}</p>
        </div>
        <div class="col-span-2 min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Product</p>
          <p class="truncate text-sm font-medium">{{ ret.productName }}</p>
        </div>
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Category</p>
          <p class="truncate text-sm font-medium">{{ ret.category }}</p>
        </div>
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Reason</p>
          <p class="truncate text-sm font-medium">{{ ret.reason }}</p>
        </div>
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Amount</p>
          <p class="text-sm font-semibold tabular-nums">{{ formatMoney(ret.amountCents) }}</p>
        </div>
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Requested</p>
          <p class="truncate text-sm font-medium">{{ formatDate(ret.requestedAt) }}</p>
        </div>
        <div class="col-span-2 min-w-0">
          <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
          <StatusBadge :value="ret.status" kind="return" />
        </div>
      </div>

      <!-- Linked order summary -->
      <div class="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
        <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Linked order</p>
        <div v-if="order" class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <span class="min-w-0 truncate text-sm text-slate-500 dark:text-slate-400">Customer</span>
            <span class="min-w-0 truncate text-sm font-medium">{{ order.customerName }}</span>
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-slate-500 dark:text-slate-400">Order total</span>
            <span class="text-sm font-semibold tabular-nums">{{ formatMoney(order.totalCents) }}</span>
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-slate-500 dark:text-slate-400">Order status</span>
            <StatusBadge :value="order.status" kind="status" />
          </div>
        </div>
        <p v-else class="text-sm text-slate-400">Linked order not found in current data.</p>
      </div>

      <p class="text-center text-xs text-slate-400">Demo return detail · synthetic data</p>
    </div>
  </Modal>
</template>
