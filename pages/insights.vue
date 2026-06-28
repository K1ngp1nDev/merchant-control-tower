<script setup lang="ts">
import type { Insight } from '~/components/insights/InsightsDetailModal.vue'

const data = useDataStore()

const SEVERITY_RANK: Record<Insight['severity'], number> = { high: 0, medium: 1, low: 2 }

const insights = computed<Insight[]>(() => {
  const out: Insight[] = []
  const products = data.products
  const orders = data.orders
  const customers = data.customers
  const returns = data.returns
  const k = data.kpis

  // 1) High revenue, low stock --------------------------------------------
  const atRiskEarners = [...products]
    .filter((p) => p.stockStatus !== 'OK' && p.revenueCents > 0)
    .sort((a, b) => b.revenueCents - a.revenueCents)
  if (atRiskEarners.length) {
    const top = atRiskEarners[0]
    out.push({
      id: 'high-rev-low-stock',
      severity: 'high',
      title: 'High revenue, low stock',
      metric: formatMoney(top.revenueCents),
      explanation: `${top.name} has driven ${formatMoney(top.revenueCents)} but is now ${top.stockStatus.toLowerCase()} (${top.stock} units left). ${atRiskEarners.length} top earners are below their reorder threshold.`,
      action: `Prioritise a restock for ${top.sku} and other high-revenue SKUs before stockouts cut into sales.`,
      category: 'Inventory',
      supportingTitle: 'At-risk top earners',
      supporting: atRiskEarners.slice(0, 6).map((p) => ({
        label: p.name,
        sublabel: `${p.sku} · ${p.category} · ${formatMoney(p.revenueCents)} revenue`,
        value: `${p.stock} left`,
        badge: { value: p.stockStatus, kind: 'stock' },
      })),
    })
  }

  // 2) Rising return rate by channel --------------------------------------
  const channelStats = CHANNELS.map((ch) => {
    const ordersInCh = orders.filter((o) => o.channel === ch && o.status !== 'Cancelled').length
    const retInCh = returns.filter((r) => r.channel === ch).length
    return { channel: ch, orders: ordersInCh, returns: retInCh, rate: ordersInCh ? (retInCh / ordersInCh) * 100 : 0 }
  }).filter((c) => c.orders >= 5)
  if (channelStats.length) {
    const worst = [...channelStats].sort((a, b) => b.rate - a.rate)[0]
    out.push({
      id: 'return-rate-channel',
      severity: worst.rate >= 15 ? 'high' : 'medium',
      title: 'Elevated return rate by channel',
      metric: formatPct(worst.rate),
      explanation: `${worst.channel} has the highest return rate at ${formatPct(worst.rate)} (${worst.returns} returns across ${worst.orders} orders), above the other channels.`,
      action: `Audit ${worst.channel} listings, sizing and packaging — the leading return reasons there are worth a closer look.`,
      category: 'Returns',
      supportingTitle: 'Return rate by channel',
      supporting: [...channelStats]
        .sort((a, b) => b.rate - a.rate)
        .map((c) => ({
          label: c.channel,
          sublabel: `${c.returns} returns / ${c.orders} orders`,
          value: formatPct(c.rate),
        })),
    })
  }

  // 3) Late fulfillment risk ----------------------------------------------
  const slaSev: Insight['severity'] = k.slaPct < 85 ? 'high' : k.slaPct < 95 ? 'medium' : 'low'
  out.push({
    id: 'late-fulfillment',
    severity: slaSev,
    title: 'Late fulfillment risk',
    metric: formatPct(k.slaPct),
    explanation: `Fulfillment SLA is ${formatPct(k.slaPct)} with ${formatNumber(k.lateShipments)} late shipments and ${formatNumber(k.pendingFulfillment)} orders still awaiting fulfillment.`,
    action:
      slaSev === 'low'
        ? 'SLA is healthy — keep monitoring the pending queue so it stays ahead of cut-offs.'
        : 'Reallocate warehouse capacity to the oldest pending orders and clear the late-shipment backlog first.',
    category: 'Fulfillment',
    supportingTitle: 'Late orders',
    supporting: orders
      .filter((o) => o.late)
      .slice(0, 8)
      .map((o) => ({
        label: `${o.number} · ${o.customerName}`,
        sublabel: `${o.channel} · placed ${formatDate(o.placedAt)}`,
        badge: { value: o.status, kind: 'status' },
      })),
  })

  // 4) Best customer segment ----------------------------------------------
  const segSpend = SEGMENTS.map((seg) => {
    const inSeg = customers.filter((c) => c.segment === seg)
    const spend = inSeg.reduce((s, c) => s + c.totalSpentCents, 0)
    return { segment: seg, spend, count: inSeg.length }
  }).filter((s) => s.count > 0)
  if (segSpend.length) {
    const totalSpend = segSpend.reduce((s, x) => s + x.spend, 0) || 1
    const best = [...segSpend].sort((a, b) => b.spend - a.spend)[0]
    out.push({
      id: 'best-segment',
      severity: 'low',
      title: 'Best customer segment',
      metric: formatMoney(best.spend),
      explanation: `The ${best.segment} segment accounts for ${formatMoney(best.spend)} in lifetime spend (${formatPct((best.spend / totalSpend) * 100)} of the total) across ${best.count} customers.`,
      action: `Build a retention play around ${best.segment} customers — they are the strongest revenue base to protect and grow.`,
      category: 'Customers',
      supportingTitle: 'Lifetime spend by segment',
      supporting: [...segSpend]
        .sort((a, b) => b.spend - a.spend)
        .map((s) => ({
          label: s.segment,
          sublabel: `${formatNumber(s.count)} customers`,
          value: formatMoney(s.spend),
          badge: { value: s.segment, kind: 'segment' },
        })),
    })
  }

  // 5) Category trend (revenue + returns) ---------------------------------
  const catStats = CATEGORIES.map((cat) => {
    const revenue = products.filter((p) => p.category === cat).reduce((s, p) => s + p.revenueCents, 0)
    const ret = returns.filter((r) => r.category === cat).length
    return { category: cat, revenue, returns: ret }
  }).filter((c) => c.revenue > 0 || c.returns > 0)
  if (catStats.length) {
    const topRev = [...catStats].sort((a, b) => b.revenue - a.revenue)[0]
    const topRet = [...catStats].sort((a, b) => b.returns - a.returns)[0]
    out.push({
      id: 'category-trend',
      severity: topRet.returns >= 8 ? 'medium' : 'low',
      title: 'Category trend',
      metric: formatMoneyCompact(topRev.revenue),
      explanation: `${topRev.category} leads on revenue with ${formatMoney(topRev.revenue)}, while ${topRet.category} generates the most returns (${formatNumber(topRet.returns)}).`,
      action: `Lean into ${topRev.category} merchandising; review ${topRet.category} quality and descriptions to trim returns.`,
      category: 'Merchandising',
      supportingTitle: 'Revenue & returns by category',
      supporting: [...catStats]
        .sort((a, b) => b.revenue - a.revenue)
        .map((c) => ({
          label: c.category,
          sublabel: `${formatNumber(c.returns)} returns`,
          value: formatMoney(c.revenue),
        })),
    })
  }

  // 6) Out-of-stock best-seller -------------------------------------------
  const outBestSellers = [...products]
    .filter((p) => p.stockStatus === 'Out of stock')
    .sort((a, b) => b.unitsSold - a.unitsSold)
  if (outBestSellers.length) {
    const top = outBestSellers[0]
    out.push({
      id: 'oos-bestseller',
      severity: 'high',
      title: 'Out-of-stock best-seller',
      metric: formatNumber(top.unitsSold),
      explanation: `${top.name} has sold ${formatNumber(top.unitsSold)} units but is now fully out of stock. ${outBestSellers.length} proven sellers are at zero inventory.`,
      action: `Expedite a purchase order for ${top.sku} — every day out of stock is lost demand from a known winner.`,
      category: 'Inventory',
      supportingTitle: 'Out-of-stock best-sellers',
      supporting: outBestSellers.slice(0, 6).map((p) => ({
        label: p.name,
        sublabel: `${p.sku} · ${formatNumber(p.unitsSold)} sold`,
        value: formatMoney(p.revenueCents),
        badge: { value: p.stockStatus, kind: 'stock' },
      })),
    })
  }

  // 7) Channel with best AOV ----------------------------------------------
  const channelAov = CHANNELS.map((ch) => {
    const live = orders.filter((o) => o.channel === ch && o.status !== 'Cancelled')
    const gross = live.reduce((s, o) => s + o.totalCents, 0)
    return { channel: ch, orders: live.length, aov: live.length ? Math.round(gross / live.length) : 0, gross }
  }).filter((c) => c.orders >= 5)
  if (channelAov.length) {
    const best = [...channelAov].sort((a, b) => b.aov - a.aov)[0]
    out.push({
      id: 'best-aov-channel',
      severity: 'low',
      title: 'Highest-value channel',
      metric: formatMoney(best.aov),
      explanation: `${best.channel} has the highest average order value at ${formatMoney(best.aov)} over ${formatNumber(best.orders)} orders — a strong candidate for incremental ad spend.`,
      action: `Shift acquisition budget toward ${best.channel} and test premium bundles where order values already run high.`,
      category: 'Channels',
      supportingTitle: 'Average order value by channel',
      supporting: [...channelAov]
        .sort((a, b) => b.aov - a.aov)
        .map((c) => ({
          label: c.channel,
          sublabel: `${formatNumber(c.orders)} orders · ${formatMoney(c.gross)} gross`,
          value: formatMoney(c.aov),
        })),
    })
  }

  // 8) Return reason concentration ----------------------------------------
  if (returns.length) {
    const byReason = RETURN_REASONS.map((reason) => ({
      reason,
      count: returns.filter((r) => r.reason === reason).length,
    })).filter((r) => r.count > 0)
    const topReason = [...byReason].sort((a, b) => b.count - a.count)[0]
    const share = (topReason.count / returns.length) * 100
    out.push({
      id: 'return-reason-concentration',
      severity: share >= 35 ? 'medium' : 'low',
      title: 'Return reason concentration',
      metric: formatPct(share),
      explanation: `"${topReason.reason}" drives ${formatPct(share)} of all returns (${formatNumber(topReason.count)} of ${formatNumber(returns.length)}). Concentrated reasons are the most fixable.`,
      action: `Tackle "${topReason.reason}" at the source — a single root-cause fix could remove a large share of returns.`,
      category: 'Returns',
      supportingTitle: 'Returns by reason',
      supporting: [...byReason]
        .sort((a, b) => b.count - a.count)
        .map((r) => ({
          label: r.reason,
          value: `${formatNumber(r.count)} · ${formatPct((r.count / returns.length) * 100)}`,
        })),
    })
  }

  return out
})

const severityFilter = ref<'all' | Insight['severity']>('all')

const visibleInsights = computed(() => {
  const list =
    severityFilter.value === 'all'
      ? insights.value
      : insights.value.filter((i) => i.severity === severityFilter.value)
  return [...list].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
})

const severityCounts = computed(() => ({
  high: insights.value.filter((i) => i.severity === 'high').length,
  medium: insights.value.filter((i) => i.severity === 'medium').length,
  low: insights.value.filter((i) => i.severity === 'low').length,
}))

const selected = ref<Insight | null>(null)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold">Operations insights</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Automated signals across inventory, fulfillment, returns and customers — ranked by severity.
        </p>
      </div>
    </div>

    <StateBlock :loading="data.loading && !data.loaded" :error="data.error">
      <!-- Summary + filter -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex flex-wrap gap-2">
          <span class="chip" :class="SEVERITY_CLASS.high">{{ severityCounts.high }} high</span>
          <span class="chip" :class="SEVERITY_CLASS.medium">{{ severityCounts.medium }} medium</span>
          <span class="chip" :class="SEVERITY_CLASS.low">{{ severityCounts.low }} low</span>
        </div>
        <SelectField v-model="severityFilter" label="Severity" class="ml-auto w-full sm:w-44">
          <option value="all">All severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </SelectField>
      </div>

      <StateBlock :empty="visibleInsights.length === 0" empty-text="No insights for this severity.">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="ins in visibleInsights"
            :key="ins.id"
            type="button"
            class="card flex flex-col gap-3 p-4 text-left transition hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-500/40"
            @click="selected = ins"
          >
            <div class="flex items-center justify-between gap-2">
              <StatusBadge :value="ins.severity" kind="severity" />
              <span class="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">{{ ins.category }}</span>
            </div>
            <h2 class="font-semibold leading-snug">{{ ins.title }}</h2>
            <p class="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{{ ins.metric }}</p>
            <p class="line-clamp-3 text-sm text-slate-500 dark:text-slate-400">{{ ins.explanation }}</p>
            <p class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span class="font-semibold text-slate-600 dark:text-slate-300">Suggested action:</span> {{ ins.action }}
            </p>
          </button>
        </div>
      </StateBlock>
    </StateBlock>

    <InsightsDetailModal :insight="selected" @close="selected = null" />
  </div>
</template>
