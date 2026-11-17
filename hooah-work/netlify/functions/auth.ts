import { getUser, login, logout, verifyRequestOrigin } from '@netlify/identity'

export default async (request: Request) => {
  const url = new URL(request.url)
  const action = url.searchParams.get('action') ?? 'me'
  try {
    if (action === 'me') {
      const user = await getUser()
      if (!user) return Response.json({ authenticated: false }, { status: 401 })
      return Response.json({ authenticated: true, user: { id: user.id, email: user.email, roles: user.roles ?? [] } })
    }
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })
    verifyRequestOrigin(request)
    if (action === 'login') {
      const body = await request.json() as { email?: string; password?: string }
      if (!body.email || !body.password) return Response.json({ error: '請輸入 Email 與密碼' }, { status: 400 })
      await login(body.email, body.password)
      const user = await getUser()
      return Response.json({ authenticated: true, user: user ? { id: user.id, email: user.email, roles: user.roles ?? [] } : null })
    }
    if (action === 'logout') {
      await logout()
      return Response.json({ ok: true })
    }
    return Response.json({ error: 'Unknown action' }, { status: 404 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed'
    return Response.json({ error: message }, { status: 401 })
  }
}
