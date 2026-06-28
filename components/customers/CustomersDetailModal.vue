<script setup lang="ts">
import type { CustomerDTO } from '~/types'

const props = defineProps<{ open: boolean; customer: CustomerDTO | null }>()
const emit = defineEmits<{ close: [] }>()

const data = useDataStore()

const orderHistory = computed(() => {
  if (!props.customer) return []
  return data.orders
    .filter((o) => o.customerId === props.customer!.id)
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
})

// Local "Risk / opportunity" classification.
const risk = computed(() => {
  const c = props.customer
  if (!c) return { label: 'Healthy', severity: 'low' as const }
  if (c.segment === 'At-risk' || c.returnRate > 20) return { label: 'Retention risk', severity: 'high' as const }
  if (c.segment === 'VIP' || c.totalSpentCents >= 200000) return { label: 'Growth opportunity', severity: 'low' as const }
  return { label: 'Healthy', severity: 'low' as const }
})
</script>

<template>
  <Modal :open="open" :title="customer?.name ?? ''" :subtitle="customer?.email" @close="emit('close')">
    <div v-if="customer" class="space-y-5">
      <!-- Segment + risk -->
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge :value="customer.segment" kind="segment" />
        <StatusBadge :value="risk.label" kind="severity" />
        <span class="text-xs text-slate-400">{{ customer.location }}</span>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
          <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">Orders</p>
          <p class="mt-0.5 text-lg font-bold tabular-nums">{{ formatNumber(customer.ordersCount) }}</p>
        </div>
        <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
          <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total spent</p>
          <p class="mt-0.5 text-lg font-bold tabular-nums">{{ formatMoney(customer.totalSpentCents) }}</p>
        </div>
        <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
          <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">Return rate</p>
          <p class="mt-0.5 text-lg font-bold tabular-nums">{{ formatPct(customer.returnRate) }}</p>
        </div>
        <div class="min-w-0 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
          <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">Pref. channel</p>
          <p class="mt-0.5 truncate text-lg font-bold">{{ customer.preferredChannel ?? '—' }}</p>
        </div>
      </div>

      <!-- Note -->
      <div v-if="customer.note" class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
        {{ customer.note }}
      </div>

      <!-- Top products -->
      <div v-if="customer.topProducts.length">
        <h3 class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Top products</h3>
        <div class="space-y-2">
          <div
            v-for="p in customer.topProducts"
            :key="p.name"
            class="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
          >
            <span class="min-w-0 truncate text-sm font-medium">{{ p.name }}</span>
            <span class="shrink-0 text-sm tabular-nums text-slate-500 dark:text-slate-400">×{{ p.quantity }}</span>
          </div>
        </div>
      </div>

      <!-- Order history -->
      <div>
        <h3 class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Order history</h3>
        <div v-if="orderHistory.length" class="space-y-2">
          <div
            v-for="o in orderHistory"
            :key="o.id"
            class="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ o.number }}</p>
              <p class="text-xs text-slate-400">{{ formatDate(o.placedAt) }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <StatusBadge :value="o.status" kind="status" />
              <span class="text-sm tabular-nums">{{ formatMoney(o.totalCents) }}</span>
            </div>
          </div>
        </div>
        <p v-else class="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-400 dark:bg-slate-800/50">
          No orders on record.
        </p>
      </div>

      <p class="pt-1 text-center text-xs text-slate-400">Demo profile · synthetic data</p>
    </div>
  </Modal>
</template>
