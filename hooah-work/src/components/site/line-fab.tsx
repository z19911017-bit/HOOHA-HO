import { store } from '@/data/fixtures'
import { LineIcon } from './line-icon'

export function LineFab() {
  return (
    <a
      href={store.lineOfficialUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="以 LINE 官方帳號諮詢"
      className="group fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-line py-3 pr-5 pl-3 text-white shadow-[0_10px_30px_-8px_oklch(0.5_0.18_145/0.7)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none sm:right-6 sm:bottom-6"
    >
      <LineIcon className="size-7" />
      <span className="text-sm font-bold">LINE 諮詢</span>
      <span className="absolute -top-1 -right-1 flex size-3">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex size-3 rounded-full bg-primary" />
      </span>
    </a>
  )
}
