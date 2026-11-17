import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Clock, MapPin, Play, TrainFront, Bus, Car, Flame, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  classTypeById,
  classTypes,
  coaches,
  heroMedia,
  mediaWall,
  programPillars,
  store,
  transformations,
  weeklyTimetable,
  type MediaItem,
  type Coach,
  type WeeklySlot,
} from '@/data/fixtures'
import { cdn } from '@/lib/img'
import { endTime, toMinutes, weekdayLabels } from '@/lib/schedule'
import { LineIcon } from '@/components/site/line-icon'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <FeaturedClasses />
      <Program />
      <MediaWall />
      <CoachStrip />
      <Visit />
    </>
  )
}

/* ---------------- Hero ---------------- */

function Hero() {
  const [i, setI] = useState(0)
  const [uploadedSlides, setUploadedSlides] = useState<{ src: string; alt: string }[] | null>(null)
  const slides = uploadedSlides?.length ? uploadedSlides : heroMedia.slides
  useEffect(() => {
    fetch('/.netlify/functions/api?resource=media-public&category=hero').then(r => r.ok ? r.json() : Promise.reject()).then(data => {
      if (Array.isArray(data.items) && data.items.length) setUploadedSlides(data.items.map((item: { publicUrl: string; title: string }) => ({ src: item.publicUrl, alt: item.title })))
    }).catch(() => undefined)
  }, [])
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % slides.length), 6500)
    return () => clearInterval(t)
  }, [slides.length])

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid min-h-[640px] max-w-content items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div className="relative z-10 order-2 lg:order-1">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-xs font-bold tracking-[0.16em] text-primary">
            <span className="size-2 rounded-full bg-primary" /> {store.branch}・今日營業 {store.hours}
          </p>
          <h1 className="max-w-3xl">
            <span className="block font-display text-[clamp(4.8rem,11vw,8.5rem)] leading-[0.82] tracking-tight text-foreground uppercase">Hooah<span className="text-primary">!</span></span>
            <span className="mt-7 block text-[clamp(1.9rem,4vw,3.2rem)] leading-tight font-black tracking-tight">{store.slogan}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">{store.tagline}。小班制團體課線上即時預約，或與專屬教練一起打造你的 12 週減脂計畫。</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-14 px-7 text-base font-bold"><Link to="/schedule">查看課表預約 <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline" className="h-14 border-foreground/20 px-7 text-base font-bold"><Link to="/consult">預約減重諮詢</Link></Button>
          </div>
          <div className="mt-10 flex items-center gap-3 text-xs font-bold tracking-[0.16em] text-muted-foreground"><span className="h-px w-10 bg-primary"/> TRAIN SMARTER · LIVE STRONGER</div>
        </div>
        <div className="relative order-1 min-h-[360px] overflow-hidden rounded-2xl bg-muted shadow-[0_25px_80px_-35px_rgba(20,35,30,.35)] lg:order-2 lg:min-h-[560px]">
          {slides.map((slide, idx) => <img key={`${slide.src}-${idx}`} src={slide.src.startsWith('/.netlify/') ? slide.src : cdn(slide.src, 1500)} alt={slide.alt} className={cn('absolute inset-0 size-full object-cover transition-opacity duration-1000', idx === i ? 'opacity-100' : 'opacity-0')} fetchPriority={idx===0?'high':'auto'} />)}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/55 to-transparent p-6 pt-20 text-white"><div><p className="text-xs font-bold tracking-[0.2em]">MOVE WITH PURPOSE</p><p className="mt-1 text-2xl font-black">讓每一次訓練都有方向</p></div><div className="flex gap-2">{slides.map((slide,idx)=><button key={slide.src+idx} aria-label={`切換第 ${idx+1} 張主視覺`} aria-pressed={idx===i} onClick={()=>setI(idx)} className={cn('h-1.5 rounded-full transition-all',idx===i?'w-8 bg-white':'w-3 bg-white/50')}/>)}</div></div>
        </div>
      </div>
      <div className="border-y border-border bg-[#fbfcfb]"><div className="mx-auto grid max-w-content grid-cols-2 gap-4 px-4 py-5 text-center sm:px-6 md:grid-cols-4">{[['01','小班制團體課'],['02','專屬教練指導'],['03','個人化減重計畫'],['04','線上即時預約']].map(([n,label])=><div key={n}><span className="font-display text-xl text-primary">{n}</span><p className="mt-1 text-sm font-bold">{label}</p></div>)}</div></div>
    </section>
  )
}

function Marquee() {
  const items = [...classTypes, ...classTypes]
  return (
    <div className="overflow-hidden border-y border-ink bg-primary py-3 text-primary-foreground" aria-hidden="true">
      <div className="animate-marquee flex w-max gap-10 font-display text-2xl whitespace-nowrap uppercase">
        {items.map((c, i) => (
          <span key={i} className="flex items-center gap-10">
            {c.en} <span className="text-ink">✕</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Featured classes ---------------- */

const weekOrder = [1, 2, 3, 4, 5, 6, 0]

function SectionHead({ kicker, title, children, dark }: { kicker: string; title: string; children?: React.ReactNode; dark?: boolean }) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="mb-2 font-display text-lg tracking-widest text-primary uppercase">{kicker}</p>
        <h2 className={cn('text-4xl font-black sm:text-5xl', dark && 'text-background')}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function FeaturedClasses() {
  const [day, setDay] = useState(1)
  const [timetable, setTimetable] = useState<WeeklySlot[]>(weeklyTimetable)
  const [coachList, setCoachList] = useState<Coach[]>(coaches)
  const [classPhotos, setClassPhotos] = useState<{id:string;title:string;publicUrl:string}[]>([])
  useEffect(() => { fetch('/.netlify/functions/api?resource=media-public&category=classes').then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(Array.isArray(d.items))setClassPhotos(d.items)}).catch(()=>undefined) }, [])
  useEffect(() => { setDay(new Date().getDay()) }, [])
  useEffect(() => {
    fetch('/.netlify/functions/api?resource=public').then(r => r.ok ? r.json() : Promise.reject()).then(data => {
      if (Array.isArray(data.slots)) setTimetable(data.slots)
      if (Array.isArray(data.coaches)) setCoachList(data.coaches)
    }).catch(() => undefined)
  }, [])
  const list = timetable.filter((s) => s.weekday === day).sort((a, b) => toMinutes(a.start) - toMinutes(b.start))

  return (
    <section id="classes" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHead kicker="Track 01 / Group Class" title="本週精選團體課">
          <Button asChild variant="link" className="h-auto p-0 text-base font-bold text-foreground">
            <Link to="/schedule">
              看完整週課表 <ArrowRight />
            </Link>
          </Button>
        </SectionHead>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="選擇星期">
          {weekOrder.map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={d === day}
              onClick={() => setDay(d)}
              className={cn(
                'min-w-14 rounded-md border px-4 py-2 text-sm font-bold transition-colors',
                d === day ? 'border-ink bg-ink text-background' : 'border-border bg-card hover:border-ink',
              )}
            >
              週{weekdayLabels[d]}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => {
            const ct = classTypeById(s.classTypeId)!
            const coach = coachList.find((c) => c.id === s.coachId)
            return (
              <Link
                key={s.id}
                to="/schedule"
                search={{ type: ct.id }}
                className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-ink hover:shadow-[6px_6px_0_var(--ink)] motion-reduce:transition-none"
              >
                <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: ct.color }} />
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-4xl leading-none">{s.start}</p>
                  <span className="rounded-full border px-2 py-1 text-xs font-bold">每堂 {s.capacity} 人</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.start}–{endTime(s.start, s.durationMin)}・{s.durationMin} 分鐘
                </p>
                <h3 className="mt-5 text-2xl font-black">{ct.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{ct.blurb}</p>
                <div className="mt-5 flex items-center justify-between border-t border-dashed pt-4 text-sm">
                  <span className="flex items-center gap-2">
                    <img src={cdn(coach?.avatar ?? '/img/coaching.png', 64, 64)} alt="" className="size-7 rounded-full object-cover" />
                    {coach?.name ?? '教練'}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="size-4" /> 名額上限 {s.capacity}
                  </span>
                </div>
                <span className="mt-4 flex items-center gap-1 text-sm font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  前往預約 <ArrowRight className="size-4" />
                </span>
              </Link>
            )
          })}
          {list.length === 0 && <p className="text-muted-foreground">本日無排定課程，請選擇其他日期。</p>}
        </div>
        {classPhotos.length > 0 && <div className="mt-8 grid gap-3 sm:grid-cols-3">{classPhotos.slice(0,3).map(photo=><figure key={photo.id} className="overflow-hidden rounded-xl border bg-white"><img src={photo.publicUrl} alt={photo.title} className="aspect-[16/10] w-full object-cover" loading="lazy"/><figcaption className="px-4 py-3 text-sm font-bold">{photo.title}</figcaption></figure>)}</div>}
        <p className="mt-6 text-sm text-muted-foreground">
          課程時間與名額上限由後台維護；實際可預約狀態請以課表頁送出時的即時檢查為準。
        </p>
      </div>
    </section>
  )
}

/* ---------------- Program ---------------- */

function Program() {
  const [resultPhotos, setResultPhotos] = useState<{id:string;title:string;publicUrl:string}[]>([])
  useEffect(() => { fetch('/.netlify/functions/api?resource=media-public&category=results').then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(Array.isArray(d.items))setResultPhotos(d.items)}).catch(()=>undefined) }, [])
  return (
    <section id="program" className="relative scroll-mt-16 overflow-hidden bg-[#f6f8f6] py-20 text-foreground sm:py-28">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-content px-4 sm:px-6">
        <SectionHead kicker="Track 02 / 1-on-1" title="個人化減重計畫">
          <Button asChild size="lg" className="font-bold">
            <Link to="/consult">預約免費減重諮詢 <ArrowRight /></Link>
          </Button>
        </SectionHead>

        <div className="grid gap-px overflow-hidden rounded-lg bg-border md:grid-cols-3">
          {programPillars.map((p) => (
            <div key={p.no} className="bg-white p-8">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-6xl text-primary">{p.no}</span>
                <span className="font-display text-xl tracking-widest text-muted-foreground">{p.en}</span>
              </div>
              <h3 className="mt-6 text-2xl font-black">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div className="relative">
            <img src={cdn('/img/nutrition.png', 900, 1000)} alt="減重計畫的飲食規劃餐盒" className="aspect-[9/10] w-full rounded-lg object-cover" loading="lazy" />
            <div className="absolute -right-3 -bottom-5 rotate-[-3deg] rounded-md bg-primary px-5 py-4 font-black text-primary-foreground shadow-xl">
              <p className="font-display text-5xl leading-none">-8.7kg</p>
              <p className="text-xs">學員 12 週平均體重變化*</p>
            </div>
          </div>
          <div>
            <p className="mb-6 flex items-center gap-2 text-sm font-bold tracking-widest text-muted-foreground">
              <Flame className="size-4 text-primary" /> 減脂成果案例
            </p>
            <div className="space-y-4">
              {transformations.map((t) => (
                <figure key={t.name} className="rounded-lg border border-border bg-white p-6">
                  <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t.name}・{t.age} 歲・{t.weeks} 週</p>
                      <p className="mt-1 font-display text-4xl">
                        {t.before}<span className="mx-2 text-primary">→</span>{t.after}<span className="ml-1 text-lg">kg</span>
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">體脂率</p>
                      <p className="font-display text-3xl text-primary">{t.fat}%</p>
                    </div>
                  </div>
                  <blockquote className="mt-4 border-l-2 border-primary pl-4 text-muted-foreground">「{t.quote}」</blockquote>
                </figure>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">* 個人成果因體質與執行度而異。</p>
            {resultPhotos.length > 0 && <div className="mt-6 grid grid-cols-2 gap-3">{resultPhotos.slice(0,4).map(photo=><figure key={photo.id} className="overflow-hidden rounded-lg border bg-white"><img src={photo.publicUrl} alt={photo.title} className="aspect-[4/5] w-full object-cover" loading="lazy"/><figcaption className="p-2 text-xs font-bold">{photo.title}</figcaption></figure>)}</div>}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Media wall ---------------- */

const wallLayout = ['md:col-span-2 md:row-span-2', '', '', 'md:col-span-2', '', '']

function MediaWall() {
  const [open, setOpen] = useState<MediaItem | null>(null)
  const [wall, setWall] = useState<MediaItem[]>(mediaWall)
  useEffect(() => { fetch('/.netlify/functions/api?resource=media-public&category=venue').then(r => r.ok ? r.json() : Promise.reject()).then(data => { if (Array.isArray(data.items) && data.items.length) setWall(data.items.map((item: { id: string; title: string; publicUrl: string }) => ({ id: item.id, type: 'image' as const, src: item.publicUrl, label: item.title, area: 'HOOAH SPACE' }))) }).catch(() => undefined) }, [])
  return (
    <section id="space" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHead kicker="Space & Vibes" title="環境與動態影音牆">
          <p className="max-w-sm text-sm text-muted-foreground">重訓區、有氧教室、更衣休息區一次看。相片與短影音由店家後台隨時更新。</p>
        </SectionHead>
        <div className="grid auto-rows-[200px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4">
          {wall.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setOpen(m)}
              className={cn('group relative overflow-hidden rounded-lg bg-muted text-left', wallLayout[idx])}
              aria-label={`放大檢視：${m.label}`}
            >
              <img src={m.src.startsWith('/.netlify/') ? m.src : cdn(m.src, idx === 0 ? 1000 : 600)} alt={m.label} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent" />
              {m.type === 'video' && (
                <span className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-ink"><Play className="size-4" /></span>
              )}
              <div className="absolute bottom-3 left-4 text-background">
                <p className="font-display text-sm tracking-widest text-primary">{m.area}</p>
                <p className="text-lg font-black">{m.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl overflow-hidden border-none bg-ink p-0 text-background sm:max-w-4xl">
          <DialogTitle className="sr-only">{open?.label}</DialogTitle>
          <DialogDescription className="sr-only">Hooah運動 環境照片</DialogDescription>
          {open &&
            (open.type === 'video' ? (
              <video src={open.src} controls autoPlay className="w-full" />
            ) : (
              <img src={open.src.startsWith('/.netlify/') ? open.src : cdn(open.src, 1600)} alt={open.label} className="w-full" />
            ))}
          <p className="px-5 pb-4 font-black">{open?.label}</p>
        </DialogContent>
      </Dialog>
    </section>
  )
}

/* ---------------- Coaches ---------------- */

function CoachStrip() {
  const ref = useRef<HTMLDivElement>(null)
  const [coachPhotos, setCoachPhotos] = useState<{id:string;title:string;publicUrl:string}[]>([])
  useEffect(() => { fetch('/.netlify/functions/api?resource=media-public&category=coaches').then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(Array.isArray(d.items))setCoachPhotos(d.items)}).catch(()=>undefined) }, [])
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  return (
    <section className="border-t border-border bg-muted/50 py-20 sm:py-28">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHead kicker="Coaches" title="師資團隊">
          <div className="flex gap-2">
            <Button size="icon" variant="outline" onClick={() => scroll(-1)} aria-label="上一位教練"><ChevronLeft /></Button>
            <Button size="icon" variant="outline" onClick={() => scroll(1)} aria-label="下一位教練"><ChevronRight /></Button>
          </div>
        </SectionHead>
        <div ref={ref} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none]">
          {coaches.map((c, index) => (
            <article key={c.id} className="grid w-[88%] shrink-0 snap-start overflow-hidden rounded-lg border border-border bg-card sm:w-[640px] sm:grid-cols-[240px_1fr]">
              <img src={coachPhotos.find(photo => photo.title.includes(c.name))?.publicUrl ?? coachPhotos[index]?.publicUrl ?? cdn(c.photo, 480, 600)} alt={`${c.name} 形象照`} loading="lazy" className="aspect-[4/5] size-full object-cover sm:aspect-auto" />
              <div className="flex flex-col p-6">
                <p className="text-xs font-bold tracking-widest text-primary">{c.title}</p>
                <h3 className="mt-1 text-3xl font-black">{c.name}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.specialties.map((s) => (
                    <span key={s} className="rounded-sm bg-accent px-2 py-0.5 text-xs font-bold">{s}</span>
                  ))}
                </div>
                <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{c.bio}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Button asChild size="sm" className="font-bold">
                    <Link to="/consult" search={{ coach: c.id }}>立即預約諮詢</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/coaches" hash={c.id}>完整介紹</Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
          <Link to="/coaches" className="flex w-60 shrink-0 snap-start flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-center text-muted-foreground hover:border-ink hover:text-foreground">
            <span className="font-display text-5xl">+{coaches.length}</span>
            <span className="mt-2 text-sm font-bold">認識所有教練 →</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Visit ---------------- */

const transitIcon = { 捷運: TrainFront, 公車: Bus, 停車: Car } as const

function Visit() {
  return (
    <section id="visit" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHead kicker="Visit Us" title={`交通與門市資訊・${store.branch}`} />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-lg border border-border bg-muted">
            <iframe
              title="Hooah運動 板橋江翠店 Google 地圖"
              src={store.mapsEmbedUrl}
              className="h-[360px] w-full lg:h-full lg:min-h-[460px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-white p-6 text-foreground">
              <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary"><Clock className="size-4" /> {store.hoursNote}</p>
              <p className="mt-2 font-display text-6xl">{store.hours}</p>
              <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" /> {store.address}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild size="sm" className="font-bold"><a href={store.mapsUrl} target="_blank" rel="noreferrer">開啟導航</a></Button>
                <Button asChild size="sm" className="bg-line font-bold text-white hover:bg-line/90">
                  <a href={store.lineOfficialUrl} target="_blank" rel="noreferrer"><LineIcon className="size-4" /> LINE 詢問</a>
                </Button>
              </div>
            </div>
            {store.transit.map((t) => {
              const Icon = transitIcon[t.kind]
              return (
                <div key={t.kind} className="flex gap-4 rounded-lg border border-border bg-card p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent"><Icon className="size-5" /></span>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">{t.kind}</p>
                    <p className="font-black">{t.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
