import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/site/field'

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [{ title: '重設密碼｜Hooah運動' }, { name: 'robots', content: 'noindex' }] }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Netlify Identity recovery links return recovery_token in the URL fragment.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const recoveryToken = hash.get('recovery_token')
    if (recoveryToken) setToken(recoveryToken)
  }, [])

  async function requestReset(event: React.FormEvent) {
    event.preventDefault()
    setPending(true); setError('')
    try {
      const response = await fetch('/.netlify/identity/recovery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirect_url: `${window.location.origin}/reset-password` }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.msg || data.message || '寄送失敗，請稍後再試')
      }
      setSent(true); toast.success('已寄出密碼重設信')
    } catch (e) { setError(e instanceof Error ? e.message : '寄送失敗') }
    finally { setPending(false) }
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 8) { setError('密碼至少需要 8 個字元'); return }
    if (password !== confirm) { setError('兩次輸入的密碼不一致'); return }
    setPending(true)
    try {
      const response = await fetch('/.netlify/identity/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.msg || data.message || '重設失敗，請重新申請重設連結')
      toast.success('密碼設定成功，請重新登入')
      await navigate({ to: '/login' })
    } catch (e) { setError(e instanceof Error ? e.message : '重設失敗') }
    finally { setPending(false) }
  }

  return <div className="min-h-[75vh] bg-muted/40 px-4 py-16">
    <div className="mx-auto max-w-md rounded-xl border bg-card p-7 shadow-sm sm:p-9">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><KeyRound className="size-7" /></div>
      <p className="text-center font-display tracking-widest text-primary uppercase">Hooah Admin</p>
      <h1 className="mt-1 text-center text-3xl font-black">重設密碼</h1>
      {!token ? <>
        <p className="mt-2 text-center text-sm text-muted-foreground">輸入管理員帳號 Email，我們將寄送密碼重設連結。</p>
        {sent ? <p className="mt-5 rounded-md bg-primary/10 p-3 text-sm">若此 Email 已註冊，將收到重設密碼信件。請查看信箱並點擊連結。</p> :
        <form onSubmit={requestReset} className="mt-7 space-y-4">
          <Field id="reset-email" label="Email"><Input id="reset-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></Field>
          {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? '寄送中…' : '寄送重設連結'}</Button>
        </form>}
        </> : <>
        <p className="mt-2 text-center text-sm text-muted-foreground">請設定新密碼。</p>
        <form onSubmit={updatePassword} className="mt-7 space-y-4">
          <Field id="new-password" label="新密碼"><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></Field>
          <Field id="confirm-password" label="確認新密碼"><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} /></Field>
          {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? '設定中…' : '確認重設密碼'}</Button>
        </form>
      </>}
      <p className="mt-5 text-center text-sm"><a className="text-primary underline underline-offset-4" href="/login">返回登入</a></p>
    </div>
  </div>
}
