<script setup lang="ts">
import type { ProductDTO } from '~/types'

const data = useDataStore()

type View = 'all' | 'low' | 'out' | 'best'

const search = ref('')
const category = ref<string>('all')
const view = ref<View>('all')

const inventoryValueCents = computed(() => data.products.reduce((s, p) => s + p.stock * p.costCents, 0))
const lowCount = computed(() => data.products.filter((p) => p.stockStatus === 'Low stock').length)
const outCount = computed(() => data.products.filter((p) => p.stockStatus === 'Out of stock').length)

const rows = computed<ProductDTO[]>(() => {
  const q = search.value.trim().toLowerCase()
  let list = data.products.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false
    if (category.value !== 'all' && p.category !== category.value) return false
    if (view.value === 'low' && p.stockStatus !== 'Low stock') return false
    if (view.value === 'out' && p.stockStatus !== 'Out of stock') return false
    return true
  })
  list =
    view.value === 'best'
      ? [...list].sort((a, b) => b.unitsSold - a.unitsSold)
      : [...list].sort((a, b) => a.name.localeCompare(b.name))
  return list
})

const adjustTarget = ref<ProductDTO | null>(null)
const reorderTarget = ref<ProductDTO | null>(null)

function needsReorder(p: ProductDTO) {
  return p.stockStatus !== 'OK'
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold">Inventory</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">Stock levels, sell-through and reorder actions across the catalog.</p>
    </div>

    <StateBlock :loading="data.loading && !data.loaded" :error="data.error">
      <!-- KPIs -->
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Total SKUs" :value="formatNumber(data.products.length)" />
        <KpiCard label="Low stock" :value="formatNumber(lowCount)" accent="text-amber-600 dark:text-amber-400" />
        <KpiCard label="Out of stock" :value="formatNumber(outCount)" accent="text-rose-600 dark:text-rose-400" />
        <KpiCard label="Inventory value" :value="formatMoney(inventoryValueCents)" accent="text-indigo-600 dark:text-indigo-400" />
      </div>

      <!-- Toolbar -->
      <div class="mt-6 card flex flex-wrap items-end gap-3 p-3">
        <div class="flex-1 sm:flex-none sm:w-72">
          <span class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Search</span>
          <SearchField v-model="search" placeholder="Name or SKU…" />
        </div>
        <SelectField v-model="category" label="Category" class="flex-1 sm:flex-none sm:w-40">
          <option value="all">All categories</option>
          <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
        </SelectField>
        <SelectField v-model="view" label="View" class="flex-1 sm:flex-none sm:w-40">
          <option value="all">All</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
          <option value="best">Best sellers</option>
        </SelectField>
        <div class="ml-auto self-end text-xs text-slate-400">{{ formatNumber(rows.length) }} SKUs</div>
      </div>

      <!-- Desktop table -->
      <div v-if="rows.length" class="mt-4 card hidden overflow-x-auto p-0 md:block">
        <table class="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr>
              <th class="th text-left">SKU</th>
              <th class="th text-left">Name</th>
              <th class="th text-left">Category</th>
              <th class="th text-right">Stock</th>
              <th class="th text-right">Reorder at</th>
              <th class="th text-right">Units sold</th>
              <th class="th text-right">Revenue</th>
              <th class="th text-right">Margin</th>
              <th class="th text-left">Status</th>
              <th class="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in rows" :key="p.id" class="border-t border-slate-100 dark:border-slate-800">
              <td class="td font-mono text-xs text-slate-500 dark:text-slate-400">{{ p.sku }}</td>
              <td class="td max-w-[220px]">
                <span class="block truncate font-medium">{{ p.name }}</span>
              </td>
              <td class="td text-slate-500 dark:text-slate-400">{{ p.category }}</td>
              <td class="td text-right font-semibold tabular-nums">{{ formatNumber(p.stock) }}</td>
              <td class="td text-right tabular-nums text-slate-500 dark:text-slate-400">{{ formatNumber(p.reorderThreshold) }}</td>
              <td class="td text-right tabular-nums">{{ formatNumber(p.unitsSold) }}</td>
              <td class="td text-right tabular-nums">{{ formatMoney(p.revenueCents) }}</td>
              <td class="td text-right tabular-nums">{{ formatMoney(p.marginCents) }}</td>
              <td class="td"><StatusBadge :value="p.stockStatus" kind="stock" /></td>
              <td class="td">
                <div class="flex justify-end gap-2">
                  <button v-if="needsReorder(p)" class="btn btn-outline !px-2 !py-1 text-xs" @click="reorderTarget = p">Reorder</button>
                  <button class="btn btn-ghost !px-2 !py-1 text-xs" @click="adjustTarget = p">Adjust</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <StateBlock v-if="!rows.length" class="mt-4 hidden md:block" :empty="true" empty-text="No SKUs match these filters." />

      <!-- Mobile card list -->
      <div class="mt-4 space-y-3 md:hidden">
        <div v-for="p in rows" :key="p.id" class="card p-3">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold">{{ p.name }}</p>
              <p class="truncate font-mono text-xs text-slate-400">{{ p.sku }} · {{ p.category }}</p>
            </div>
            <StatusBadge :value="p.stockStatus" kind="stock" />
          </div>
          <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <div class="flex justify-between"><dt class="text-slate-400">Stock</dt><dd class="font-semibold tabular-nums">{{ formatNumber(p.stock) }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-400">Reorder at</dt><dd class="tabular-nums">{{ formatNumber(p.reorderThreshold) }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-400">Units sold</dt><dd class="tabular-nums">{{ formatNumber(p.unitsSold) }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-400">Revenue</dt><dd class="tabular-nums">{{ formatMoney(p.revenueCents) }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-400">Margin</dt><dd class="tabular-nums">{{ formatMoney(p.marginCents) }}</dd></div>
          </dl>
          <div class="mt-3 flex gap-2">
            <button v-if="needsReorder(p)" class="btn btn-outline flex-1 !py-1.5 text-xs" @click="reorderTarget = p">Reorder</button>
            <button class="btn btn-ghost flex-1 !py-1.5 text-xs" @click="adjustTarget = p">Adjust</button>
          </div>
        </div>
        <StateBlock v-if="!rows.length" :empty="true" empty-text="No SKUs match these filters." />
      </div>
    </StateBlock>

    <InventoryAdjustModal :open="adjustTarget !== null" :product="adjustTarget" @close="adjustTarget = null" />
    <InventoryReorderModal :open="reorderTarget !== null" :product="reorderTarget" @close="reorderTarget = null" />
  </div>
</template>
