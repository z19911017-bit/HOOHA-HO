import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Copy, Download, GripVertical, Plus, UserPlus, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Field } from '@/components/site/field'
import { classTypeById, classTypes, coaches as seedCoaches, rooms, weeklyTimetable, type Coach, type WeeklySlot } from '@/data/fixtures'
import { endTime, fromMinutes, toMinutes, weekdayLabels } from '@/lib/schedule'
import { cdn } from '@/lib/img'
import { cn } from '@/lib/utils'
import { MediaManager } from '@/components/site/media-manager'

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [{ title: '後台管理｜Hooah運動' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminPage,
})

const DAY_START = toMinutes('09:00')
const DAY_END = toMinutes('21:00')
const HOUR_PX = 64
const cols = [1, 2, 3, 4, 5, 6, 0]
const selectCls = 'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm'

type Draft = Omit<WeeklySlot, 'id'> & { id?: string; copyTo: number[] }

function AdminPage() {
  const navigate = useNavigate()
  const [slots, setSlots] = useState<WeeklySlot[]>(weeklyTimetable)
  const [coachList, setCoachList] = useState<Coach[]>(seedCoaches)
  const [role, setRole] = useState<'admin' | 'coach' | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let active = true
    fetch('/.netlify/functions/api?resource=admin-bootstrap', { credentials: 'include' })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || '請先登入'); return data })
      .then((data) => { if (!active) return; setSlots(data.slots ?? []); setCoachList(data.coaches ?? []); setRole(data.user.role) })
      .catch((error) => { if (!active) return; setAuthError(error instanceof Error ? error.message : '無法驗證登入'); navigate({ to: '/login' }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [navigate])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [rosterOf, setRosterOf] = useState<WeeklySlot | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const openNew = (weekday: number, start: string) =>
    setDraft({ weekday, start, classTypeId: classTypes[0].id, coachId: coachList[0].id, durationMin: 50, capacity: 12, room: rooms[0], copyTo: [] })

  const onColumnClick = (e: React.MouseEvent<HTMLDivElement>, weekday: number) => {
    if (e.target !== e.currentTarget) return
    const y = e.nativeEvent.offsetY
    const m = Math.round((DAY_START + (y / HOUR_PX) * 60) / 30) * 30
    openNew(weekday, fromMinutes(Math.min(m, DAY_END - 60)))
  }

  const onDrop = async (e: React.DragEvent<HTMLDivElement>, weekday: number) => {
    e.preventDefault()
    if (!dragId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const m = Math.round((DAY_START + ((e.clientY - rect.top) / HOUR_PX) * 60) / 15) * 15
    const moved = slots.find((s) => s.id === dragId)
    if (!moved) return
    const updated = { ...moved, weekday, start: fromMinutes(Math.max(DAY_START, Math.min(m, DAY_END - moved.durationMin))) }
    try {
      const response = await fetch('/.netlify/functions/api?resource=admin-save-slot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(updated) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || '儲存失敗')
      setSlots((all) => all.map((s) => s.id === dragId ? updated : s))
      toast.success('已儲存課程新時段')
    } catch (error) { toast.error(error instanceof Error ? error.message : '移動失敗') }
    setDragId(null)
  }

  const saveDraft = async () => {
    if (!draft) return
    const { copyTo, ...base } = draft
    const days = [...new Set([draft.weekday, ...copyTo])]
    const created = days.map((weekday, i) => ({ ...base, weekday, id: i === 0 && draft.id ? draft.id : `n${Date.now()}${i}` }))
    try {
      for (const item of created) {
        const response = await fetch('/.netlify/functions/api?resource=admin-save-slot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(item) })
        const data = await response.json(); if (!response.ok) throw new Error(data.error || '儲存失敗')
      }
      setSlots((s) => [...s, ...created]); setDraft(null)
      toast.success(`已儲存 ${created.length} 堂每週週期課程`)
    } catch (error) { toast.error(error instanceof Error ? error.message : '儲存課程失敗') }
  }

  const duplicate = (slot: WeeklySlot) => {
    setRosterOf(null)
    const copy: Omit<WeeklySlot, 'id'> = { classTypeId: slot.classTypeId, coachId: slot.coachId, weekday: slot.weekday, start: slot.start, durationMin: slot.durationMin, capacity: slot.capacity, room: slot.room }
    setDraft({ ...copy, copyTo: [] })
  }

  const editSlot = (slot: WeeklySlot) => { setRosterOf(null); setDraft({ ...slot, copyTo: [] }) }

  const deleteSlot = async (slot: WeeklySlot) => {
    if (!window.confirm(`確定停用「${classTypeById(slot.classTypeId)?.name ?? '課程'}」每週課程？既有預約紀錄會保留。`)) return
    try {
      const response = await fetch(`/.netlify/functions/api?resource=admin-delete-slot&id=${encodeURIComponent(slot.id)}`, { method: 'DELETE', credentials: 'include' })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || '停用失敗')
      setSlots(all => all.filter(s => s.id !== slot.id)); setRosterOf(null); toast.success('已停用課程')
    } catch (error) { toast.error(error instanceof Error ? error.message : '停用課程失敗') }
  }

  const signOut = async () => {
    await fetch('/.netlify/functions/auth?action=logout', { method: 'POST', credentials: 'include' })
    await navigate({ to: '/login' })
  }

  if (loading) return <div className="mx-auto max-w-content px-4 py-24 text-center">正在驗證後台權限…</div>
  if (authError) return <div className="mx-auto max-w-content px-4 py-24 text-center">{authError}</div>

  return (
    <div className="bg-muted/40">
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display tracking-widest text-primary uppercase">Admin Console</p>
            <h1 className="text-4xl font-black">後台管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">目前登入角色：{role === 'admin' ? '管理員' : '教練'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="mr-1 size-4" />登出</Button>
          <div className="flex gap-6 text-sm">
            <Stat label="每週課程" value={slots.length} />
            <Stat label="每週總名額" value={slots.reduce((a, s) => a + s.capacity, 0)} />
            <Stat label="教練" value={coachList.length} />
          </div>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList>
            <TabsTrigger value="calendar">排課行事曆</TabsTrigger>
            <TabsTrigger value="rosters">報名名單</TabsTrigger>
            <TabsTrigger value="coaches">教練管理</TabsTrigger>
            <TabsTrigger value="consultations">諮詢預約</TabsTrigger>
            {role === 'admin' && <TabsTrigger value="media">圖片管理</TabsTrigger>}
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">點選空白時段新增課程；拖曳課程卡片可調整星期與時間。</p>
              {role === 'admin' && <Button size="sm" onClick={() => openNew(1, '10:00')}><Plus /> 新增週期課程</Button>}
            </div>
            <div className="overflow-x-auto rounded-lg border bg-card">
              <div className="grid min-w-[880px] grid-cols-[56px_repeat(7,1fr)]">
                <div className="border-b" />
                {cols.map((d) => (
                  <div key={d} className="border-b border-l py-2 text-center text-sm font-black">週{weekdayLabels[d]}</div>
                ))}
                <div className="relative" style={{ height: ((DAY_END - DAY_START) / 60) * HOUR_PX }}>
                  {Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, h) => (
                    <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground" style={{ top: h * HOUR_PX }}>
                      {h > 0 && fromMinutes(DAY_START + h * 60)}
                    </span>
                  ))}
                </div>
                {cols.map((d) => (
                  <div
                    key={d}
                    onClick={(e) => role === 'admin' && onColumnClick(e, d)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => role === 'admin' && onDrop(e, d)}
                    className="relative cursor-copy border-l"
                    style={{
                      height: ((DAY_END - DAY_START) / 60) * HOUR_PX,
                      backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${HOUR_PX}px)`,
                    }}
                  >
                    {slots
                      .filter((s) => s.weekday === d)
                      .map((s) => {
                        const ct = classTypeById(s.classTypeId)!
                        const coach = coachList.find((c) => c.id === s.coachId)
                        return (
                          <button
                            key={s.id}
                            draggable={role === 'admin'}
                            onDragStart={() => role === 'admin' && setDragId(s.id)}
                            onDragEnd={() => setDragId(null)}
                            onClick={() => setRosterOf(s)}
                            className={cn('absolute inset-x-1 cursor-grab overflow-hidden rounded-md p-1.5 text-left text-[11px] leading-tight text-white shadow-sm active:cursor-grabbing', dragId === s.id && 'opacity-50')}
                            style={{ top: ((toMinutes(s.start) - DAY_START) / 60) * HOUR_PX + 1, height: (s.durationMin / 60) * HOUR_PX - 2, background: ct.color }}
                          >
                            <GripVertical className="float-right size-3 opacity-60" />
                            <span className="block font-bold">{s.start} {ct.name}</span>
                            <span className="block opacity-85">{coach?.name}・上限 {s.capacity} 人</span>
                          </button>
                        )
                      })}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rosters" className="mt-6">
            <div className="overflow-hidden rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>時段</TableHead>
                    <TableHead>課程</TableHead>
                    <TableHead>教練</TableHead>
                    <TableHead>教室</TableHead>
                    <TableHead className="text-right">名額上限</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...slots]
                    .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7) || toMinutes(a.start) - toMinutes(b.start))
                    .map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-bold">週{weekdayLabels[s.weekday]} {s.start}</TableCell>
                        <TableCell>{classTypeById(s.classTypeId)?.name}</TableCell>
                        <TableCell>{coachList.find((c) => c.id === s.coachId)?.name}</TableCell>
                        <TableCell>{s.room}</TableCell>
                        <TableCell className="text-right">{s.capacity} 人</TableCell>
                        <TableCell className="text-right"><Button size="xs" variant="outline" onClick={() => setRosterOf(s)}>名冊・簽到</Button></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="coaches" className="mt-6">
            {role === 'admin' ? <CoachManager coaches={coachList} onAdd={(c) => setCoachList((l) => [...l, c])} /> : <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">教練帳號僅能查看自己的課程，不開放教練資料管理。</div>}
          </TabsContent>

          <TabsContent value="consultations" className="mt-6">
            <ConsultationManager />
          </TabsContent>

          {role === 'admin' && <TabsContent value="media" className="mt-6"><MediaManager /></TabsContent>}
        </Tabs>
      </div>

      <SlotDialog draft={draft} coaches={coachList} onChange={setDraft} onSave={saveDraft} />
      <RosterSheet slot={rosterOf} coaches={coachList} onClose={() => setRosterOf(null)} onDuplicate={duplicate} onEdit={editSlot} onDelete={deleteSlot} canEdit={role === 'admin'} />
    </div>
  )
}

function ConsultationManager() {
  const [rows, setRows] = useState<Array<{ id: string; name: string; phone: string; startsAt: string; durationMin: number; status: string; goal: string; habit: string; serviceName: string; coachName: string }>>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/.netlify/functions/api?resource=consultations', { credentials: 'include' })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || '讀取諮詢預約失敗'); setRows(d.consultations ?? []) })
      .catch(e => toast.error(e instanceof Error ? e.message : '讀取失敗'))
      .finally(() => setLoading(false))
  }, [])
  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/.netlify/functions/api?resource=consultation-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id, status }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || '更新失敗')
      setRows(all => all.map(row => row.id === id ? { ...row, status } : row)); toast.success('已更新諮詢狀態')
    } catch (error) { toast.error(error instanceof Error ? error.message : '更新失敗') }
  }
  return <div className="overflow-x-auto rounded-lg border bg-card"><Table><TableHeader><TableRow><TableHead>預約時間</TableHead><TableHead>客戶</TableHead><TableHead>服務／教練</TableHead><TableHead>目標</TableHead><TableHead>狀態</TableHead></TableRow></TableHeader><TableBody>
    {loading ? <TableRow><TableCell colSpan={5} className="py-8 text-center">載入中…</TableCell></TableRow> : rows.map(row => <TableRow key={row.id}><TableCell className="whitespace-nowrap">{new Date(row.startsAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})}<div className="text-xs text-muted-foreground">{row.durationMin} 分鐘</div></TableCell><TableCell><b>{row.name}</b><div className="text-xs text-muted-foreground">{row.phone}</div></TableCell><TableCell>{row.serviceName}<div className="text-xs text-muted-foreground">{row.coachName}</div></TableCell><TableCell className="max-w-40 truncate">{row.goal || '—'}</TableCell><TableCell><select aria-label={`${row.name} 預約狀態`} className={selectCls} value={row.status} onChange={e => updateStatus(row.id,e.target.value)}><option value="pending">待確認</option><option value="confirmed">已確認</option><option value="cancelled">已取消</option><option value="completed">已完成</option></select></TableCell></TableRow>)}
    {!loading && rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">目前沒有諮詢預約</TableCell></TableRow>}
  </TableBody></Table></div>
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <p className="font-display text-3xl leading-none">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function SlotDialog({ draft, coaches, onChange, onSave }: { draft: Draft | null; coaches: Coach[]; onChange: (d: Draft | null) => void; onSave: () => void }) {
  if (!draft) return null
  const set = (p: Partial<Draft>) => onChange({ ...draft, ...p })
  return (
    <Dialog open onOpenChange={(o) => !o && onChange(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增週期課程</DialogTitle>
          <DialogDescription>設定一次，每週自動重複開課。可同時複製到其他星期。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="s-type" label="課程名稱">
            <select id="s-type" className={selectCls} value={draft.classTypeId} onChange={(e) => set({ classTypeId: e.target.value })}>
              {classTypes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field id="s-coach" label="負責教練">
            <select id="s-coach" className={selectCls} value={draft.coachId} onChange={(e) => set({ coachId: e.target.value })}>
              {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field id="s-day" label="星期">
            <select id="s-day" className={selectCls} value={draft.weekday} onChange={(e) => set({ weekday: Number(e.target.value) })}>
              {cols.map((d) => <option key={d} value={d}>週{weekdayLabels[d]}</option>)}
            </select>
          </Field>
          <Field id="s-start" label={`開始時間（結束 ${endTime(draft.start, draft.durationMin)}）`}>
            <Input id="s-start" type="time" min="09:00" max="20:30" step={900} value={draft.start} onChange={(e) => set({ start: e.target.value })} />
          </Field>
          <Field id="s-dur" label="時長（分鐘）">
            <Input id="s-dur" type="number" min={30} max={120} step={5} value={draft.durationMin} onChange={(e) => set({ durationMin: Number(e.target.value) })} />
          </Field>
          <Field id="s-cap" label="人數上限">
            <Input id="s-cap" type="number" min={1} max={40} value={draft.capacity} onChange={(e) => set({ capacity: Number(e.target.value) })} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="s-room" label="教室地點">
              <select id="s-room" className={selectCls} value={draft.room} onChange={(e) => set({ room: e.target.value as Draft['room'] })}>
                {rooms.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 flex items-center gap-1 text-sm font-medium"><Copy className="size-3.5" /> 同時複製到</legend>
          <div className="flex flex-wrap gap-3">
            {cols.filter((d) => d !== draft.weekday).map((d) => (
              <label key={d} className="flex items-center gap-1.5 text-sm">
                <Checkbox checked={draft.copyTo.includes(d)} onCheckedChange={(v) => set({ copyTo: v ? [...draft.copyTo, d] : draft.copyTo.filter((x) => x !== d) })} />
                週{weekdayLabels[d]}
              </label>
            ))}
          </div>
        </fieldset>
        <DialogFooter>
          <Button variant="outline" onClick={() => onChange(null)}>取消</Button>
          <Button onClick={onSave} disabled={toMinutes(draft.start) < DAY_START || toMinutes(draft.start) + draft.durationMin > DAY_END}>儲存課程</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RosterSheet({ slot, coaches, onClose, onDuplicate, onEdit, onDelete, canEdit }: { slot: WeeklySlot | null; coaches: Coach[]; onClose: () => void; onDuplicate: (s: WeeklySlot) => void; onEdit: (s: WeeklySlot) => void; onDelete: (s: WeeklySlot) => void; canEdit: boolean }) {
  const [roster, setRoster] = useState<Array<{ bookingId: string; name: string; phone: string; email: string; checkedIn: boolean; status: string }>>([])
  const [loading, setLoading] = useState(false)
  const date = useMemo(() => {
    if (!slot) return ''
    const today = new Date()
    const offset = (slot.weekday - today.getDay() + 7) % 7
    const target = new Date(today); target.setDate(today.getDate() + offset)
    return `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}-${String(target.getDate()).padStart(2,'0')}`
  }, [slot])
  useEffect(() => {
    if (!slot) return
    let active = true; setLoading(true)
    fetch(`/.netlify/functions/api?resource=roster&slotId=${encodeURIComponent(slot.id)}&date=${date}`, { credentials: 'include' })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || '讀取名冊失敗'); return d })
      .then(d => { if (active) setRoster(d.roster ?? []) })
      .catch(e => toast.error(e instanceof Error ? e.message : '讀取名冊失敗'))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slot, date])
  if (!slot) return null
  const ct = classTypeById(slot.classTypeId)!
  const exportCsv = () => {
    const rows = [['姓名', '電話', 'Email', '簽到', '狀態'], ...roster.map(r => [r.name,r.phone,r.email,r.checkedIn ? '已簽到' : '未簽到',r.status])]
    const csv = '\uFEFF' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `名冊_${ct.name}_${date}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }
  const updateCheckin = async (bookingId: string, checkedIn: boolean) => {
    try {
      const response = await fetch('/.netlify/functions/api?resource=admin-checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ bookingId, checkedIn }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || '簽到更新失敗')
      setRoster(rows => rows.map(r => r.bookingId === bookingId ? { ...r, checkedIn } : r))
    } catch (error) { toast.error(error instanceof Error ? error.message : '簽到更新失敗') }
  }
  return (
    <Sheet open onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle className="text-2xl font-black">{ct.name}</SheetTitle><SheetDescription>{date}・每週{weekdayLabels[slot.weekday]} {slot.start}–{endTime(slot.start, slot.durationMin)}・{coaches.find(c => c.id === slot.coachId)?.name}・{slot.room}</SheetDescription></SheetHeader>
        <div className="flex gap-2 px-4">
          <Button size="sm" variant="outline" onClick={exportCsv}><Download /> 匯出名冊 CSV</Button>
          {canEdit && <><Button size="sm" variant="outline" onClick={() => onEdit(slot)}>編輯課程</Button><Button size="sm" variant="outline" onClick={() => onDuplicate(slot)}><Copy /> 複製</Button><Button size="sm" variant="destructive" onClick={() => onDelete(slot)}>停用</Button></>}
        </div>
        <div className="px-4 pb-6">
          <p className="mb-2 text-sm font-bold">報名 {roster.filter(r => r.status === 'confirmed').length}/{slot.capacity}・已簽到 {roster.filter(r => r.checkedIn).length}</p>
          {loading ? <p className="p-5 text-center text-sm text-muted-foreground">名冊載入中…</p> : <ul className="divide-y rounded-lg border">
            {roster.map(r => <li key={r.bookingId} className="flex items-center justify-between gap-3 px-3 py-2.5"><div className="min-w-0"><p className="font-bold">{r.name} {r.status === 'waitlist' && <span className="text-xs text-amber-600">候補</span>}</p><p className="truncate text-xs text-muted-foreground">{r.phone}・{r.email}</p></div><label className="flex items-center gap-2 text-xs">{r.checkedIn ? '已簽到' : '簽到'}<Switch checked={r.checkedIn} disabled={r.status !== 'confirmed'} onCheckedChange={v => updateCheckin(r.bookingId,v)} aria-label={`${r.name} 簽到`} /></label></li>)}
            {roster.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">此日期尚無報名</li>}
          </ul>}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function CoachManager({ coaches, onAdd }: { coaches: Coach[]; onAdd: (c: Coach) => void }) {
  const empty = { name: '', title: '', specialties: '', certifications: '', bio: '', lineUrl: '' }
  const [f, setF] = useState(empty)
  const valid = f.name.trim() && f.title.trim()
  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const split = (s: string) => s.split(/[,，、\n]/).map((x) => x.trim()).filter(Boolean)
    const newCoach = {
      id: `coach-${Date.now()}`,
      name: f.name,
      title: f.title,
      avatar: '/img/coaching.png',
      photo: '/img/coaching.png',
      bio: f.bio,
      specialties: split(f.specialties),
      certifications: split(f.certifications),
      lineUrl: f.lineUrl,
      workingDays: [1, 2, 3, 4, 5, 6],
      workStart: '09:00',
      workEnd: '21:00',
    }
    try {
      const response = await fetch('/.netlify/functions/api?resource=admin-save-coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(newCoach) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || '新增教練失敗')
      onAdd(newCoach); setF(empty); toast.success(`已儲存教練 ${f.name}`)
    } catch (error) { toast.error(error instanceof Error ? error.message : '新增教練失敗') }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="grid gap-3 sm:grid-cols-2">
        {coaches.map((c) => (
          <div key={c.id} className="flex gap-4 rounded-lg border bg-card p-4">
            <img src={cdn(c.avatar, 128, 128)} alt="" className="size-16 rounded-md object-cover" />
            <div className="min-w-0">
              <p className="font-black">{c.name}</p>
              <p className="text-xs text-primary">{c.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{c.specialties.join('・') || '—'}</p>
              <p className="truncate text-xs text-muted-foreground">LINE：{c.lineUrl || '未設定'}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="space-y-3 rounded-lg border bg-card p-5">
        <p className="flex items-center gap-2 font-black"><UserPlus className="size-4" /> 新增教練</p>
        <Field id="k-name" label="姓名"><Input id="k-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field id="k-title" label="職稱"><Input id="k-title" placeholder="例：體態雕塑教練" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field id="k-spec" label="擅長領域（以逗號分隔）"><Input id="k-spec" placeholder="增肌減脂, 產後修復" value={f.specialties} onChange={(e) => setF({ ...f, specialties: e.target.value })} /></Field>
        <Field id="k-cert" label="證照（以逗號分隔）"><Input id="k-cert" value={f.certifications} onChange={(e) => setF({ ...f, certifications: e.target.value })} /></Field>
        <Field id="k-line" label="個人 LINE 連結"><Input id="k-line" type="url" placeholder="https://line.me/ti/p/..." value={f.lineUrl} onChange={(e) => setF({ ...f, lineUrl: e.target.value })} /></Field>
        <Field id="k-bio" label="個人背景"><Textarea id="k-bio" rows={3} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
        <p className="text-xs text-muted-foreground">大頭照與形象照上傳將於媒體管理階段開放。</p>
        <Button type="submit" className="w-full" disabled={!valid}>新增教練</Button>
      </form>
    </div>
  )
}
