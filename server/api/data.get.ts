import type {
  BootstrapData,
  Channel,
  CustomerDTO,
  OrderDTO,
  ProductDTO,
  ReturnDTO,
  Segment,
  StockStatus,
} from '~/types'

export default defineEventHandler(async (event): Promise<BootstrapData> => {
  const auth = getHeader(event, 'authorization') ?? ''
  if (!auth.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const prisma = usePrisma()
  const now = Date.now()

  const [orders, products, customers, returns] = await Promise.all([
    prisma.order.findMany({
      include: { items: { include: { product: true } }, customer: true },
      orderBy: { placedAt: 'desc' },
    }),
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
    prisma.customer.findMany({ orderBy: { name: 'asc' } }),
    prisma.return.findMany({ include: { order: { include: { customer: true } }, product: true } }),
  ])

  const isLate = (o: (typeof orders)[number]): boolean => {
    const due = o.slaDueAt.getTime()
    if (o.shippedAt) return o.shippedAt.getTime() > due
    return now > due && ['New', 'Paid', 'Fulfillment'].includes(o.status)
  }

  const orderDtos: OrderDTO[] = orders.map((o) => ({
    id: o.id,
    number: o.number,
    customerId: o.customerId,
    customerName: o.customer.name,
    segment: o.customer.segment as Segment,
    channel: o.channel as Channel,
    status: o.status as OrderDTO['status'],
    paymentStatus: o.paymentStatus as OrderDTO['paymentStatus'],
    placedAt: o.placedAt.toISOString(),
    slaDueAt: o.slaDueAt.toISOString(),
    shippedAt: o.shippedAt ? o.shippedAt.toISOString() : null,
    subtotalCents: o.subtotalCents,
    shippingCents: o.shippingCents,
    discountCents: o.discountCents,
    totalCents: o.totalCents,
    priority: o.priority,
    note: o.note,
    late: isLate(o),
    items: o.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      sku: it.product.sku,
      name: it.product.name,
      category: it.product.category,
      quantity: it.quantity,
      unitPriceCents: it.unitPriceCents,
      lineTotalCents: it.lineTotalCents,
    })),
  }))

  // --- product aggregates (exclude cancelled orders from sales) ---
  const soldUnits = new Map<number, number>()
  const soldRevenue = new Map<number, number>()
  for (const o of orders) {
    if (o.status === 'Cancelled') continue
    for (const it of o.items) {
      soldUnits.set(it.productId, (soldUnits.get(it.productId) ?? 0) + it.quantity)
      soldRevenue.set(it.productId, (soldRevenue.get(it.productId) ?? 0) + it.lineTotalCents)
    }
  }
  const productDtos: ProductDTO[] = products.map((p) => {
    const unitsSold = soldUnits.get(p.id) ?? 0
    const revenueCents = soldRevenue.get(p.id) ?? 0
    const stockStatus: StockStatus = p.stock === 0 ? 'Out of stock' : p.stock <= p.reorderThreshold ? 'Low stock' : 'OK'
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      priceCents: p.priceCents,
      costCents: p.costCents,
      stock: p.stock,
      reorderThreshold: p.reorderThreshold,
      unitsSold,
      revenueCents,
      marginCents: revenueCents - p.costCents * unitsSold,
      stockStatus,
    }
  })

  // --- customer aggregates ---
  const returnsByCustomer = new Map<number, number>()
  for (const r of returns) returnsByCustomer.set(r.order.customerId, (returnsByCustomer.get(r.order.customerId) ?? 0) + 1)

  const customerDtos: CustomerDTO[] = customers.map((c) => {
    const theirs = orders.filter((o) => o.customerId === c.id && o.status !== 'Cancelled')
    const ordersCount = theirs.length
    const totalSpentCents = theirs.reduce((s, o) => s + o.totalCents, 0)
    const lastOrderAt = theirs.length ? theirs.map((o) => o.placedAt.getTime()).sort((a, b) => b - a)[0] : null
    const channelCounts = new Map<string, number>()
    const productQty = new Map<string, number>()
    for (const o of theirs) {
      channelCounts.set(o.channel, (channelCounts.get(o.channel) ?? 0) + 1)
      for (const it of o.items) productQty.set(it.product.name, (productQty.get(it.product.name) ?? 0) + it.quantity)
    }
    const preferredChannel =
      [...channelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    const topProducts = [...productQty.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, quantity]) => ({ name, quantity }))
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      segment: c.segment as Segment,
      location: c.location,
      note: c.note,
      createdAt: c.createdAt.toISOString(),
      ordersCount,
      totalSpentCents,
      lastOrderAt: lastOrderAt ? new Date(lastOrderAt).toISOString() : null,
      returnRate: ordersCount ? ((returnsByCustomer.get(c.id) ?? 0) / ordersCount) * 100 : 0,
      topProducts,
      preferredChannel: preferredChannel as Channel | null,
    }
  })

  const returnDtos: ReturnDTO[] = returns
    .map((r) => ({
      id: r.id,
      orderId: r.orderId,
      orderNumber: r.order.number,
      productId: r.productId,
      productName: r.product.name,
      category: r.product.category,
      channel: r.order.channel as Channel,
      reason: r.reason as ReturnDTO['reason'],
      amountCents: r.amountCents,
      status: r.status as ReturnDTO['status'],
      requestedAt: r.requestedAt.toISOString(),
    }))
    .sort((a, b) => +new Date(b.requestedAt) - +new Date(a.requestedAt))

  return { products: productDtos, customers: customerDtos, orders: orderDtos, returns: returnDtos }
})
