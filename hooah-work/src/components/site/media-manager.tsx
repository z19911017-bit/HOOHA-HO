import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type MediaItem = { id: string; title: string; category: string; publicUrl: string; sortOrder: number; createdAt: string }
const categories = [
  { value: 'hero', label: '首頁主視覺' },
  { value: 'classes', label: '課程照片' },
  { value: 'coaches', label: '教練照片' },
  { value: 'results', label: '學員成果' },
  { value: 'venue', label: '場館環境' },
  { value: 'news', label: '最新消息' },
]

export function MediaManager() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [category, setCategory] = useState('hero')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await fetch('/.netlify/functions/api?resource=media-admin', { credentials: 'include' }); const d = await r.json(); if (!r.ok) throw new Error(d.error || '讀取圖片失敗'); setItems(d.items ?? []) }
    catch (e) { toast.error(e instanceof Error ? e.message : '讀取圖片失敗') } finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const upload = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('請選擇圖片檔案'); return }
    if (file.size > 4 * 1024 * 1024) { toast.error('圖片大小不可超過 4MB'); return }
    setUploading(true)
    try {
      const form = new FormData(); form.append('file', file); form.append('category', category); form.append('title', title.trim() || file.name.replace(/\.[^.]+$/, ''))
      const r = await fetch('/.netlify/functions/api?resource=media-upload', { method: 'POST', credentials: 'include', body: form }); const d = await r.json(); if (!r.ok) throw new Error(d.error || '上傳失敗')
      toast.success('圖片已上傳'); setTitle(''); if (input.current) input.current.value = ''; await load()
    } catch (e) { toast.error(e instanceof Error ? e.message : '上傳失敗') } finally { setUploading(false) }
  }
  const remove = async (id: string) => {
    if (!window.confirm('確定刪除這張圖片？')) return
    try { const r = await fetch(`/.netlify/functions/api?resource=media-delete&id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' }); const d = await r.json(); if (!r.ok) throw new Error(d.error || '刪除失敗'); setItems(all => all.filter(x => x.id !== id)); toast.success('圖片已刪除') }
    catch (e) { toast.error(e instanceof Error ? e.message : '刪除失敗') }
  }
  const reorder = async (id: string, direction: -1 | 1) => {
    const group = items.filter(x => x.category === category).sort((a,b) => a.sortOrder-b.sortOrder); const i = group.findIndex(x => x.id === id); const j = i + direction; if (j < 0 || j >= group.length) return
    const next = [...group]; [next[i], next[j]] = [next[j], next[i]]
    try { const r = await fetch('/.netlify/functions/api?resource=media-reorder', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ids: next.map(x=>x.id) }) }); const d=await r.json(); if(!r.ok) throw new Error(d.error||'排序失敗'); await load() } catch(e) { toast.error(e instanceof Error ? e.message : '排序失敗') }
  }
  const visible = items.filter(x => x.category === category).sort((a,b) => a.sortOrder-b.sortOrder)
  return <section className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">網站圖片管理</h2><p className="mt-1 text-sm text-muted-foreground">圖片會儲存至網站媒體空間；前台依分類顯示已發布的圖片。</p></div><Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="mr-2 size-4"/>重新整理</Button></div>
    <div className="flex flex-wrap gap-2">{categories.map(c => <button key={c.value} onClick={() => setCategory(c.value)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${category===c.value?'border-foreground bg-foreground text-white':'bg-white hover:bg-muted'}`}>{c.label}</button>)}</div>
    <div className="grid gap-3 rounded-lg border border-dashed bg-muted/30 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="grid gap-1 text-sm font-semibold">圖片名稱<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="例如：教室團體訓練" className="h-10 rounded-md border bg-white px-3 font-normal"/></label>
      <label className="grid gap-1 text-sm font-semibold">選擇圖片<input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>void upload(e.target.files?.[0])} className="block w-full rounded-md border bg-white p-2 text-sm font-normal"/></label>
      <Button disabled={uploading} onClick={()=>input.current?.click()}><ImagePlus className="mr-2 size-4"/>{uploading?'上傳中…':'上傳圖片'}</Button>
      <p className="text-xs text-muted-foreground sm:col-span-3">支援 JPG、PNG、WebP、GIF，單張上限 4MB。請使用已取得授權的場館、教練及學員照片。</p>
    </div>
    {loading ? <p className="py-10 text-center text-sm text-muted-foreground">載入圖片中…</p> : visible.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map((item,index)=><article key={item.id} className="overflow-hidden rounded-lg border bg-white"><img src={item.publicUrl} alt={item.title} className="aspect-[4/3] w-full object-cover"/><div className="space-y-3 p-3"><p className="truncate text-sm font-semibold">{item.title}</p><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">排序 {index+1}</span><div className="flex gap-1"><Button variant="outline" size="icon" aria-label="上移" disabled={index===0} onClick={()=>void reorder(item.id,-1)}><ArrowUp className="size-4"/></Button><Button variant="outline" size="icon" aria-label="下移" disabled={index===visible.length-1} onClick={()=>void reorder(item.id,1)}><ArrowDown className="size-4"/></Button><Button variant="destructive" size="icon" aria-label="刪除圖片" onClick={()=>void remove(item.id)}><Trash2 className="size-4"/></Button></div></div></div></article>)}</div> : <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">這個分類還沒有圖片，請從上方上傳。</div>}
  </section>
}
