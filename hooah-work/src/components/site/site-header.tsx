import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { store } from '@/data/fixtures'
import { Logo } from './logo'
import { LineIcon } from './line-icon'

const nav = [
  { label: '課程介紹', to: '/', hash: 'classes' },
  { label: '減重計畫', to: '/', hash: 'program' },
  { label: '教練師資', to: '/coaches' },
  { label: '環境設施', to: '/', hash: 'space' },
  { label: '交通資訊', to: '/', hash: 'visit' },
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 text-foreground shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="主選單" className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              hash={'hash' in n ? n.hash : undefined}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeOptions={{ exact: true, includeHash: true }}
              activeProps={{ className: 'text-foreground' }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost" className="hidden text-foreground hover:bg-muted sm:inline-flex">
            <a href={store.lineOfficialUrl} target="_blank" rel="noreferrer">
              <LineIcon className="size-5 text-line" />
              LINE 諮詢
            </a>
          </Button>
          <Button asChild size="sm" className="font-bold">
            <Link to="/schedule">立即預約</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon-sm" variant="ghost" className="text-foreground hover:bg-muted lg:hidden" aria-label="開啟選單">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-white text-foreground">
              <SheetHeader>
                <SheetTitle className="font-display text-3xl text-foreground uppercase">Hooah!</SheetTitle>
                <SheetDescription className="text-muted-foreground">{store.branch}・{store.hours}</SheetDescription>
              </SheetHeader>
              <nav aria-label="行動版選單" className="flex flex-col px-4">
                {nav.map((n) => (
                  <SheetClose asChild key={n.label}>
                    <Link to={n.to} hash={'hash' in n ? n.hash : undefined} className="border-b border-border py-4 text-lg font-bold">
                      {n.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link to="/schedule" className="border-b border-border py-4 text-lg font-bold">團體課表預約</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/consult" className="border-b border-border py-4 text-lg font-bold">減重諮詢預約</Link>
                </SheetClose>
                <a href={store.lineOfficialUrl} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 rounded-md bg-line py-3 font-bold text-white">
                  <LineIcon className="size-5" /> LINE 快速諮詢
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
