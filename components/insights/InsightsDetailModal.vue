<script setup lang="ts">
export interface SupportingRow {
  label: string
  sublabel?: string
  value?: string
  badge?: { value: string; kind: 'status' | 'payment' | 'segment' | 'return' | 'stock' | 'severity' }
}

export interface Insight {
  id: string
  severity: 'high' | 'medium' | 'low'
  title: string
  metric: string
  explanation: string
  action: string
  category: string
  supportingTitle?: string
  supporting?: SupportingRow[]
}

const props = defineProps<{ insight: Insight | null }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Modal :open="insight !== null" :title="insight?.title" :subtitle="insight?.category" @close="emit('close')">
    <div v-if="insight" class="space-y-5">
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge :value="insight.severity" kind="severity" />
        <span class="text-xs text-slate-400">{{ insight.category }}</span>
      </div>

      <div>
        <p class="text-3xl font-bold tabular-nums">{{ insight.metric }}</p>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ insight.explanation }}</p>
      </div>

      <div class="rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-500/10">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">Suggested action</p>
        <p class="mt-1 text-sm text-slate-700 dark:text-slate-200">{{ insight.action }}</p>
      </div>

      <div v-if="insight.supporting && insight.supporting.length" class="space-y-2">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {{ insight.supportingTitle || 'Details' }}
        </p>
        <div
          v-for="(row, i) in insight.supporting"
          :key="i"
          class="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ row.label }}</p>
            <p v-if="row.sublabel" class="truncate text-xs text-slate-400">{{ row.sublabel }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <span v-if="row.value" class="text-sm tabular-nums">{{ row.value }}</span>
            <StatusBadge v-if="row.badge" :value="row.badge.value" :kind="row.badge.kind" />
          </div>
        </div>
      </div>
    </div>
    <p class="pt-4 text-center text-xs text-slate-400">Operational analytics · synthetic demo data</p>
  </Modal>
</template>
