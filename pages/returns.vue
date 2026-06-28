<script setup lang="ts">
import type { ReturnDTO } from '~/types'

const data = useDataStore()
const { base } = useApexTheme()

// --- local filters / search / selection ---
const search = ref('')
const reasonFilter = ref('all')
const statusFilter = ref('all')
const categoryFilter = ref('all')
const selected = ref<ReturnDTO | null>(null)

const RETURN_STATUSES = ['Requested', 'Approved', 'Received', 'Refunded', 'Rejected'] as const

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return data.returns.filter((r) => {
    if (reasonFilter.value !== 'all' && r.reason !== reasonFilter.value) return false
    if (statusFilter.value !== 'all' && r.status !== statusFilter.value) return false
    if (categoryFilter.value !== 'all' && r.category !== categoryFilter.value) return false
    if (q && !r.productName.toLowerCase().includes(q) && !r.orderNumber.toLowerCase().includes(q)) return false
    return true
  })
})

// --- KPIs ---
const refundedCents = computed(() =>
  data.returns.filter((r) => r.status === 'Refunded').reduce((s, r) => s + r.amountCents, 0),
)
const topReason = computed(() => {
  const counts = new Map<string, number>()
  for (const r of data.returns) counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1)
  let best = '—'
  let max = 0
  for (const [reason, n] of counts) if (n > max) { max = n; best = reason }
  return best
})

// --- reasons donut (built from store getter) ---
const REASON_COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#f43f5e', '#10b981', '#ec4899']
const reasonData = computed(() => data.returnsByReason)
const reasonOptions = computed(() => ({
  ...base.value,
  chart: { ...base.value.chart, type: 'donut', height: 300 },
  labels: reasonData.value.map((r) => r.label),
  colors: reasonData.value.map((_, i) => REASON_COLORS[i % REASON_COLORS.length]),
  legend: { ...base.value.legend, position: 'bottom' },
  dataLabels: { enabled: true, formatter: (v: number) => `${Math.round(v)}%` },
  stroke: { width: 0 },
  tooltip: { ...base.value.tooltip, y: { formatter: (v: number) => `${v} returns` } },
}))
const reasonSeries = computed(() => reasonData.value.map((r) => r.value))

function open(r: ReturnDTO) {
  selected.value = r
}
function resetFilters() {
  search.value = ''
  reasonFilter.value = 'all'
  statusFilter.value = 'all'
  categoryFilter.value = 'all'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold">Returns</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">Track return requests, reasons and refunds across all channels.</p>
      </div>
      <button class="btn btn-outline" @click="resetFilters()">Reset filters</button>
    </div>

    <StateBlock :loading="data.loading && !data.loaded" :error="data.error">
      <!-- KPIs -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Total returns" :value="formatNumber(data.returns.length)" accent="text-indigo-600 dark:text-indigo-400" />
        <KpiCard label="Refunded amount" :value="formatMoney(refundedCents)" accent="text-rose-600 dark:text-rose-400" />
        <KpiCard label="Top reason" :value="topReason" />
      </div>

      <!-- Reasons chart -->
      <div class="mt-6">
        <ChartCard title="Return reasons" :subtitle="`${reasonData.length} reasons`">
          <ClientOnly><apexchart type="donut" height="300" :options="reasonOptions" :series="reasonSeries" /></ClientOnly>
        </ChartCard>
      </div>

      <!-- Toolbar -->
      <div class="mt-6 card flex flex-wrap items-end gap-3 p-3">
        <div class="min-w-0 flex-1 sm:w-64 sm:flex-none">
          <span class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Search</span>
          <SearchField v-model="search" placeholder="Product or order #…" />
        </div>
        <SelectField v-model="reasonFilter" label="Reason" class="flex-1 sm:flex-none sm:w-40">
          <option value="all">All reasons</option>
          <option v-for="r in RETURN_REASONS" :key="r" :value="r">{{ r }}</option>
        </SelectField>
        <SelectField v-model="statusFilter" label="Status" class="flex-1 sm:flex-none sm:w-36">
          <option value="all">All statuses</option>
          <option v-for="s in RETURN_STATUSES" :key="s" :value="s">{{ s }}</option>
        </SelectField>
        <SelectField v-model="categoryFilter" label="Category" class="flex-1 sm:flex-none sm:w-36">
          <option value="all">All categories</option>
          <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
        </SelectField>
      </div>

      <!-- Return queue -->
      <div class="mt-6">
        <StateBlock :empty="filtered.length === 0" empty-text="No returns match your filters.">
          <!-- Desktop table -->
          <div class="card hidden overflow-x-auto p-0 md:block">
            <table class="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr>
                  <th class="th">Order</th>
                  <th class="th">Product</th>
                  <th class="th">Category</th>
                  <th class="th">Reason</th>
                  <th class="th text-right">Amount</th>
                  <th class="th">Status</th>
                  <th class="th">Requested</th>
                  <th class="th">Channel</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="r in filtered"
                  :key="r.id"
                  class="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  @click="open(r)"
                >
                  <td class="td font-medium">{{ r.orderNumber }}</td>
                  <td class="td max-w-[220px] truncate">{{ r.productName }}</td>
                  <td class="td text-slate-500 dark:text-slate-400">{{ r.category }}</td>
                  <td class="td text-slate-500 dark:text-slate-400">{{ r.reason }}</td>
                  <td class="td text-right tabular-nums">{{ formatMoney(r.amountCents) }}</td>
                  <td class="td"><StatusBadge :value="r.status" kind="return" /></td>
                  <td class="td whitespace-nowrap text-slate-500 dark:text-slate-400">{{ formatDate(r.requestedAt) }}</td>
                  <td class="td text-slate-500 dark:text-slate-400">{{ r.channel }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile card list -->
          <div class="space-y-3 md:hidden">
            <button
              v-for="r in filtered"
              :key="r.id"
              class="card w-full p-4 text-left transition hover:border-indigo-300 dark:hover:border-indigo-500/50"
              @click="open(r)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold">{{ r.productName }}</p>
                  <p class="truncate text-xs text-slate-400">{{ r.orderNumber }} · {{ r.category }}</p>
                </div>
                <StatusBadge :value="r.status" kind="return" />
              </div>
              <div class="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span class="min-w-0 truncate">{{ r.reason }} · {{ r.channel }}</span>
                <span class="shrink-0 tabular-nums font-semibold text-slate-700 dark:text-slate-200">{{ formatMoney(r.amountCents) }}</span>
              </div>
              <p class="mt-1 text-xs text-slate-400">{{ formatDate(r.requestedAt) }}</p>
            </button>
          </div>
        </StateBlock>
      </div>
    </StateBlock>

    <ReturnsDetailModal :open="selected !== null" :ret="selected" @close="selected = null" />
  </div>
</template>
