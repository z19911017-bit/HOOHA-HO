import { Link } from '@tanstack/react-router'
import { store } from '@/data/fixtures'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white pb-24 text-muted-foreground">
      <div className="stripe-rule h-2 opacity-80" />
      <div className="mx-auto grid max-w-content gap-10 px-4 pt-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-6xl text-foreground uppercase">Hooah<span className="text-primary">!</span></p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed">{store.tagline}。用科學化訓練與可持續的飲食，陪你把目標變成習慣。</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-xs font-bold tracking-[0.25em] text-primary">預約</p>
          <ul className="space-y-2">
            <li><Link to="/schedule" className="hover:text-foreground">團體課表</Link></li>
            <li><Link to="/consult" className="hover:text-foreground">1 對 1 減重諮詢</Link></li>
            <li><Link to="/coaches" className="hover:text-foreground">教練師資</Link></li>
            <li><Link to="/admin" className="hover:text-foreground">後台管理（預覽）</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-xs font-bold tracking-[0.25em] text-primary">{store.branch}</p>
          <p>{store.address}</p>
          <p className="mt-2">營業／預約時段 {store.hours}</p>
          <a href={store.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block underline underline-offset-4 hover:text-foreground">在 Google 地圖開啟</a>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-content px-4 text-xs text-muted-foreground/70 sm:px-6">© {store.brand} {store.branch}</p>
    </footer>
  )
}
