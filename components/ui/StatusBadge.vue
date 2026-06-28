<script setup lang="ts">
type Kind = 'status' | 'payment' | 'segment' | 'return' | 'stock' | 'severity' | 'plain'

const props = withDefaults(defineProps<{ value: string; kind?: Kind }>(), { kind: 'plain' })

const MAPS: Record<string, Record<string, string>> = {
  status: STATUS_CLASS,
  payment: PAYMENT_CLASS,
  segment: SEGMENT_CLASS,
  return: RETURN_STATUS_CLASS,
  stock: STOCK_CLASS,
  severity: SEVERITY_CLASS,
}

const cls = computed(() => {
  const map = props.kind !== 'plain' ? MAPS[props.kind] : undefined
  return (map && map[props.value]) || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
})
</script>

<template>
  <span class="chip" :class="cls">{{ value }}</span>
</template>
