import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/site/field'
import { LineIcon } from '@/components/site/line-icon'
import { coaches as seedCoaches, consultServices, store, type Coach } from '@/data/fixtures'
import { addDays, fmtMD, fromMinutes, toMinutes, weekdayLabels } from '@/lib/schedule'
import { cdn } from '@/lib/img'
import { cn } from '@/lib/utils'

type Search = { coach?: string }

export const Route = createFileRoute('/consult')({
  validateSearch: (s: Record<string, unknown>): Search => ({ coach: typeof s.coach === 'string' ? s.coach : undefined }),
  head: () => ({ meta: [{ title: '預約減重諮詢｜Hooah運動 板橋江翠店' }] }),
  component: ConsultPage,
})

const steps = ['服務項目', '選擇教練', '選擇時段', '基本資料', '確認送出']
const OPEN = toMinutes('09:00')
const CLOSE = toMinutes('21:00')

function ConsultPage() {
  const search = Route.useSearch()
  const [step, setStep] = useState(0)
  const [serviceId, setServiceId] = useState(consultServices[0].id)
  const [duration, setDuration] = useState(60)
  const [coachList, setCoachList] = useState<Coach[]>(seedCoaches)
  const [busyConsults, setBusyConsults] = useState<Array<{ startsAt: string; durationMin: number }>>([])
  const [coachId, setCoachId] = useState<string | null>(search.coach && seedCoaches.some(c => c.id === search.coach) ? search.coach : null)
  const [today, setToday] = useState<Date | null>(null)
  const [dayIdx, setDayIdx] = useState(0)
  const [time, setTime] = useState<string | null>(null)
  const [info, setInfo] = useState({ name: '', phone: '', height: '', weight: '', goal: '', habit: '', note: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => setToday(new Date()), [])
  useEffect(() => {
    fetch('/.netlify/functions/api?resource=public').then(r => r.ok ? r.json() : Promise.reject()).then(data => { if (Array.isArray(data.coaches)) setCoachList(data.coaches) }).catch(() => undefined)
  }, [])

  const service = consultServices.find((s) => s.id === serviceId)!
  const coach = coachId ? coachList.find(c => c.id === coachId) : undefined
  const selectedDate = today ? addDays(today, dayIdx) : null

  useEffect(() => {
    if (!coachId || !today) return
    const startDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
    const end = addDays(today, 14)
    const endDate = `${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`
    fetch(`/.netlify/functions/api?resource=consult-busy&coachId=${encodeURIComponent(coachId)}&startDate=${startDate}&endDate=${endDate}`).then(r => r.ok ? r.json() : Promise.reject()).then(data => setBusyConsults(data.busy ?? [])).catch(() => setBusyConsults([]))
  }, [coachId, today])

  const days = useMemo(() => {
    if (!today || !coach) return []
    return Array.from({ length: 14 }, (_, i) => ({ i, date: addDays(today, i) })).filter((d) => coach.workingDays.includes(d.date.getDay()))
  }, [today, coach])

  const slots = useMemo(() => {
    if (!today || !coach) return []
    const out: { t: string; busy: boolean }[] = []
    const nowMin = dayIdx === 0 ? today.getHours() * 60 + today.getMinutes() + 60 : 0
    const start = Math.max(OPEN, toMinutes(coach.workStart))
    const end = Math.min(CLOSE, toMinutes(coach.workEnd))
    for (let m = start; m + duration <= end; m += duration === 45 ? 45 : 60) {
      if (m < nowMin) continue
      const dayKey = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}` : ''
      const busy = busyConsults.some((booking) => {
        const starts = new Date(booking.startsAt)
        const bookingDay = `${starts.getFullYear()}-${String(starts.getMonth()+1).padStart(2,'0')}-${String(starts.getDate()).padStart(2,'0')}`
        if (bookingDay !== dayKey) return false
        const b = starts.getHours() * 60 + starts.getMinutes()
        return m < b + Number(booking.durationMin) && b < m + duration
      })
      out.push({ t: fromMinutes(m), busy })
    }
    return out
  }, [today, coach, dayIdx, duration, selectedDate, busyConsults])

  useEffect(() => {
    if (days.length && !days.some((d) => d.i === dayIdx)) setDayIdx(days[0].i)
  }, [days, dayIdx])

  const canNext = [true, !!coach, !!time, true, true][step]

  const validateInfo = () => {
    const e: Record<string, string> = {}
    if (!info.name.trim()) e.name = '請填寫姓名'
    if (!/^09\d{8}$/.test(info.phone.replace(/[-\s]/g, ''))) e.phone = '請填寫 09 開頭的 10 碼手機號碼'
    if (!info.height || Number(info.height) < 100 || Number(info.height) > 230) e.height = '請填寫身高（cm）'
    if (!info.weight || Number(info.weight) < 30 || Number(info.weight) > 250) e.weight = '請填寫體重（kg）'
    if (!info.habit) e.habit = '請選擇運動習慣'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (step === 3 && !validateInfo()) return
    setStep((s) => Math.min(4, s + 1))
  }

  const submit = async () => {
    if (!coach || !selectedDate || !time) return
    setPending(true)
    try {
      const startsAt = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}T${time}:00+08:00`
      const response = await fetch('/.netlify/functions/api?resource=consult-booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, coachId: coach.id, name: info.name, phone: info.phone, height: info.height, weight: info.weight, goal: info.goal, habit: info.habit, note: info.note, startsAt, duration }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '諮詢預約失敗')
      setDone(true)
      toast.success('諮詢預約資料已送出', { description: `預約編號 ${data.booking?.id ?? ''}` })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '預約失敗，請稍後再試')
    } finally { setPending(false) }
  }

  return (
    <div className="min-h-[80vh]">
      <section className="border-b border-border bg-white text-foreground">
        <div className="mx-auto max-w-content px-4 pt-14 pb-8 sm:px-6">
          <p className="font-display text-lg tracking-widest text-primary uppercase">Track 02 / 1-on-1 Consultation</p>
          <h1 className="mt-1 text-4xl font-black sm:text-6xl">預約減重諮詢</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">選擇服務與專屬教練，挑一個 09:00–21:00 的空檔。預約成功後會同步通知教練與門市。</p>
          {!done && (
            <ol className="mt-8 grid grid-cols-5 gap-1.5" aria-label="預約步驟">
              {steps.map((s, i) => (
                <li key={s}>
                  <div className={cn('h-1.5 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')} />
                  <p className={cn('mt-2 hidden text-xs font-bold sm:block', i === step ? 'text-foreground' : 'text-muted-foreground/70')}>
                    {String(i + 1).padStart(2, '0')} {s}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {done ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center sm:p-12">
            <CheckCircle2 className="mx-auto size-16 text-primary" />
            <h2 className="mt-4 text-3xl font-black">預約成功！</h2>
            <p className="mt-2 text-muted-foreground">
              {coach?.name} 將於 {selectedDate && `${fmtMD(selectedDate)}（週${weekdayLabels[selectedDate.getDay()]}）`} {time} 與你進行 {duration} 分鐘的{service.name}。
            </p>
            <p className="mt-1 text-sm text-muted-foreground">預約資料已儲存；Email／LINE 通知需完成服務設定後啟用，門市將再以電話或 LINE 與你確認。</p>
            <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
              {coach && (
                <Button asChild className="bg-line font-bold text-white hover:bg-line/90">
                  <a href={coach.lineUrl} target="_blank" rel="noreferrer"><LineIcon className="size-4" /> 加 {coach.name} LINE</a>
                </Button>
              )}
              <Button asChild variant="outline"><Link to="/schedule">順便看看團體課</Link></Button>
            </div>
          </div>
        ) : (
          <>
            {step === 0 && (
              <StepBlock title="想諮詢什麼？">
                <div className="grid gap-3 sm:grid-cols-2">
                  {consultServices.map((s) => (
                    <ChoiceCard key={s.id} active={serviceId === s.id} onClick={() => setServiceId(s.id)}>
                      <p className="text-xl font-black">{s.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                    </ChoiceCard>
                  ))}
                </div>
                <p className="mt-8 mb-3 text-sm font-bold">諮詢時長</p>
                <div className="flex gap-2">
                  {service.durations.map((d) => (
                    <button key={d} onClick={() => { setDuration(d); setTime(null) }} className={cn('flex items-center gap-2 rounded-md border px-5 py-3 font-bold', duration === d ? 'border-foreground bg-foreground text-white' : 'bg-card hover:border-ink')}>
                      <Clock className="size-4" /> {d} 分鐘
                    </button>
                  ))}
                </div>
              </StepBlock>
            )}

            {step === 1 && (
              <StepBlock title="選擇你的專屬教練">
                <div className="grid gap-3 sm:grid-cols-2">
                  {coachList.map((c) => (
                    <ChoiceCard key={c.id} active={coachId === c.id} onClick={() => { setCoachId(c.id); setTime(null) }} className="flex gap-4">
                      <img src={cdn(c.avatar, 160, 160)} alt="" className="size-20 shrink-0 rounded-md object-cover" />
                      <div>
                        <p className="text-xl font-black">{c.name}</p>
                        <p className="text-xs font-bold text-primary">{c.title}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.specialties.map((s) => <span key={s} className="rounded-sm bg-accent px-1.5 py-0.5 text-[11px] font-bold">{s}</span>)}
                        </div>
                      </div>
                    </ChoiceCard>
                  ))}
                </div>
              </StepBlock>
            )}

            {step === 2 && coach && (
              <StepBlock title={`${coach.name} 的可預約時段`}>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                  {days.map(({ i, date }) => (
                    <button key={i} onClick={() => { setDayIdx(i); setTime(null) }} className={cn('min-w-16 shrink-0 rounded-md border py-2 text-center', dayIdx === i ? 'border-foreground bg-foreground text-white' : 'bg-card hover:border-ink')}>
                      <span className="block text-xs">{i === 0 ? '今天' : `週${weekdayLabels[date.getDay()]}`}</span>
                      <span className="block font-display text-xl">{fmtMD(date)}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map(({ t, busy }) => (
                    <button
                      key={t}
                      disabled={busy}
                      onClick={() => setTime(t)}
                      className={cn('rounded-md border py-3 font-display text-lg transition-colors disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:line-through', time === t ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-ink')}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {slots.length === 0 && <p className="mt-4 text-sm text-muted-foreground">今日已無空檔，請選擇其他日期。</p>}
                <p className="mt-4 text-xs text-muted-foreground">劃線時段已被預約。每場 {duration} 分鐘，服務時段 {store.hours}。</p>
              </StepBlock>
            )}

            {step === 3 && (
              <StepBlock title="基本資訊問卷">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="c-name" label="姓名" error={errors.name}>
                    <Input id="c-name" autoComplete="name" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} aria-invalid={!!errors.name} />
                  </Field>
                  <Field id="c-phone" label="手機" error={errors.phone}>
                    <Input id="c-phone" type="tel" inputMode="tel" placeholder="0912345678" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} aria-invalid={!!errors.phone} />
                  </Field>
                  <Field id="c-height" label="目前身高（cm）" error={errors.height}>
                    <Input id="c-height" type="number" inputMode="decimal" value={info.height} onChange={(e) => setInfo({ ...info, height: e.target.value })} aria-invalid={!!errors.height} />
                  </Field>
                  <Field id="c-weight" label="目前體重（kg）" error={errors.weight}>
                    <Input id="c-weight" type="number" inputMode="decimal" value={info.weight} onChange={(e) => setInfo({ ...info, weight: e.target.value })} aria-invalid={!!errors.weight} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field id="c-goal" label="減重目標（選填）">
                      <Input id="c-goal" placeholder="例：3 個月減 6 公斤、體脂降到 25%" value={info.goal} onChange={(e) => setInfo({ ...info, goal: e.target.value })} />
                    </Field>
                  </div>
                </div>
                <fieldset className="mt-5">
                  <legend className="mb-2 text-sm font-medium">目前是否有運動習慣？</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {['幾乎沒有', '每週 1–2 次', '每週 3 次以上'].map((h) => (
                      <button type="button" key={h} aria-pressed={info.habit === h} onClick={() => setInfo({ ...info, habit: h })} className={cn('rounded-md border py-3 text-sm font-bold', info.habit === h ? 'border-foreground bg-foreground text-white' : 'bg-card hover:border-ink')}>
                        {h}
                      </button>
                    ))}
                  </div>
                  {errors.habit && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.habit}</p>}
                </fieldset>
                <div className="mt-5">
                  <Field id="c-note" label="其他想讓教練知道的（傷病史、飲食習慣等，選填）">
                    <Textarea id="c-note" rows={3} value={info.note} onChange={(e) => setInfo({ ...info, note: e.target.value })} />
                  </Field>
                </div>
              </StepBlock>
            )}

            {step === 4 && coach && selectedDate && (
              <StepBlock title="確認預約內容">
                <dl className="divide-y overflow-hidden rounded-lg border bg-card">
                  {[
                    ['服務項目', `${service.name}（${duration} 分鐘）`],
                    ['專屬教練', coach.name],
                    ['日期時段', `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}（週${weekdayLabels[selectedDate.getDay()]}）${time} – ${fromMinutes(toMinutes(time!) + duration)}`],
                    ['地點', `${store.brand} ${store.branch}`],
                    ['姓名／手機', `${info.name}・${info.phone}`],
                    ['身高／體重', `${info.height} cm・${info.weight} kg`],
                    ['減重目標', info.goal || '—'],
                    ['運動習慣', info.habit],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 px-5 py-3 text-sm">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </StepBlock>
            )}

            <div className="mt-10 flex items-center justify-between border-t pt-6">
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                <ArrowLeft /> 上一步
              </Button>
              {step < 4 ? (
                <Button size="lg" onClick={next} disabled={!canNext} className="font-bold">
                  下一步 <ArrowRight />
                </Button>
              ) : (
                <Button size="lg" onClick={submit} disabled={pending} className="font-bold">
                  {pending ? '送出中…' : <>確認送出 <Check /></>}
                </Button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function StepBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-black sm:text-3xl">{title}</h2>
      {children}
    </div>
  )
}

function ChoiceCard({ active, onClick, className, children }: { active: boolean; onClick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn('relative rounded-lg border-2 bg-card p-5 text-left transition-all', active ? 'border-primary shadow-[4px_4px_0_var(--ink)]' : 'border-border hover:border-ink', className)}
    >
      {active && <span className="absolute top-3 right-3 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" /></span>}
      {children}
    </button>
  )
}
