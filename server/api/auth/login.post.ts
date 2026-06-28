const DEMO = { email: 'demo@example.com', password: 'demo12345', name: 'Demo Merchant' }

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = (body?.email ?? '').trim().toLowerCase()
  const password = body?.password ?? ''

  if (email !== DEMO.email || password !== DEMO.password) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  return {
    token: 'demo-session-token',
    user: { email: DEMO.email, name: DEMO.name },
  }
})
