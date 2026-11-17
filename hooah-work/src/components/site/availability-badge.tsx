import { availabilityLabel, type Availability } from '@/data/fixtures'
import { cn } from '@/lib/utils'

const styles: Record<Availability, string> = {
  open: 'bg-[oklch(0.93_0.07_150)] text-[oklch(0.35_0.1_150)]',
  almost: 'bg-[oklch(0.93_0.08_70)] text-[oklch(0.42_0.13_55)]',
  full: 'bg-muted text-muted-foreground line-through decoration-1',
}

export function AvailabilityBadge({ status, className }: { status: Availability; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-bold whitespace-nowrap', styles[status], className)}>
      <span className={cn('size-1.5 rounded-full bg-current', status === 'almost' && 'animate-pulse motion-reduce:animate-none')} />
      {availabilityLabel[status]}
    </span>
  )
}
