<script setup lang="ts">
import type { CustomerDTO } from '~/types'

const data = useDataStore()

const search = ref('')
const segment = ref<'all' | (typeof SEGMENTS)[number]>('all')
const sort = ref<'spent' | 'orders' | 'returns' | 'name'>('spent')

const selected = ref<CustomerDTO | null>(null)

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  let list = data.customers.filter((c) => {
    if (segment.value !== 'all' && c.segment !== segment.value) return false
    if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false
    return true
  })
  list = [...list].sort((a, b) => {
    switch (sort.value) {
      case 'spent':
        return b.totalSpentCents - a.totalSpentCents
      case 'orders':
        return b.ordersCount - a.ordersCount
      case 'returns':
        return b.returnRate - a.returnRate
      case 'name':
        return a.name.localeCompare(b.name)
    }
  })
  return list
})

function open(c: CustomerDTO) {
  selected.value = c
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold">Customers</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">Spend, loyalty segments and return behaviour across your customer base.</p>
    </div>

    <!-- Toolbar -->
    <div class="card flex flex-wrap items-end gap-3 p-3">
      <div class="min-w-0 flex-1 sm:max-w-xs">
        <SearchField v-model="search" placeholder="Search name or email…" />
      </div>
      <SelectField v-model="segment" label="Segment" class="flex-1 sm:flex-none sm:w-40">
        <option value="all">All segments</option>
        <option v-for="s in SEGMENTS" :key="s" :value="s">{{ s }}</option>
      </SelectField>
      <SelectField v-model="sort" label="Sort" class="flex-1 sm:flex-none sm:w-44">
        <option value="spent">Top spenders</option>
        <option value="orders">Most orders</option>
        <option value="returns">Highest return rate</option>
        <option value="name">Name</option>
      </SelectField>
    </div>

    <StateBlock :loading="data.loading && !data.loaded" :error="data.error" :empty="rows.length === 0" empty-text="No customers match your filters.">
      <!-- Desktop table -->
      <div class="card hidden overflow-x-auto p-0 md:block">
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th class="th text-left">Customer</th>
              <th class="th text-left">Segment</th>
              <th class="th text-right">Total spent</th>
              <th class="th text-right">Orders</th>
              <th class="th text-left">Last order</th>
              <th class="th text-right">Return rate</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in rows"
              :key="c.id"
              class="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
              @click="open(c)"
            >
              <td class="td">
                <div class="min-w-0">
                  <p class="truncate font-medium">{{ c.name }}</p>
                  <p class="truncate text-xs text-slate-400">{{ c.email }}</p>
                </div>
              </td>
              <td class="td"><StatusBadge :value="c.segment" kind="segment" /></td>
              <td class="td text-right tabular-nums font-medium">{{ formatMoney(c.totalSpentCents) }}</td>
              <td class="td text-right tabular-nums">{{ formatNumber(c.ordersCount) }}</td>
              <td class="td whitespace-nowrap">{{ formatDate(c.lastOrderAt) }}</td>
              <td class="td text-right tabular-nums">{{ formatPct(c.returnRate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile card list -->
      <div class="space-y-3 md:hidden">
        <button
          v-for="c in rows"
          :key="c.id"
          class="card w-full p-4 text-left transition hover:border-indigo-300 dark:hover:border-indigo-500/50"
          @click="open(c)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ c.name }}</p>
              <p class="truncate text-xs text-slate-400">{{ c.email }}</p>
            </div>
            <StatusBadge :value="c.segment" kind="segment" />
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p class="text-[11px] uppercase tracking-wide text-slate-400">Total spent</p>
              <p class="font-medium tabular-nums">{{ formatMoney(c.totalSpentCents) }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-slate-400">Orders</p>
              <p class="tabular-nums">{{ formatNumber(c.ordersCount) }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-slate-400">Last order</p>
              <p>{{ formatDate(c.lastOrderAt) }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-slate-400">Return rate</p>
              <p class="tabular-nums">{{ formatPct(c.returnRate) }}</p>
            </div>
          </div>
        </button>
      </div>
    </StateBlock>

    <CustomersDetailModal :open="selected !== null" :customer="selected" @close="selected = null" />
  </div>
</template>
