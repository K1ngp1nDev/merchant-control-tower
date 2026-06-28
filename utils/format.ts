export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100)
}

export function formatMoneyCompact(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format((cents || 0) / 100)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value || 0)
}

export function formatPct(value: number, digits = 1): string {
  return `${(value || 0).toFixed(digits)}%`
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7) // YYYY-MM
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  if (!y) return key
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(y, m - 1, 1))
}
