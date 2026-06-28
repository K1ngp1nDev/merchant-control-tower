export type OrderStatus = 'New' | 'Paid' | 'Fulfillment' | 'Shipped' | 'Returned' | 'Cancelled'
export type Channel = 'Web' | 'Shopify' | 'Amazon' | 'Instagram' | 'Wholesale'
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded' | 'Partially Refunded'
export type Segment = 'New' | 'Returning' | 'VIP' | 'At-risk' | 'Wholesale'
export type ReturnReason =
  | 'Damaged'
  | 'Wrong item'
  | 'Not as described'
  | 'No longer needed'
  | 'Late delivery'
  | 'Quality'
export type ReturnStatus = 'Requested' | 'Approved' | 'Received' | 'Refunded' | 'Rejected'
export type StockStatus = 'OK' | 'Low stock' | 'Out of stock'

export interface OrderItemDTO {
  id: number
  productId: number
  sku: string
  name: string
  category: string
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
}

export interface OrderDTO {
  id: number
  number: string
  customerId: number
  customerName: string
  segment: Segment
  channel: Channel
  status: OrderStatus
  paymentStatus: PaymentStatus
  placedAt: string
  slaDueAt: string
  shippedAt: string | null
  subtotalCents: number
  shippingCents: number
  discountCents: number
  totalCents: number
  priority: boolean
  note: string | null
  late: boolean
  items: OrderItemDTO[]
}

export interface ProductDTO {
  id: number
  sku: string
  name: string
  category: string
  priceCents: number
  costCents: number
  stock: number
  reorderThreshold: number
  unitsSold: number
  revenueCents: number
  marginCents: number
  stockStatus: StockStatus
}

export interface CustomerDTO {
  id: number
  name: string
  email: string
  segment: Segment
  location: string
  note: string | null
  createdAt: string
  ordersCount: number
  totalSpentCents: number
  lastOrderAt: string | null
  returnRate: number
  topProducts: { name: string; quantity: number }[]
  preferredChannel: Channel | null
}

export interface ReturnDTO {
  id: number
  orderId: number
  orderNumber: string
  productId: number
  productName: string
  category: string
  channel: Channel
  reason: ReturnReason
  amountCents: number
  status: ReturnStatus
  requestedAt: string
}

export interface BootstrapData {
  products: ProductDTO[]
  customers: CustomerDTO[]
  orders: OrderDTO[]
  returns: ReturnDTO[]
}
