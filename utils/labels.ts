// Tailwind class maps for badges (light + dark) and hex palettes for charts.

export const STATUS_CLASS: Record<string, string> = {
  New: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
  Paid: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  Fulfillment: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  Shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  Returned: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  Cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

export const PAYMENT_CLASS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  Refunded: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'Partially Refunded': 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
}

export const SEGMENT_CLASS: Record<string, string> = {
  New: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  Returning: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  VIP: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'At-risk': 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  Wholesale: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
}

export const RETURN_STATUS_CLASS: Record<string, string> = {
  Requested: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  Approved: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  Received: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  Refunded: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  Rejected: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

export const STOCK_CLASS: Record<string, string> = {
  OK: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'Low stock': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'Out of stock': 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
}

export const SEVERITY_CLASS: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  low: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
}

// Chart palettes (theme-independent accent hexes)
export const STATUS_HEX: Record<string, string> = {
  New: '#94a3b8',
  Paid: '#0ea5e9',
  Fulfillment: '#f59e0b',
  Shipped: '#6366f1',
  Returned: '#f43f5e',
  Cancelled: '#cbd5e1',
}

export const CHANNEL_HEX: Record<string, string> = {
  Web: '#6366f1',
  Shopify: '#10b981',
  Amazon: '#f59e0b',
  Instagram: '#ec4899',
  Wholesale: '#0ea5e9',
}

export const CHANNELS = ['Web', 'Shopify', 'Amazon', 'Instagram', 'Wholesale'] as const
export const ORDER_STATUSES = ['New', 'Paid', 'Fulfillment', 'Shipped', 'Returned', 'Cancelled'] as const
export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Refunded', 'Partially Refunded'] as const
export const SEGMENTS = ['New', 'Returning', 'VIP', 'At-risk', 'Wholesale'] as const
export const RETURN_REASONS = [
  'Damaged',
  'Wrong item',
  'Not as described',
  'No longer needed',
  'Late delivery',
  'Quality',
] as const
export const CATEGORIES = ['Apparel', 'Footwear', 'Accessories', 'Home', 'Electronics', 'Beauty'] as const
