import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Award, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LineIcon } from '@/components/site/line-icon'
import { coaches as seedCoaches, weeklyTimetable as seedTimetable, classTypeById, classTypes as seedClassTypes, type Coach, type WeeklySlot } from '@/data/fixtures'
import { weekdayLabels } from '@/lib/schedule'
import { cdn } from '@/lib/img'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/coaches')({
  head: () => ({ meta: [{ title: '教練師資｜Hooah運動 板橋江翠店' }] }),
  component: CoachesPage,
})

function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>(seedCoaches)
  const [timetable, setTimetable] = useState<WeeklySlot[]>(seedTimetable)
  const [classTypes, setClassTypes] = useState(seedClassTypes)
  useEffect(() => {
    fetch('/.netlify/functions/api?resource=public').then(r => r.ok ? r.json() : Promise.reject()).then(data => {
      if (Array.isArray(data.coaches)) setCoaches(data.coaches)
      if (Array.isArray(data.slots)) setTimetable(data.slots)
      if (Array.isArray(data.classTypes)) setClassTypes(data.classTypes)
    }).catch(() => undefined)
  }, [])
  return (
    <div>
      <section className="border-b border-border bg-white text-foreground">
        <div className="mx-auto max-w-content px-4 pt-14 pb-12 sm:px-6">
          <p className="font-display text-lg tracking-widest text-primary uppercase">Meet the Coaches</p>
          <h1 className="mt-1 text-4xl font-black sm:text-6xl">教練師資</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">每位教練都持有國家級或國際認證。挑一位最懂你的教練，直接預約 1 對 1 諮詢，或用 LINE 先聊聊。</p>
          <nav aria-label="教練列表" className="mt-8 flex flex-wrap gap-2">
            {coaches.map((c) => (
              <a key={c.id} href={`#${c.id}`} className="flex items-center gap-2 rounded-full border border-input py-1 pr-4 pl-1 text-sm font-bold hover:border-foreground/40">
                <img src={cdn(c.avatar, 64, 64)} alt="" className="size-7 rounded-full object-cover" /> {c.name}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-content space-y-20 px-4 py-16 sm:px-6 sm:py-24">
        {coaches.map((c, idx) => {
          const classes = timetable.filter((s) => s.coachId === c.id)
          const types = [...new Set(classes.map((s) => s.classTypeId))].map((id) => classTypes.find((item) => item.id === id) ?? classTypeById(id)!)
          return (
            <article key={c.id} id={c.id} className={cn('grid scroll-mt-24 items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14', idx % 2 === 1 && 'lg:[&>*:first-child]:order-2')}>
              <div className="relative">
                <img src={cdn(c.photo, 900, 1100)} alt={`${c.name} 專業形象照`} loading={idx === 0 ? 'eager' : 'lazy'} className="aspect-[9/11] w-full rounded-lg object-cover" />
                <span className="absolute top-4 left-4 font-display text-8xl leading-none text-background/90 drop-shadow">{String(idx + 1).padStart(2, '0')}</span>
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <img src={cdn(c.avatar, 128, 128)} alt={`${c.name} 大頭照`} className="size-16 rounded-full border-2 border-primary object-cover" />
                  <div>
                    <p className="text-sm font-bold tracking-widest text-primary">{c.title}</p>
                    <h2 className="text-4xl font-black sm:text-5xl">{c.name}</h2>
                  </div>
                </div>
                <p className="mt-6 leading-relaxed text-muted-foreground">{c.bio}</p>

                <h3 className="mt-8 mb-3 text-xs font-bold tracking-[0.25em] text-muted-foreground">擅長領域</h3>
                <div className="flex flex-wrap gap-2">
                  {c.specialties.map((s) => (
                    <span key={s} className="rounded-md border-2 border-ink px-3 py-1 font-bold">{s}</span>
                  ))}
                </div>

                <h3 className="mt-8 mb-3 text-xs font-bold tracking-[0.25em] text-muted-foreground">專業證照</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {c.certifications.map((cert) => (
                    <li key={cert} className="flex items-start gap-2 rounded-md bg-card p-3 text-sm shadow-[0_1px_0_var(--border)]">
                      <Award className="mt-0.5 size-4 shrink-0 text-primary" /> {cert}
                    </li>
                  ))}
                </ul>

                {types.length > 0 && (
                  <>
                    <h3 className="mt-8 mb-3 text-xs font-bold tracking-[0.25em] text-muted-foreground">帶領的團體課</h3>
                    <p className="text-sm">
                      {types.map((t) => t.name).join('、')}
                      <span className="text-muted-foreground">（每週 {classes.length} 堂・{[...new Set(classes.map((s) => `週${weekdayLabels[s.weekday]}`))].join(' ')}）</span>
                    </p>
                  </>
                )}

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="h-13 font-bold">
                    <Link to="/consult" search={{ coach: c.id }}>
                      <CalendarCheck /> 立即預約諮詢
                    </Link>
                  </Button>
                  <Button asChild size="lg" className="h-13 bg-line font-bold text-white hover:bg-line/90">
                    <a href={c.lineUrl} target="_blank" rel="noreferrer">
                      <LineIcon className="size-5" /> LINE 諮詢教練
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-13">
                    <Link to="/schedule" search={{ coach: c.id }}>看 {c.name.split(' ')[0]} 的課表</Link>
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
