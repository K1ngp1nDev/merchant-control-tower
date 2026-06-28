import { defineStore } from 'pinia'
import type {
  BootstrapData,
  CustomerDTO,
  OrderDTO,
  OrderStatus,
  ProductDTO,
  ReturnDTO,
} from '~/types'

interface Filters {
  range: '30d' | '90d' | '180d' | 'all'
  channel: string
  status: string
  category: string
  segment: string
}

const RANGE_DAYS: Record<Filters['range'], number> = { '30d': 30, '90d': 90, '180d': 180, all: 100000 }

export const useDataStore = defineStore('data', {
  state: () => ({
    products: [] as ProductDTO[],
    customers: [] as CustomerDTO[],
    orders: [] as OrderDTO[],
    returns: [] as ReturnDTO[],
    loaded: false,
    loading: false,
    error: null as string | null,
    filters: { range: '180d', channel: 'all', status: 'all', category: 'all', segment: 'all' } as Filters,
  }),

  getters: {
    rangeStartMs(state): number {
      return Date.now() - RANGE_DAYS[state.filters.range] * 86400000
    },
    filteredOrders(state): OrderDTO[] {
      const f = state.filters
      const start = Date.now() - RANGE_DAYS[f.range] * 86400000
      return state.orders.filter((o) => {
        if (new Date(o.placedAt).getTime() < start) return false
        if (f.channel !== 'all' && o.channel !== f.channel) return false
        if (f.status !== 'all' && o.status !== f.status) return false
        if (f.segment !== 'all' && o.segment !== f.segment) return false
        if (f.category !== 'all' && !o.items.some((i) => i.category === f.category)) return false
        return true
      })
    },
    nonCancelled(): OrderDTO[] {
      return this.filteredOrders.filter((o) => o.status !== 'Cancelled')
    },
    filteredReturns(state): ReturnDTO[] {
      const ids = new Set(this.filteredOrders.map((o) => o.id))
      return state.returns.filter((r) => ids.has(r.orderId))
    },
    kpis() {
      const gross = this.nonCancelled.reduce((s, o) => s + o.totalCents, 0)
      const returnAmt = this.filteredReturns.reduce((s, r) => s + r.amountCents, 0)
      const count = this.nonCancelled.length
      const shipped = this.filteredOrders.filter((o) => o.shippedAt)
      const onTime = shipped.filter((o) => new Date(o.shippedAt!).getTime() <= new Date(o.slaDueAt).getTime())
      return {
        grossRevenueCents: gross,
        netRevenueCents: gross - returnAmt,
        orders: this.filteredOrders.length,
        aovCents: count ? Math.round(gross / count) : 0,
        slaPct: shipped.length ? (onTime.length / shipped.length) * 100 : 100,
        pendingFulfillment: this.filteredOrders.filter((o) => ['New', 'Paid', 'Fulfillment'].includes(o.status)).length,
        lateShipments: this.filteredOrders.filter((o) => o.late).length,
        lowStockSkus: this.products.filter((p) => p.stockStatus !== 'OK').length,
        returnRate: count ? (this.filteredReturns.length / count) * 100 : 0,
      }
    },
    months(): string[] {
      const out: string[] = []
      const end = new Date()
      const start = new Date(this.rangeStartMs)
      const cur = new Date(start.getFullYear(), start.getMonth(), 1)
      while (cur <= end && out.length < 24) {
        out.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
        cur.setMonth(cur.getMonth() + 1)
      }
      return out
    },
    revenueByMonth() {
      const map = new Map<string, { revenue: number; orders: number }>()
      for (const key of this.months) map.set(key, { revenue: 0, orders: 0 })
      for (const o of this.nonCancelled) {
        const key = o.placedAt.slice(0, 7)
        const m = map.get(key)
        if (m) {
          m.revenue += o.totalCents
          m.orders += 1
        }
      }
      return this.months.map((key) => ({ key, label: monthLabel(key), revenueCents: map.get(key)!.revenue, orders: map.get(key)!.orders }))
    },
    ordersByStatus() {
      return ORDER_STATUSES.map((status) => ({
        label: status,
        value: this.filteredOrders.filter((o) => o.status === status).length,
      }))
    },
    salesByChannel() {
      return CHANNELS.map((channel) => ({
        label: channel,
        value: this.nonCancelled.filter((o) => o.channel === channel).reduce((s, o) => s + o.totalCents, 0),
      })).filter((c) => c.value > 0)
    },
    topProductsByRevenue() {
      const map = new Map<string, number>()
      for (const o of this.nonCancelled) for (const it of o.items) map.set(it.name, (map.get(it.name) ?? 0) + it.lineTotalCents)
      return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([name, revenueCents]) => ({ name, revenueCents }))
    },
    returnRateTrend() {
      const orderByMonth = new Map<string, number>()
      const retByMonth = new Map<string, number>()
      for (const key of this.months) {
        orderByMonth.set(key, 0)
        retByMonth.set(key, 0)
      }
      for (const o of this.nonCancelled) {
        const k = o.placedAt.slice(0, 7)
        if (orderByMonth.has(k)) orderByMonth.set(k, orderByMonth.get(k)! + 1)
      }
      for (const r of this.filteredReturns) {
        const k = r.requestedAt.slice(0, 7)
        if (retByMonth.has(k)) retByMonth.set(k, retByMonth.get(k)! + 1)
      }
      return this.months.map((key) => {
        const orders = orderByMonth.get(key)!
        return { key, label: monthLabel(key), rate: orders ? (retByMonth.get(key)! / orders) * 100 : 0 }
      })
    },
    returnsByReason() {
      return RETURN_REASONS.map((reason) => ({
        label: reason,
        value: this.filteredReturns.filter((r) => r.reason === reason).length,
      })).filter((r) => r.value > 0)
    },
    inventoryRisk(): ProductDTO[] {
      return [...this.products]
        .filter((p) => p.stockStatus !== 'OK' || p.unitsSold / (p.stock + 1) > 1.2)
        .sort((a, b) => b.unitsSold / (b.stock + 1) - a.unitsSold / (a.stock + 1))
        .slice(0, 8)
    },
  },

  actions: {
    async load(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      this.error = null
      try {
        const auth = useAuthStore()
        const data = await $fetch<BootstrapData>('/api/data', {
          headers: { Authorization: `Bearer ${auth.token}` },
        })
        this.products = data.products
        this.customers = data.customers
        this.orders = data.orders
        this.returns = data.returns
        this.loaded = true
      } catch {
        this.error = 'Failed to load data. Is the API running?'
      } finally {
        this.loading = false
      }
    },
    resetFilters() {
      this.filters = { range: '180d', channel: 'all', status: 'all', category: 'all', segment: 'all' }
    },
    // --- demo-only local mutations ---
    setOrderStatus(orderId: number, status: OrderStatus) {
      const o = this.orders.find((x) => x.id === orderId)
      if (o) o.status = status
    },
    addOrderNote(orderId: number, note: string) {
      const o = this.orders.find((x) => x.id === orderId)
      if (o) o.note = note
    },
    togglePriority(orderId: number) {
      const o = this.orders.find((x) => x.id === orderId)
      if (o) o.priority = !o.priority
    },
    adjustStock(productId: number, newStock: number) {
      const p = this.products.find((x) => x.id === productId)
      if (!p) return
      p.stock = Math.max(0, newStock)
      p.stockStatus = p.stock === 0 ? 'Out of stock' : p.stock <= p.reorderThreshold ? 'Low stock' : 'OK'
    },
  },
})
