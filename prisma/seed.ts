import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// --- deterministic PRNG (mulberry32) ---
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(0x5eed1234)
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const chance = (p: number) => rand() < p
function weighted<T>(entries: [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [v, w] of entries) if ((r -= w) <= 0) return v
  return entries[0][0]
}

const NOW = new Date()
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86400000)
const addDays = (date: Date, d: number) => new Date(date.getTime() + d * 86400000)

const CATEGORIES = ['Apparel', 'Footwear', 'Accessories', 'Home', 'Electronics', 'Beauty']
const CHANNELS = ['Web', 'Shopify', 'Amazon', 'Instagram', 'Wholesale']
const SEGMENTS = ['New', 'Returning', 'VIP', 'At-risk', 'Wholesale']
const RETURN_REASONS = ['Damaged', 'Wrong item', 'Not as described', 'No longer needed', 'Late delivery', 'Quality']

const PRODUCT_NAMES: Record<string, string[]> = {
  Apparel: ['Merino Crew Sweater', 'Linen Shirt', 'Quilted Jacket', 'Tailored Chinos', 'Cotton Hoodie', 'Wool Overcoat', 'Pique Polo'],
  Footwear: ['Trail Runner', 'Leather Loafer', 'Canvas Sneaker', 'Chelsea Boot', 'Running Trainer', 'Suede Derby'],
  Accessories: ['Leather Belt', 'Wool Beanie', 'Canvas Tote', 'Silk Scarf', 'Aviator Sunglasses', 'Card Wallet'],
  Home: ['Ceramic Mug Set', 'Linen Duvet', 'Scented Candle', 'Cast Iron Pan', 'Throw Blanket', 'Glass Carafe'],
  Electronics: ['Wireless Earbuds', 'USB-C Hub', 'Mechanical Keyboard', 'Portable SSD', 'Smart Bulb', 'Noise Meter'],
  Beauty: ['Vitamin C Serum', 'Hydrating Cream', 'Matte Lipstick', 'Clay Mask', 'Beard Oil', 'Bath Salts'],
}
const FIRST = ['Ava', 'Liam', 'Mia', 'Noah', 'Zoe', 'Ethan', 'Lena', 'Owen', 'Ruby', 'Theo', 'Iris', 'Leo', 'Nora', 'Kai', 'Elsa', 'Jonah', 'Maya', 'Felix', 'Cleo', 'Anya', 'Dean', 'Sofia', 'Otto', 'Greta', 'Hugo', 'Vera', 'Milo', 'Asha', 'Reid', 'Nina']
const LAST = ['Carter', 'Nguyen', 'Patel', 'Brooks', 'Sato', 'Romano', 'Larsen', 'Okoro', 'Mendez', 'Khan', 'Walsh', 'Ortega', 'Fischer', 'Bauer', 'Costa', 'Nowak', 'Ibrahim', 'Park', 'Russo', 'Holt']
const CITIES = ['Austin, US', 'Berlin, DE', 'Toronto, CA', 'London, UK', 'Lyon, FR', 'Denver, US', 'Porto, PT', 'Oslo, NO', 'Dublin, IE', 'Madrid, ES']

async function run() {
  // Reset
  await prisma.return.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.customer.deleteMany()

  // Products
  const products = []
  let skuSeq = 1000
  for (const category of CATEGORIES) {
    const names = PRODUCT_NAMES[category]
    const count = randInt(5, 6)
    for (let i = 0; i < count; i++) {
      const name = names[i % names.length] + (i >= names.length ? ` ${i}` : '')
      const priceCents = randInt(15, 240) * 100 - 1
      const costCents = Math.round(priceCents * (0.38 + rand() * 0.27))
      // bias some products to low / out of stock
      const stock = weighted<number>([
        [0, 1],
        [randInt(1, 8), 2],
        [randInt(9, 40), 4],
        [randInt(41, 180), 5],
      ])
      products.push(
        await prisma.product.create({
          data: {
            sku: `${category.slice(0, 3).toUpperCase()}-${skuSeq++}`,
            name,
            category,
            priceCents,
            costCents,
            stock,
            reorderThreshold: randInt(10, 40),
            createdAt: daysAgo(randInt(180, 360)),
          },
        }),
      )
    }
  }

  // Customers
  const customers = []
  const usedEmails = new Set<string>()
  for (let i = 0; i < 30; i++) {
    const first = pick(FIRST)
    const last = pick(LAST)
    let email = `${first}.${last}${i}`.toLowerCase() + '@example.test'
    while (usedEmails.has(email)) email = `${first}.${last}${i}${randInt(1, 99)}`.toLowerCase() + '@example.test'
    usedEmails.add(email)
    customers.push(
      await prisma.customer.create({
        data: {
          name: `${first} ${last}`,
          email,
          segment: weighted([['Returning', 5], ['New', 4], ['VIP', 2], ['Wholesale', 2], ['At-risk', 2]]),
          location: pick(CITIES),
          note: chance(0.25) ? pick(['High LTV potential', 'Prefers fast shipping', 'Frequent support contact', 'Wholesale terms net-30']) : null,
          createdAt: daysAgo(randInt(180, 540)),
        },
      }),
    )
  }

  // Orders
  const ORDER_COUNT = 130
  let orderSeq = 1001
  for (let i = 0; i < ORDER_COUNT; i++) {
    const customer = pick(customers)
    const channel = customer.segment === 'Wholesale'
      ? 'Wholesale'
      : weighted([['Web', 6], ['Shopify', 4], ['Amazon', 3], ['Instagram', 2], ['Wholesale', 1]])
    const ageDays = randInt(0, 180)
    const placedAt = new Date(daysAgo(ageDays).getTime() + randInt(0, 23) * 3600000)

    // Items
    const lineCount = randInt(1, 4)
    const chosen = new Set<number>()
    let subtotal = 0
    const items: { productId: number; quantity: number; unitPriceCents: number; lineTotalCents: number }[] = []
    for (let j = 0; j < lineCount; j++) {
      const product = pick(products)
      if (chosen.has(product.id)) continue
      chosen.add(product.id)
      const quantity = randInt(1, channel === 'Wholesale' ? 12 : 4)
      const lineTotal = product.priceCents * quantity
      subtotal += lineTotal
      items.push({ productId: product.id, quantity, unitPriceCents: product.priceCents, lineTotalCents: lineTotal })
    }

    const shippingCents = channel === 'Wholesale' || subtotal > 15000 ? 0 : pick([599, 899, 1299])
    const discountCents = chance(0.28) ? Math.round(subtotal * pick([0.05, 0.1, 0.15])) : 0
    const totalCents = subtotal + shippingCents - discountCents

    // Status biased by age. Open orders stay recent (within SLA) so the
    // fulfillment numbers read like a healthy operation, not a backlog.
    const status = ageDays <= 4
      ? weighted([['New', 2], ['Paid', 3], ['Fulfillment', 3], ['Shipped', 2]])
      : ageDays <= 25
        ? weighted([['Shipped', 11], ['Fulfillment', 1], ['Returned', 1], ['Cancelled', 1]])
        : weighted([['Shipped', 14], ['Returned', 2], ['Cancelled', 1]])

    const paymentStatus = status === 'New'
      ? 'Pending'
      : status === 'Cancelled'
        ? weighted([['Refunded', 2], ['Pending', 1]])
        : status === 'Returned'
          ? weighted([['Refunded', 2], ['Partially Refunded', 2], ['Paid', 1]])
          : 'Paid'

    const slaDays = channel === 'Wholesale' ? 5 : pick([2, 3])
    const slaDueAt = addDays(placedAt, slaDays)
    const shipped = status === 'Shipped' || status === 'Returned'
    const shippedLate = chance(0.16)
    const shippedAt = shipped
      ? addDays(placedAt, shippedLate ? slaDays + randInt(1, 4) : randInt(1, Math.max(1, slaDays)))
      : null

    await prisma.order.create({
      data: {
        number: `MCT-${orderSeq++}`,
        customerId: customer.id,
        channel,
        status,
        paymentStatus,
        placedAt,
        slaDueAt,
        shippedAt,
        subtotalCents: subtotal,
        shippingCents,
        discountCents,
        totalCents,
        priority: chance(0.12),
        note: chance(0.18) ? pick(['Customer requested gift wrap', 'Address verified by phone', 'Split shipment approved', 'VIP — expedite']) : null,
        items: { create: items },
      },
    })
  }

  // Returns — for returned orders + a few shipped ones
  const ordersWithItems = await prisma.order.findMany({ include: { items: true } })
  let returnsCreated = 0
  for (const order of ordersWithItems) {
    const makeReturn = order.status === 'Returned' || (order.status === 'Shipped' && chance(0.04))
    if (!makeReturn || order.items.length === 0) continue
    const item = order.items[Math.floor(rand() * order.items.length)]
    const base = order.shippedAt ?? order.placedAt
    await prisma.return.create({
      data: {
        orderId: order.id,
        productId: item.productId,
        reason: weighted([
          ['Damaged', 3],
          ['Wrong item', 2],
          ['Not as described', 2],
          ['No longer needed', 3],
          ['Late delivery', 1],
          ['Quality', 2],
        ]),
        amountCents: chance(0.7) ? item.lineTotalCents : Math.round(item.lineTotalCents / item.quantity),
        status: weighted([['Refunded', 4], ['Received', 3], ['Approved', 2], ['Requested', 2], ['Rejected', 1]]),
        requestedAt: addDays(base, randInt(1, 12)),
      },
    })
    returnsCreated++
  }

  const counts = {
    products: products.length,
    customers: customers.length,
    orders: ORDER_COUNT,
    returns: returnsCreated,
  }
  console.log('Seeded:', counts)
}

run()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
