<script setup lang="ts">
import type { OrderDTO, OrderStatus } from '~/types'

const data = useDataStore()

// --- local filter/search/sort/selection state (NOT data.filters) ---
const search = ref('')
const fStatus = ref<string>('all')
const fChannel = ref<string>('all')
const fPayment = ref<string>('all')
const fRisk = ref<string>('all')
const fRange = ref<string>('90d')
const sortBy = ref<string>('newest')

const selected = ref<Set<number>>(new Set())
const openOrder = ref<OrderDTO | null>(null)
const drawerOpen = ref(false)

const RANGE_DAYS: Record<string, number> = { '30d': 30, '90d': 90, '180d': 180, all: 100000 }

const filtered = computed<OrderDTO[]>(() => {
  const q = search.value.trim().toLowerCase()
  const start = Date.now() - RANGE_DAYS[fRange.value] * 86400000
  let list = data.orders.filter((o) => {
    if (new Date(o.placedAt).getTime() < start) return false
    if (fStatus.value !== 'all' && o.status !== fStatus.value) return false
    if (fChannel.value !== 'all' && o.channel !== fChannel.value) return false
    if (fPayment.value !== 'all' && o.paymentStatus !== fPayment.value) return false
    if (fRisk.value === 'late' && !o.late) return false
    if (fRisk.value === 'priority' && !o.priority) return false
    if (fRisk.value === 'on-track' && (o.late || o.priority)) return false
    if (q) {
      const hit =
        o.number.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
      if (!hit) return false
    }
    return true
  })

  list = [...list].sort((a, b) => {
    switch (sortBy.value) {
      case 'oldest':
        return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()
      case 'revenue':
        return b.totalCents - a.totalCents
      case 'risk': {
        const rank = (o: OrderDTO) => (o.late ? 2 : o.priority ? 1 : 0)
        return rank(b) - rank(a) || new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
      }
      default:
        return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    }
  })
  return list
})

const selectedCount = computed(() => selected.value.size)
const allVisibleSelected = computed(
  () => filtered.value.length > 0 && filtered.value.every((o) => selected.value.has(o.id)),
)

function toggleRow(id: number) {
  const next = new Set(selected.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selected.value = next
}
function toggleAll() {
  if (allVisibleSelected.value) {
    selected.value = new Set()
  } else {
    selected.value = new Set(filtered.value.map((o) => o.id))
  }
}
function clearSelection() {
  selected.value = new Set()
}

function openDrawer(o: OrderDTO) {
  openOrder.value = o
  drawerOpen.value = true
}

// --- bulk demo actions ---
function bulkStatus(status: OrderStatus) {
  for (const id of selected.value) data.setOrderStatus(id, status)
  clearSelection()
}
function bulkPriority() {
  for (const id of selected.value) data.togglePriority(id)
  clearSelection()
}

function resetFilters() {
  search.value = ''
  fStatus.value = 'all'
  fChannel.value = 'all'
  fPayment.value = 'all'
  fRisk.value = 'all'
  fRange.value = '90d'
  sortBy.value = 'newest'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold">Orders</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">Search, triage and act on orders across every channel.</p>
      </div>
      <button class="btn btn-outline" @click="resetFilters">Reset filters</button>
    </div>

    <!-- Toolbar -->
    <div class="card space-y-3 p-3">
      <SearchField v-model="search" placeholder="Search order #, customer, product or SKU…" />
      <div class="flex flex-wrap gap-3">
        <SelectField v-model="fStatus" label="Status" class="flex-1 sm:flex-none sm:w-36">
          <option value="all">All statuses</option>
          <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ s }}</option>
        </SelectField>
        <SelectField v-model="fChannel" label="Channel" class="flex-1 sm:flex-none sm:w-36">
          <option value="all">All channels</option>
          <option v-for="c in CHANNELS" :key="c" :value="c">{{ c }}</option>
        </SelectField>
        <SelectField v-model="fPayment" label="Payment" class="flex-1 sm:flex-none sm:w-40">
          <option value="all">All payments</option>
          <option v-for="p in PAYMENT_STATUSES" :key="p" :value="p">{{ p }}</option>
        </SelectField>
        <SelectField v-model="fRisk" label="Fulfillment risk" class="flex-1 sm:flex-none sm:w-36">
          <option value="all">All</option>
          <option value="late">Late</option>
          <option value="priority">Priority</option>
          <option value="on-track">On-track</option>
        </SelectField>
        <SelectField v-model="fRange" label="Range" class="flex-1 sm:flex-none sm:w-36">
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="180d">Last 180 days</option>
          <option value="all">All time</option>
        </SelectField>
        <SelectField v-model="sortBy" label="Sort by" class="flex-1 sm:flex-none sm:w-36">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="revenue">Revenue</option>
          <option value="risk">Risk</option>
        </SelectField>
      </div>
    </div>

    <StateBlock :loading="data.loading && !data.loaded" :error="data.error">
      <p class="text-sm text-slate-500 dark:text-slate-400">
        {{ formatNumber(filtered.length) }} of {{ formatNumber(data.orders.length) }} orders
      </p>

      <!-- Empty -->
      <div v-if="filtered.length === 0" class="card mt-3 p-10 text-center text-sm text-slate-400">
        No orders match your filters.
      </div>

      <template v-else>
        <!-- Desktop table -->
        <div class="card mt-3 hidden overflow-x-auto md:block">
          <table class="w-full min-w-[60rem]">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-800">
                <th class="th w-10">
                  <input type="checkbox" class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600" :checked="allVisibleSelected" @change="toggleAll" />
                </th>
                <th class="th">Order</th>
                <th class="th">Customer</th>
                <th class="th">Channel</th>
                <th class="th">Status</th>
                <th class="th">Payment</th>
                <th class="th text-right">Total</th>
                <th class="th">Placed</th>
                <th class="th">Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="o in filtered"
                :key="o.id"
                class="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 last:border-0 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                @click="openDrawer(o)"
              >
                <td class="td" @click.stop>
                  <input type="checkbox" class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600" :checked="selected.has(o.id)" @change="toggleRow(o.id)" />
                </td>
                <td class="td font-medium">{{ o.number }}</td>
                <td class="td min-w-0 max-w-[12rem]"><span class="block truncate">{{ o.customerName }}</span></td>
                <td class="td">{{ o.channel }}</td>
                <td class="td"><StatusBadge :value="o.status" kind="status" /></td>
                <td class="td"><StatusBadge :value="o.paymentStatus" kind="payment" /></td>
                <td class="td text-right tabular-nums">{{ formatMoney(o.totalCents) }}</td>
                <td class="td whitespace-nowrap text-slate-500 dark:text-slate-400">{{ formatDate(o.placedAt) }}</td>
                <td class="td">
                  <div class="flex flex-wrap gap-1">
                    <span v-if="o.late" class="chip bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">Late</span>
                    <span v-if="o.priority" class="chip bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">Priority</span>
                    <span v-if="!o.late && !o.priority" class="text-xs text-slate-400">—</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile card list -->
        <ul class="mt-3 space-y-3 md:hidden">
          <li
            v-for="o in filtered"
            :key="o.id"
            class="card cursor-pointer p-3 transition active:bg-slate-50 dark:active:bg-slate-800/40"
            @click="openDrawer(o)"
          >
            <div class="flex items-start gap-3">
              <input
                type="checkbox"
                class="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600"
                :checked="selected.has(o.id)"
                @click.stop
                @change="toggleRow(o.id)"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate text-sm font-semibold">{{ o.number }}</span>
                  <span class="shrink-0 text-sm font-semibold tabular-nums">{{ formatMoney(o.totalCents) }}</span>
                </div>
                <p class="truncate text-sm text-slate-500 dark:text-slate-400">{{ o.customerName }}</p>
                <p class="text-xs text-slate-400">{{ o.channel }} · {{ formatDate(o.placedAt) }}</p>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge :value="o.status" kind="status" />
                  <StatusBadge :value="o.paymentStatus" kind="payment" />
                  <span v-if="o.late" class="chip bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">Late</span>
                  <span v-if="o.priority" class="chip bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">Priority</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </template>
    </StateBlock>

    <!-- Sticky bulk-action bar -->
    <Transition name="bulk">
      <div
        v-if="selectedCount > 0"
        class="sticky bottom-4 z-30 mx-auto w-full max-w-3xl"
      >
        <div class="card flex flex-wrap items-center gap-2 border-indigo-200 p-3 shadow-lg dark:border-indigo-500/30">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold">{{ formatNumber(selectedCount) }} selected</p>
            <p class="text-[11px] uppercase tracking-wide text-slate-400">Demo action</p>
          </div>
          <button class="btn btn-outline" @click="bulkStatus('Fulfillment')">Mark Fulfillment</button>
          <button class="btn btn-outline" @click="bulkStatus('Shipped')">Mark Shipped</button>
          <button class="btn btn-outline" @click="bulkPriority">Add priority</button>
          <button class="btn btn-ghost" @click="clearSelection">Clear</button>
        </div>
      </div>
    </Transition>

    <OrdersDetailDrawer :open="drawerOpen" :order="openOrder" @close="drawerOpen = false" />
  </div>
</template>

<style scoped>
.bulk-enter-active,
.bulk-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.bulk-enter-from,
.bulk-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
