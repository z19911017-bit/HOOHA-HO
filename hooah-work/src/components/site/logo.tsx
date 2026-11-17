import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('group flex items-baseline gap-2', className)} aria-label="Hooah運動 首頁">
      <span className="font-display text-3xl leading-none tracking-wide uppercase">
        Hooah<span className="text-primary">!</span>
      </span>
      <span className="hidden text-[11px] font-bold tracking-[0.2em] opacity-70 sm:inline">運動・板橋江翠</span>
    </Link>
  )
}
