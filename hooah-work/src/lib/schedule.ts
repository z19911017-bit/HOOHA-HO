import { weeklyTimetable, stubBookedCount, type WeeklySlot } from '@/data/fixtures'

export const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

/** Monday 00:00 of the week containing `d`, offset by `weekOffset` weeks. */
export function startOfWeek(d: Date, weekOffset = 0) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day + weekOffset * 7)
  return x
}

export function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export const fmtMD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export function fromMinutes(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}
export function endTime(start: string, durationMin: number) {
  return fromMinutes(toMinutes(start) + durationMin)
}

export type Session = WeeklySlot & { date: Date; key: string; booked: number }

/** Expand the recurring timetable into dated sessions for one week (Mon–Sun). */
export function sessionsForWeek(weekStart: Date, timetable: WeeklySlot[] = weeklyTimetable): Session[] {
  return timetable
    .map((slot) => {
      const date = addDays(weekStart, (slot.weekday + 6) % 7)
      return { ...slot, date, key: `${slot.id}@${isoDate(date)}`, booked: stubBookedCount(slot) }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime() || toMinutes(a.start) - toMinutes(b.start))
}

export type DayPart = 'all' | 'morning' | 'noon' | 'evening'
export const dayPartLabel: Record<DayPart, string> = { all: '全部時段', morning: '早上 ～12:00', noon: '午間 12–17', evening: '晚上 17:00～' }
export function inDayPart(start: string, part: DayPart) {
  const m = toMinutes(start)
  if (part === 'morning') return m < 720
  if (part === 'noon') return m >= 720 && m < 1020
  if (part === 'evening') return m >= 1020
  return true
}
