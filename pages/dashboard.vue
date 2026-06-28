<script setup lang="ts">
const data = useDataStore()
const { base } = useApexTheme()

const drill = ref<null | 'pending' | 'late' | 'lowstock' | 'returns'>(null)
const drillTitle = computed(
  () =>
    ({
      pending: 'Pending fulfillment',
      late: 'Late shipments',
      lowstock: 'Low-stock SKUs',
      returns: 'Returns in range',
    })[drill.value ?? 'pending'],
)
const drillOrders = computed(() => {
  if (drill.value === 'pending') return data.filteredOrders.filter((o) => ['New', 'Paid', 'Fulfillment'].includes(o.status))
  if (drill.value === 'late') return data.filteredOrders.filter((o) => o.late)
  return []
})

const k = computed(() => data.kpis)

// --- charts (money series are in cents; formatters divide by 100) ---
const revenueOptions = computed(() => ({
  ...base.value,
  chart: { ...base.value.chart, type: 'area', height: 300 },
  xaxis: { categories: data.revenueByMonth.map((m) => m.label), axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { labels: { formatter: (v: number) => formatMoneyCompact(v) } },
  stroke: { curve: 'smooth', width: 2.5 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
  colors: ['#6366f1'],
  tooltip: { ...base.value.tooltip, y: { formatter: (v: number) => formatMoney(v) } },
}))
const revenueSeries = computed(() => [{ name: 'Revenue', data: data.revenueByMonth.map((m) => m.revenueCents) }])

const statusDonut = computed(() => data.ordersByStatus.filter((s) => s.value > 0))
const statusOptions = computed(() => ({
  ...base.value,
  chart: {
    ...base.value.chart,
    type: 'donut',
    height: 300,
    events: {
      dataPointSelection: (_e: unknown, _ctx: unknown, cfg: { dataPointIndex: number }) => {
        const label = statusDonut.value[cfg.dataPointIndex]?.label
        if (label) data.filters.status = data.filters.status === label ? 'all' : label
      },
    },
  },
  labels: statusDonut.value.map((s) => s.label),
  colors: statusDonut.value.map((s) => STATUS_HEX[s.label]),
  legend: { ...base.value.legend, position: 'bottom' },
  dataLabels: { enabled: true, formatter: (v: number) => `${Math.round(v)}%` },
  stroke: { width: 0 },
}))
const statusSeries = computed(() => statusDonut.value.map((s) => s.value))

const channelOptions = computed(() => ({
  ...base.value,
  chart: { ...base.value.chart, type: 'bar', height: 300 },
  plotOptions: { bar: { borderRadius: 6, distributed: true, columnWidth: '55%' } },
  xaxis: { categories: data.salesByChannel.map((c) => c.label) },
  yaxis: { labels: { formatter: (v: number) => formatMoneyCompact(v) } },
  colors: data.salesByChannel.map((c) => CHANNEL_HEX[c.label]),
  legend: { show: false },
  dataLabels: { enabled: false },
  tooltip: { ...base.value.tooltip, y: { formatter: (v: number) => formatMoney(v) } },
}))
const channelSeries = computed(() => [{ name: 'Revenue', data: data.salesByChannel.map((c) => c.value) }])

const topOptions = computed(() => ({
  ...base.value,
  chart: { ...base.value.chart, type: 'bar', height: 300 },
  plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '60%' } },
  xaxis: { categories: data.topProductsByRevenue.map((p) => p.name), labels: { formatter: (v: number) => formatMoneyCompact(v) } },
  colors: ['#0ea5e9'],
  dataLabels: { enabled: false },
  tooltip: { ...base.value.tooltip, y: { formatter: (v: number) => formatMoney(v) } },
}))
const topSeries = computed(() => [{ name: 'Revenue', data: data.topProductsByRevenue.map((p) => p.revenueCents) }])

const returnTrendOptions = computed(() => ({
  ...base.value,
  chart: { ...base.value.chart, type: 'line', height: 300 },
  xaxis: { categories: data.returnRateTrend.map((m) => m.label) },
  yaxis: { labels: { formatter: (v: number) => `${v.toFixed(0)}%` } },
  stroke: { curve: 'smooth', width: 3 },
  colors: ['#f43f5e'],
  markers: { size: 4 },
  tooltip: { ...base.value.tooltip, y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
}))
const returnTrendSeries = computed(() => [{ name: 'Return rate', data: data.returnRateTrend.map((m) => Number(m.rate.toFixed(1))) }])

const riskOptions = computed(() => ({
  ...base.value,
  chart: { ...base.value.chart, type: 'bar', height: 300 },
  plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '55%', distributed: true } },
  xaxis: { categories: data.inventoryRisk.map((p) => p.name) },
  colors: data.inventoryRisk.map((p) => (p.stockStatus === 'Out of stock' ? '#f43f5e' : p.stockStatus === 'Low stock' ? '#f59e0b' : '#10b981')),
  legend: { show: false },
  dataLabels: { enabled: true },
  tooltip: { ...base.value.tooltip, y: { formatter: (v: number) => `${v} in stock` } },
}))
const riskSeries = computed(() => [{ name: 'Stock', data: data.inventoryRisk.map((p) => p.stock) }])
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold">Operations overview</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">Orders, revenue, fulfillment, inventory & returns across all channels.</p>
      </div>
      <button class="btn btn-outline" @click="data.resetFilters()">Reset filters</button>
    </div>

    <!-- Filters -->
    <div class="card flex flex-wrap gap-3 p-3">
      <SelectField v-model="data.filters.range" label="Range" class="flex-1 sm:flex-none sm:w-36">
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="180d">Last 180 days</option>
        <option value="all">All time</option>
      </SelectField>
      <SelectField v-model="data.filters.channel" label="Channel" class="flex-1 sm:flex-none sm:w-36">
        <option value="all">All channels</option>
        <option v-for="c in CHANNELS" :key="c" :value="c">{{ c }}</option>
      </SelectField>
      <SelectField v-model="data.filters.status" label="Status" class="flex-1 sm:flex-none sm:w-36">
        <option value="all">All statuses</option>
        <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ s }}</option>
      </SelectField>
      <SelectField v-model="data.filters.category" label="Category" class="flex-1 sm:flex-none sm:w-36">
        <option value="all">All categories</option>
        <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
      </SelectField>
      <SelectField v-model="data.filters.segment" label="Segment" class="flex-1 sm:flex-none sm:w-36">
        <option value="all">All segments</option>
        <option v-for="s in SEGMENTS" :key="s" :value="s">{{ s }}</option>
      </SelectField>
    </div>

    <StateBlock :loading="data.loading && !data.loaded" :error="data.error">
      <!-- KPIs -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Gross revenue" :value="formatMoney(k.grossRevenueCents)" accent="text-indigo-600 dark:text-indigo-400" />
        <KpiCard label="Net revenue" :value="formatMoney(k.netRevenueCents)" />
        <KpiCard label="Orders" :value="formatNumber(k.orders)" />
        <KpiCard label="Avg order value" :value="formatMoney(k.aovCents)" />
        <KpiCard label="Fulfillment SLA" :value="formatPct(k.slaPct)" accent="text-emerald-600 dark:text-emerald-400" />
        <KpiCard label="Pending fulfillment" :value="formatNumber(k.pendingFulfillment)" clickable @click="drill = 'pending'" />
        <KpiCard label="Late shipments" :value="formatNumber(k.lateShipments)" accent="text-rose-600 dark:text-rose-400" clickable @click="drill = 'late'" />
        <KpiCard label="Low-stock SKUs" :value="formatNumber(k.lowStockSkus)" accent="text-amber-600 dark:text-amber-400" clickable @click="drill = 'lowstock'" />
        <KpiCard label="Return rate" :value="formatPct(k.returnRate)" clickable @click="drill = 'returns'" />
      </div>

      <!-- Charts -->
      <div class="mt-6 space-y-6">
        <ChartCard title="Revenue over time" :subtitle="`${data.revenueByMonth.length} months`">
          <ClientOnly><apexchart type="area" height="300" :options="revenueOptions" :series="revenueSeries" /></ClientOnly>
        </ChartCard>

        <div class="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Orders by status" subtitle="Click a slice to filter">
            <ClientOnly><apexchart type="donut" height="300" :options="statusOptions" :series="statusSeries" /></ClientOnly>
          </ChartCard>
          <ChartCard title="Sales by channel">
            <ClientOnly><apexchart type="bar" height="300" :options="channelOptions" :series="channelSeries" /></ClientOnly>
          </ChartCard>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Top products by revenue">
            <ClientOnly><apexchart type="bar" height="300" :options="topOptions" :series="topSeries" /></ClientOnly>
          </ChartCard>
          <ChartCard title="Return rate trend">
            <ClientOnly><apexchart type="line" height="300" :options="returnTrendOptions" :series="returnTrendSeries" /></ClientOnly>
          </ChartCard>
        </div>

        <ChartCard title="Inventory risk" subtitle="At-risk SKUs by current stock level">
          <ClientOnly><apexchart type="bar" height="300" :options="riskOptions" :series="riskSeries" /></ClientOnly>
        </ChartCard>
      </div>
    </StateBlock>

    <!-- Drill-down modal -->
    <Modal :open="drill !== null" :title="drillTitle" @close="drill = null">
      <div v-if="drill === 'lowstock'" class="space-y-2">
        <div
          v-for="p in data.products.filter((x) => x.stockStatus !== 'OK')"
          :key="p.id"
          class="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ p.name }}</p>
            <p class="text-xs text-slate-400">{{ p.sku }} · {{ p.category }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm tabular-nums">{{ p.stock }} left</span>
            <StatusBadge :value="p.stockStatus" kind="stock" />
          </div>
        </div>
      </div>
      <div v-else-if="drill === 'returns'" class="space-y-2">
        <div
          v-for="r in data.filteredReturns.slice(0, 30)"
          :key="r.id"
          class="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ r.productName }}</p>
            <p class="text-xs text-slate-400">{{ r.orderNumber }} · {{ r.reason }}</p>
          </div>
          <span class="text-sm tabular-nums">{{ formatMoney(r.amountCents) }}</span>
        </div>
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="o in drillOrders.slice(0, 30)"
          :key="o.id"
          class="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ o.number }} · {{ o.customerName }}</p>
            <p class="text-xs text-slate-400">{{ o.channel }} · {{ formatDate(o.placedAt) }}</p>
          </div>
          <StatusBadge :value="o.status" kind="status" />
        </div>
      </div>
      <p class="pt-3 text-center text-xs text-slate-400">Demo drill-down · synthetic data</p>
    </Modal>
  </div>
</template>
