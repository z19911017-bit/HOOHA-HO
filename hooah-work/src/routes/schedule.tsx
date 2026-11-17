import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Users, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AvailabilityBadge } from '@/components/site/availability-badge'
import { Field } from '@/components/site/field'
import { availabilityOf, classTypeById, classTypes, coaches as seedCoaches, type Coach } from '@/data/fixtures'
import { addDays, dayPartLabel, endTime, fmtMD, inDayPart, isoDate, sameDay, sessionsForWeek, startOfWeek, toMinutes, weekdayLabels, type DayPart, type Session } from '@/lib/schedule'
import { cdn } from '@/lib/img'
import { cn } from '@/lib/utils'

type Search = { type?: string; coach?: string }

export const Route = createFileRoute('/schedule')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    type: typeof s.type === 'string' ? s.type : undefined,
    coach: typeof s.coach === 'string' ? s.coach : undefined,
  }),
  head: () => ({ meta: [{ title: '團體課表預約｜Hooah運動 板橋江翠店' }] }),
  component: SchedulePage,
})

function SchedulePage() {
  const search = Route.useSearch()
  const [now, setNow] = useState<Date | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [type, setType] = useState(search.type ?? 'all')
  const [coach, setCoach] = useState(search.coach ?? 'all')
  const [part, setPart] = useState<DayPart>('all')
  const [mobileDay, setMobileDay] = useState(0)
  const [extraBooked, setExtraBooked] = useState<Record<string, number>>({})
  const [mine, setMine] = useState<string[]>([])
  const [selected, setSelected] = useState<Session | null>(null)
  const [databaseSessions, setDatabaseSessions] = useState<Session[] | null>(null)
  const [coachList, setCoachList] = useState<Coach[]>(seedCoaches)
  const [classTypeList, setClassTypeList] = useState(classTypes)
  const [databaseError, setDatabaseError] = useState(false)

  useEffect(() => {
    const d = new Date()
    setNow(d)
    setMobileDay((d.getDay() + 6) % 7)
  }, [])

  const weekStart = useMemo(() => (now ? startOfWeek(now, weekOffset) : null), [now, weekOffset])
  useEffect(() => {
    fetch('/.netlify/functions/api?resource=public').then(r => r.ok ? r.json() : Promise.reject()).then(data => { if (Array.isArray(data.coaches)) setCoachList(data.coaches); if (Array.isArray(data.classTypes)) setClassTypeList(data.classTypes) }).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!weekStart) return
    setDatabaseSessions(null)
    const start = isoDate(weekStart)
    const end = isoDate(addDays(weekStart, 6))
    let active = true
    fetch(`/.netlify/functions/api?resource=public-sessions&start=${start}&end=${end}`)
      .then(async (r) => { if (!r.ok) throw new Error('database unavailable'); return r.json() })
      .then((data) => { if (active) { setDatabaseSessions((data.sessions ?? []).map((s: Record<string, unknown>) => ({ ...s, date: new Date(`${s.date}T12:00:00`), key: `${s.id}@${s.date}`, booked: Number(s.booked ?? 0), weekday: Number(s.weekday), durationMin: Number(s.durationMin), capacity: Number(s.capacity) })) as Session[]); setDatabaseError(false) } })
      .catch(() => { if (active) { setDatabaseSessions(null); setDatabaseError(true) } })
    return () => { active = false }
  }, [weekStart])

  const sessions = useMemo(() => {
    if (!weekStart) return []
    const source = databaseSessions ?? sessionsForWeek(weekStart)
    return source
      .map((s) => ({ ...s, booked: s.booked + (extraBooked[s.key] ?? 0) }))
      .filter((s) => (type === 'all' || s.classTypeId === type) && (coach === 'all' || s.coachId === coach) && inDayPart(s.start, part))
  }, [weekStart, databaseSessions, extraBooked, type, coach, part])

  const days = weekStart ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : []
  const isPast = (s: Session) => {
    if (!now) return false
    const t = new Date(s.date)
    t.setMinutes(toMinutes(s.start))
    return t < now
  }

  return (
    <div>
      <section className="border-b border-border bg-white text-foreground">
        <div className="mx-auto max-w-content px-4 pt-14 pb-10 sm:px-6">
          <p className="font-display text-lg tracking-widest text-primary uppercase">Track 01 / Group Class</p>
          <h1 className="mt-1 text-4xl font-black sm:text-6xl">團體課表預約</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">點選課表時段、填寫基本資料即可完成預約。小班制名額有限，建議提早預約。</p>

          <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="flex flex-wrap gap-2" role="group" aria-label="依課程類型篩選">
              <FilterChip active={type === 'all'} onClick={() => setType('all')}>全部課程</FilterChip>
              {classTypeList.map((c) => (
                <FilterChip key={c.id} active={type === c.id} onClick={() => setType(c.id)} color={c.color}>
                  {c.name}
                </FilterChip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <select aria-label="依時段篩選" value={part} onChange={(e) => setPart(e.target.value as DayPart)} className="h-9 rounded-md border border-input bg-white text-foreground px-3 text-sm">
                {Object.entries(dayPartLabel).map(([k, v]) => (
                  <option key={k} value={k} className="text-ink">{v}</option>
                ))}
              </select>
              <select aria-label="依教練篩選" value={coach} onChange={(e) => setCoach(e.target.value)} className="h-9 rounded-md border border-input bg-white text-foreground px-3 text-sm">
                <option value="all" className="text-ink">全部教練</option>
                {coachList.map((c) => (
                  <option key={c.id} value={c.id} className="text-ink">{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" disabled={weekOffset === 0} onClick={() => setWeekOffset((w) => w - 1)} aria-label="上一週"><ChevronLeft /></Button>
            <p className="flex min-w-48 items-center justify-center gap-2 font-black">
              <CalendarDays className="size-4 text-primary" />
              {weekStart ? `${fmtMD(weekStart)} – ${fmtMD(addDays(weekStart, 6))}` : '載入中'}
              {weekOffset === 0 && <span className="rounded-sm bg-primary px-1.5 text-xs text-primary-foreground">本週</span>}
            </p>
            <Button size="icon" variant="outline" disabled={weekOffset >= 2} onClick={() => setWeekOffset((w) => w + 1)} aria-label="下一週"><ChevronRight /></Button>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <AvailabilityBadge status="open" /> <AvailabilityBadge status="almost" /> <AvailabilityBadge status="full" />
          </div>
        </div>

        {!weekStart ? (
          <div className="grid gap-3 md:grid-cols-7">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
        ) : (
          <>
            {/* Mobile day picker */}
            <div className="mb-4 grid grid-cols-7 gap-1 md:hidden">
              {days.map((d, i) => (
                <button key={i} onClick={() => setMobileDay(i)} className={cn('rounded-md border py-2 text-center', i === mobileDay ? 'border-foreground bg-foreground text-white' : 'bg-card')}>
                  <span className="block text-[11px]">週{weekdayLabels[d.getDay()]}</span>
                  <span className="block font-display text-lg leading-tight">{d.getDate()}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-7">
              {days.map((d, i) => {
                const list = sessions.filter((s) => sameDay(s.date, d))
                const today = now && sameDay(d, now)
                return (
                  <div key={isoDate(d)} className={cn('min-w-0', i !== mobileDay && 'hidden md:block')}>
                    <div className={cn('mb-2 hidden items-baseline justify-between border-b-2 pb-2 md:flex', today ? 'border-primary' : 'border-ink')}>
                      <span className="font-black">週{weekdayLabels[d.getDay()]}</span>
                      <span className="font-display text-2xl">{fmtMD(d)}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {list.map((s) => (
                        <SessionCard key={s.key} s={s} coaches={coachList} classTypes={classTypeList} past={isPast(s)} mine={mine.includes(s.key)} onClick={() => setSelected(s)} />
                      ))}
                      {list.length === 0 && <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">無符合的課程</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      <BookingDialog
        session={selected}
        coaches={coachList}
        classTypes={classTypeList}
        onClose={() => setSelected(null)}
        onBooked={(s) => {
          setExtraBooked((m) => ({ ...m, [s.key]: (m[s.key] ?? 0) + 1 }))
          setMine((m) => [...m, s.key])
        }}
      />
    </div>
  )
}

function FilterChip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn('flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-foreground/40')}
    >
      {color && <span className="size-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}

function SessionCard({ s, coaches, classTypes: availableClassTypes, past, mine, onClick }: { s: Session; coaches: Coach[]; classTypes: typeof classTypes; past: boolean; mine: boolean; onClick: () => void }) {
  const ct = availableClassTypes.find((item) => item.id === s.classTypeId) ?? classTypeById(s.classTypeId)!
  const coach = coaches.find(c => c.id === s.coachId)
  const status = availabilityOf(s.booked, s.capacity)
  const disabled = past
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative w-full overflow-hidden rounded-md border bg-card p-3 pl-4 text-left transition-all hover:border-ink hover:shadow-[3px_3px_0_var(--ink)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:shadow-none motion-reduce:transition-none',
        mine && 'border-primary ring-1 ring-primary',
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: ct.color }} />
      <div className="flex items-center justify-between gap-1">
        <span className="font-display text-xl leading-none">{s.start}</span>
        {past ? <span className="text-[11px] text-muted-foreground">已結束</span> : <AvailabilityBadge status={status} className="text-[10px]" />}
      </div>
      <p className="mt-1.5 font-black leading-tight">{ct.name}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{coach?.name ?? '教練'}・{s.room}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-ink" style={{ width: `${(s.booked / s.capacity) * 100}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{s.booked}/{s.capacity} 人{mine && <span className="ml-1 font-bold text-primary">・已預約</span>}</p>
    </button>
  )
}

function BookingDialog({ session, coaches, classTypes: availableClassTypes, onClose, onBooked }: { session: Session | null; coaches: Coach[]; classTypes: typeof classTypes; onClose: () => void; onBooked: (s: Session) => void }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', lineNotify: true })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (session) {
      setDone(false)
      setErrors({})
    }
  }, [session])

  if (!session) return null
  const ct = availableClassTypes.find((item) => item.id === session.classTypeId) ?? classTypeById(session.classTypeId)!
  const coach = coaches.find(c => c.id === session.coachId)
  const full = session.booked >= session.capacity

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = '請填寫姓名'
    if (!/^09\d{8}$/.test(form.phone.replace(/[-\s]/g, ''))) errs.phone = '請填寫 09 開頭的 10 碼手機號碼'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Email 格式不正確'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setPending(true)
    try {
      const response = await fetch('/.netlify/functions/api?resource=class-booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slotId: session.id, date: isoDate(session.date), name: form.name, phone: form.phone, email: form.email, lineNotify: form.lineNotify }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '預約失敗')
      setDone(true)
      onBooked(session)
      toast.success(data.status === 'waitlist' ? '已加入候補名單' : '預約成功', { description: `${ct.name}・${fmtMD(session.date)} ${session.start}・預約代碼 ${data.booking_code}` })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '預約失敗，請稍後再試')
    } finally { setPending(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <div className="relative bg-ink p-6 text-background">
          <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: ct.color }} />
          <DialogHeader className="text-left">
            <p className="font-display tracking-widest text-primary">{ct.en}</p>
            <DialogTitle className="text-3xl font-black">{ct.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {session.date.getMonth() + 1} 月 {session.date.getDate()} 日（週{weekdayLabels[session.date.getDay()]}）{session.start}–{endTime(session.start, session.durationMin)}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-background/80">
            <span className="flex items-center gap-2"><img src={cdn(coach?.avatar ?? '/img/coaching.png', 64, 64)} alt="" className="size-6 rounded-full object-cover" />{coach?.name ?? '教練'}</span>
            <span className="flex items-center gap-1"><MapPin className="size-4" />{session.room}</span>
            <span className="flex items-center gap-1"><Users className="size-4" />{session.booked}/{session.capacity}</span>
          </div>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto size-14 text-primary" />
            <p className="mt-4 text-2xl font-black">預約完成！</p>
            <p className="mt-2 text-sm text-muted-foreground">預約資料已儲存。預約確認及提醒通知功能需完成郵件與 LINE 服務設定後啟用。請於開課前 10 分鐘報到。</p>
            <Button className="mt-6 w-full" onClick={onClose}>回到課表</Button>
          </div>
        ) : full ? (
          <div className="p-8 text-center">
            <p className="text-xl font-black">此堂課已額滿</p>
            <p className="mt-2 text-sm text-muted-foreground">請選擇其他時段，或透過 LINE 詢問候補名額。</p>
            <Button className="mt-6 w-full" variant="outline" onClick={onClose}>選擇其他時段</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 p-6" noValidate>
            <Field id="name" label="姓名" error={errors.name}>
              <Input id="name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="phone" label="手機" error={errors.phone}>
                <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0912345678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-invalid={!!errors.phone} />
              </Field>
              <Field id="email" label="Email" error={errors.email}>
                <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.lineNotify} onCheckedChange={(v) => setForm({ ...form, lineNotify: v === true })} />
              課前一天以 LINE 提醒我
            </label>
            <DialogFooter>
              <Button type="submit" size="lg" className="w-full font-bold" disabled={pending}>
                {pending ? '送出中…' : '確認預約'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
