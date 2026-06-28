<script setup lang="ts">
import type { OrderDTO, OrderStatus } from '~/types'

const props = defineProps<{ open: boolean; order: OrderDTO | null }>()
const emit = defineEmits<{ close: [] }>()

const data = useDataStore()

const noteDraft = ref('')

// Keep the note textarea in sync with whichever order is shown.
watch(
  () => props.order?.id,
  () => {
    noteDraft.value = props.order?.note ?? ''
  },
  { immediate: true },
)

const relatedReturn = computed(() =>
  props.order ? data.returns.find((r) => r.orderId === props.order!.id) ?? null : null,
)

function onStatusChange(e: Event) {
  if (!props.order) return
  data.setOrderStatus(props.order.id, (e.target as HTMLSelectElement).value as OrderStatus)
}

function saveNote() {
  if (!props.order) return
  data.addOrderNote(props.order.id, noteDraft.value.trim())
}
</script>

<template>
  <Drawer
    :open="open"
    :title="order ? order.number : 'Order'"
    :subtitle="order ? `${order.customerName} · ${order.channel}` : ''"
    @close="emit('close')"
  >
    <div v-if="order" class="space-y-6">
      <!-- Customer + badges -->
      <section class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <StatusBadge :value="order.status" kind="status" />
          <StatusBadge :value="order.paymentStatus" kind="payment" />
          <StatusBadge :value="order.segment" kind="segment" />
          <span v-if="order.late" class="chip bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">Late</span>
          <span v-if="order.priority" class="chip bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">Priority</span>
        </div>
        <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
          <p class="text-sm font-medium">{{ order.customerName }}</p>
          <p class="text-xs text-slate-400">{{ order.segment }} · {{ order.channel }}</p>
        </div>
      </section>

      <!-- Items -->
      <section class="space-y-2">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Items</h3>
        <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table class="w-full min-w-[22rem]">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-800">
                <th class="th">Product</th>
                <th class="th text-right">Qty</th>
                <th class="th text-right">Unit</th>
                <th class="th text-right">Line</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in order.items" :key="it.id" class="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                <td class="td min-w-0">
                  <p class="truncate font-medium">{{ it.name }}</p>
                  <p class="truncate text-xs text-slate-400">{{ it.sku }}</p>
                </td>
                <td class="td text-right tabular-nums">{{ it.quantity }}</td>
                <td class="td text-right tabular-nums">{{ formatMoney(it.unitPriceCents) }}</td>
                <td class="td text-right tabular-nums">{{ formatMoney(it.lineTotalCents) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Totals -->
      <section class="space-y-1 rounded-lg bg-slate-50 px-3 py-3 text-sm dark:bg-slate-800/50">
        <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Subtotal</span><span class="tabular-nums">{{ formatMoney(order.subtotalCents) }}</span></div>
        <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Shipping</span><span class="tabular-nums">{{ formatMoney(order.shippingCents) }}</span></div>
        <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Discount</span><span class="tabular-nums">−{{ formatMoney(order.discountCents) }}</span></div>
        <div class="mt-1 flex justify-between border-t border-slate-200 pt-2 font-semibold dark:border-slate-700"><span>Total</span><span class="tabular-nums">{{ formatMoney(order.totalCents) }}</span></div>
      </section>

      <!-- Timeline -->
      <section class="space-y-2">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Fulfillment timeline</h3>
        <ol class="space-y-2 text-sm">
          <li class="flex items-center justify-between gap-2">
            <span class="text-slate-500 dark:text-slate-400">Placed</span>
            <span class="tabular-nums">{{ formatDateTime(order.placedAt) }}</span>
          </li>
          <li class="flex items-center justify-between gap-2">
            <span class="text-slate-500 dark:text-slate-400">SLA due</span>
            <span class="tabular-nums">{{ formatDateTime(order.slaDueAt) }}</span>
          </li>
          <li class="flex items-center justify-between gap-2">
            <span class="text-slate-500 dark:text-slate-400">Shipped</span>
            <span class="tabular-nums" :class="order.shippedAt ? '' : 'text-amber-600 dark:text-amber-400'">{{ order.shippedAt ? formatDateTime(order.shippedAt) : 'Pending' }}</span>
          </li>
        </ol>
        <p
          class="text-xs font-medium"
          :class="order.late ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'"
        >
          {{ order.late ? 'Late against SLA' : 'On-time against SLA' }}
        </p>
      </section>

      <!-- Related return -->
      <section v-if="relatedReturn" class="space-y-2 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-3 dark:border-rose-500/30 dark:bg-rose-500/10">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-rose-500 dark:text-rose-300">Return on file</h3>
          <StatusBadge :value="relatedReturn.status" kind="return" />
        </div>
        <div class="flex items-center justify-between gap-2 text-sm">
          <span class="min-w-0 truncate">{{ relatedReturn.reason }}</span>
          <span class="tabular-nums">{{ formatMoney(relatedReturn.amountCents) }}</span>
        </div>
      </section>

      <!-- Demo actions -->
      <section class="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Demo actions</p>

        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</span>
          <select class="field" :value="order.status" @change="onStatusChange">
            <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Internal note</span>
          <textarea v-model="noteDraft" rows="3" class="field resize-none" placeholder="Add a note…" />
        </label>
        <div class="flex flex-wrap gap-2">
          <button class="btn btn-primary" @click="saveNote">Save note</button>
          <button class="btn btn-outline" @click="data.togglePriority(order.id)">
            {{ order.priority ? 'Remove priority' : 'Toggle priority' }}
          </button>
        </div>
      </section>

      <p class="pt-1 text-center text-xs text-slate-400">Demo action · synthetic data</p>
    </div>
  </Drawer>
</template>
