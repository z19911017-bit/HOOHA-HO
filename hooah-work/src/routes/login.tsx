import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { LockKeyhole, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/site/field'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: '後台登入｜Hooah運動' }, { name: 'robots', content: 'noindex' }] }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const response = await fetch('/.netlify/functions/auth?action=login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '登入失敗，請確認帳號密碼')
      const roles = data.user?.roles ?? []
      if (!roles.includes('admin') && !roles.includes('coach')) throw new Error('帳號密碼正確，但此帳號尚未設定 Netlify Identity admin／coach 權限。請在 Identity 使用者的 App metadata 設定 roles。')
      const access = await fetch('/.netlify/functions/api?resource=admin-bootstrap', { credentials: 'include' })
      const accessData = await access.json().catch(() => ({}))
      if (!access.ok) throw new Error(accessData.error || '登入成功，但後台權限驗證未通過。請確認 Netlify Database migrations 已完成。')
      toast.success('登入成功，正在進入後台')
      await navigate({ to: '/admin' })
    } catch (e) {
      setError(e instanceof Error ? e.message : '登入失敗')
    } finally { setPending(false) }
  }

  return <div className="min-h-[75vh] bg-muted/40 px-4 py-16">
    <div className="mx-auto max-w-md rounded-xl border bg-card p-7 shadow-sm sm:p-9">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><LockKeyhole className="size-7" /></div>
      <p className="text-center font-display tracking-widest text-primary uppercase">Hooah Admin</p>
      <h1 className="mt-1 text-center text-3xl font-black">後台登入</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">管理員與教練請使用專屬帳號登入。</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <Field id="login-email" label="Email"><Input id="login-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field id="login-password" label="密碼"><Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></Field>
        {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? '登入中…' : <><LogIn className="mr-2 size-4" />登入後台</>}</Button>
        <p className="text-center text-sm"><a className="text-primary underline underline-offset-4" href="/reset-password">忘記密碼？重設密碼</a></p>
      </form>
    </div>
  </div>
}
