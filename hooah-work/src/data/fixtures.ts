/**
 * Stub data for the Hooah運動 site.
 *
 * Everything the UI renders comes from this one module so a later milestone can
 * swap these constants for Netlify Database queries without touching the screens.
 * See PLAN.md for the roadmap.
 */

export const store = {
  brand: 'Hooah運動',
  branch: '板橋江翠店',
  slogan: '練得更強，瘦得更聰明。',
  tagline: '板橋江翠在地的運動教室 × 個人化減重計畫',
  address: '220 新北市板橋區松翠里松柏街 83 號',
  hours: '09:00 – 21:00',
  hoursNote: '每日營業・預約服務時段',
  phone: '',
  // TODO(owner): replace with the official LINE account link (https://lin.ee/xxxx or https://line.me/R/ti/p/@id)
  lineOfficialUrl: 'https://line.me/R/ti/p/@hooah',
  mapsUrl: 'https://maps.app.goo.gl/qTYvmBCZvmsurk9y5',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=' +
    encodeURIComponent('Hooah運動 板橋江翠店 新北市板橋區松柏街83號') +
    '&output=embed',
  transit: [
    {
      kind: '捷運',
      title: '板南線・江子翠站',
      detail: '出站後沿文化路往松柏街方向步行，約 10 分鐘抵達。',
    },
    {
      kind: '公車',
      title: '松柏街周邊站牌',
      detail: '多條路線行經江翠一帶，建議以 Google 地圖即時規劃最近站牌與班次。',
    },
    {
      kind: '停車',
      title: '汽機車停車',
      detail: '周邊有路邊停車格與收費停車場；機車可停放鄰近機車格，請勿停放騎樓。',
    },
  ],
} as const

/** Hero media. Set `video` to an mp4 URL to use a full-screen video background instead of the slideshow. */
export const heroMedia: { video?: string; slides: { src: string; alt: string }[] } = {
  slides: [
    { src: '/img/hero.png', alt: '學員在 Hooah運動進行壺鈴團體訓練' },
    { src: '/img/studio.png', alt: '有氧教室的團體課程' },
    { src: '/img/coaching.png', alt: '教練一對一指導學員深蹲' },
  ],
}

export type Coach = {
  id: string
  name: string
  title: string
  avatar: string
  photo: string
  bio: string
  certifications: string[]
  specialties: string[]
  lineUrl: string
  /** Weekly working hours used to compute 1-on-1 slots. 0 = Sunday. */
  workingDays: number[]
  workStart: string
  workEnd: string
}

// TODO(owner): replace with the real coach names, photos, bios and personal LINE links.
export const coaches: Coach[] = [
  {
    id: 'coach-kai',
    name: 'Kai 凱',
    title: '總教練・肌力與減脂專家',
    avatar: '/img/coach-1.png',
    photo: '/img/coach-1.png',
    bio: '前體育系田徑選手，投入肌力體能訓練 9 年。擅長把複雜的訓練科學拆成上班族也能持續的課表，帶領超過 300 位學員完成減脂目標。',
    certifications: ['NSCA-CSCS 肌力與體能專家', '中華民國健身指導員 C 級', 'ACE 體重管理專家'],
    specialties: ['增肌減脂', '肌力體能', '體態雕塑', '運動傷害預防'],
    lineUrl: 'https://line.me/ti/p/~hooah.kai',
    workingDays: [1, 2, 3, 4, 5, 6],
    workStart: '09:00',
    workEnd: '21:00',
  },
  {
    id: 'coach-mia',
    name: 'Mia 米亞',
    title: '減重計畫主理人・營養規劃',
    avatar: '/img/coach-2.png',
    photo: '/img/coach-2.png',
    bio: '營養學背景出身的教練，專注女性體態與產後恢復。相信「吃對比少吃更重要」，以飲食記錄＋漸進訓練，陪學員建立不復胖的生活習慣。',
    certifications: ['ACSM-CPT 國際私人教練', '國家高考營養師', '產後運動指導認證'],
    specialties: ['產後修復', '飲食規劃', '女性體態', '核心穩定'],
    lineUrl: 'https://line.me/ti/p/~hooah.mia',
    workingDays: [0, 2, 3, 4, 5, 6],
    workStart: '09:00',
    workEnd: '21:00',
  },
]

export type ClassType = {
  id: string
  name: string
  en: string
  intensity: 1 | 2 | 3
  color: string
  blurb: string
}

export const classTypes: ClassType[] = [
  { id: 'hiit', name: '燃脂 HIIT', en: 'BURN', intensity: 3, color: 'oklch(0.66 0.205 40)', blurb: '高強度間歇，45 分鐘全身燃脂。' },
  { id: 'kb', name: '壺鈴肌力', en: 'KETTLEBELL', intensity: 2, color: 'oklch(0.45 0.12 250)', blurb: '從擺盪到推舉，建立全身力量。' },
  { id: 'core', name: '核心皮拉提斯', en: 'CORE', intensity: 1, color: 'oklch(0.6 0.12 165)', blurb: '深層核心與姿勢矯正。' },
  { id: 'trx', name: 'TRX 懸吊', en: 'TRX', intensity: 2, color: 'oklch(0.55 0.15 300)', blurb: '自體重量訓練，穩定與爆發兼具。' },
  { id: 'box', name: '拳擊有氧', en: 'BOXING', intensity: 3, color: 'oklch(0.55 0.2 20)', blurb: '組合拳＋步伐，釋放壓力超紓壓。' },
  { id: 'mobility', name: '伸展放鬆', en: 'MOBILITY', intensity: 1, color: 'oklch(0.7 0.12 90)', blurb: '筋膜放鬆與關節活動度。' },
]

export const rooms = ['有氧教室 A', '重訓區', '多功能教室 B'] as const

export type WeeklySlot = {
  id: string
  classTypeId: string
  coachId: string
  weekday: number // 0 = Sunday
  start: string
  durationMin: number
  capacity: number
  room: (typeof rooms)[number]
}

/** The recurring weekly timetable (what admins will edit in the calendar). */
export const weeklyTimetable: WeeklySlot[] = [
  { id: 'w1', classTypeId: 'hiit', coachId: 'coach-kai', weekday: 1, start: '09:00', durationMin: 45, capacity: 12, room: '有氧教室 A' },
  { id: 'w2', classTypeId: 'core', coachId: 'coach-mia', weekday: 1, start: '10:30', durationMin: 50, capacity: 10, room: '多功能教室 B' },
  { id: 'w3', classTypeId: 'kb', coachId: 'coach-kai', weekday: 1, start: '19:30', durationMin: 60, capacity: 10, room: '重訓區' },
  { id: 'w4', classTypeId: 'box', coachId: 'coach-kai', weekday: 2, start: '12:15', durationMin: 45, capacity: 14, room: '有氧教室 A' },
  { id: 'w5', classTypeId: 'trx', coachId: 'coach-mia', weekday: 2, start: '18:30', durationMin: 50, capacity: 8, room: '多功能教室 B' },
  { id: 'w6', classTypeId: 'hiit', coachId: 'coach-mia', weekday: 2, start: '20:00', durationMin: 45, capacity: 12, room: '有氧教室 A' },
  { id: 'w7', classTypeId: 'mobility', coachId: 'coach-mia', weekday: 3, start: '09:30', durationMin: 50, capacity: 12, room: '多功能教室 B' },
  { id: 'w8', classTypeId: 'kb', coachId: 'coach-kai', weekday: 3, start: '12:15', durationMin: 45, capacity: 10, room: '重訓區' },
  { id: 'w9', classTypeId: 'box', coachId: 'coach-kai', weekday: 3, start: '19:30', durationMin: 50, capacity: 14, room: '有氧教室 A' },
  { id: 'w10', classTypeId: 'core', coachId: 'coach-mia', weekday: 4, start: '10:00', durationMin: 50, capacity: 10, room: '多功能教室 B' },
  { id: 'w11', classTypeId: 'hiit', coachId: 'coach-kai', weekday: 4, start: '18:30', durationMin: 45, capacity: 12, room: '有氧教室 A' },
  { id: 'w12', classTypeId: 'trx', coachId: 'coach-kai', weekday: 4, start: '20:00', durationMin: 50, capacity: 8, room: '重訓區' },
  { id: 'w13', classTypeId: 'kb', coachId: 'coach-mia', weekday: 5, start: '12:15', durationMin: 45, capacity: 10, room: '重訓區' },
  { id: 'w14', classTypeId: 'hiit', coachId: 'coach-kai', weekday: 5, start: '19:00', durationMin: 45, capacity: 12, room: '有氧教室 A' },
  { id: 'w15', classTypeId: 'box', coachId: 'coach-kai', weekday: 6, start: '10:00', durationMin: 60, capacity: 16, room: '有氧教室 A' },
  { id: 'w16', classTypeId: 'core', coachId: 'coach-mia', weekday: 6, start: '11:30', durationMin: 50, capacity: 10, room: '多功能教室 B' },
  { id: 'w17', classTypeId: 'kb', coachId: 'coach-kai', weekday: 6, start: '15:00', durationMin: 60, capacity: 10, room: '重訓區' },
  { id: 'w18', classTypeId: 'mobility', coachId: 'coach-mia', weekday: 0, start: '10:00', durationMin: 60, capacity: 14, room: '多功能教室 B' },
  { id: 'w19', classTypeId: 'trx', coachId: 'coach-mia', weekday: 0, start: '14:00', durationMin: 50, capacity: 8, room: '重訓區' },
]

/** Deterministic stub booking counts so server and client render the same numbers. */
export function stubBookedCount(slot: WeeklySlot): number {
  const seed = Number(slot.id.replace(/\D/g, '')) * 7 + slot.weekday * 3
  const ratios = [0.3, 0.55, 0.85, 1, 0.45, 0.92, 0.6, 1, 0.2, 0.75]
  return Math.min(slot.capacity, Math.round(slot.capacity * ratios[seed % ratios.length]))
}

export type Availability = 'open' | 'almost' | 'full'
export function availabilityOf(booked: number, capacity: number): Availability {
  if (booked >= capacity) return 'full'
  if (capacity - booked <= 2) return 'almost'
  return 'open'
}
export const availabilityLabel: Record<Availability, string> = {
  open: '預約中',
  almost: '即將額滿',
  full: '已額滿',
}

export type ConsultService = { id: string; name: string; desc: string; durations: number[] }
export const consultServices: ConsultService[] = [
  { id: 'fatloss', name: '減肥／減脂諮詢', desc: '飲食習慣盤點、目標設定與 12 週計畫建議。', durations: [45, 60] },
  { id: 'posture', name: '體態評估', desc: 'InBody 體組成＋姿勢與動作評估，找出卡關原因。', durations: [45, 60] },
]

/** Stub: already-booked 1-on-1 slots, as `${coachId}|${weekdayOffsetFromToday}|${HH:MM}`. */
export const stubBusyConsults = new Set([
  'coach-kai|0|10:00',
  'coach-kai|0|14:00',
  'coach-kai|1|09:00',
  'coach-kai|1|19:00',
  'coach-mia|0|11:00',
  'coach-mia|1|15:00',
  'coach-mia|2|10:00',
  'coach-mia|2|18:00',
])

export const programPillars = [
  { no: '01', title: '飲食', en: 'EAT', desc: '不挨餓的外食攻略與餐盤比例，教練每日回覆飲食紀錄。' },
  { no: '02', title: '訓練', en: 'TRAIN', desc: '依體能與目標排出每週 2–3 次課表，肌力為主、有氧為輔。' },
  { no: '03', title: '追蹤', en: 'TRACK', desc: '每兩週 InBody 檢測與照片記錄，數據說話、即時調整。' },
]

export const transformations = [
  { name: '陳小姐', age: 34, weeks: 12, before: 68.4, after: 59.8, fat: -7.2, quote: '產後一直瘦不下來，第一次知道原來吃飽也能瘦。' },
  { name: '林先生', age: 41, weeks: 16, before: 92.1, after: 80.3, fat: -9.5, quote: '健檢紅字全部消失，現在每週固定來上壺鈴課。' },
  { name: '黃小姐', age: 27, weeks: 10, before: 57.0, after: 52.6, fat: -5.1, quote: '體重沒掉很多，但褲子小了兩號，線條完全不一樣。' },
]

export type MediaItem = { id: string; type: 'image' | 'video'; src: string; label: string; area: string }
/** Media wall. Admin upload/replace arrives with the Blobs milestone. */
export const mediaWall: MediaItem[] = [
  { id: 'm1', type: 'image', src: '/img/weights.png', label: '重訓區', area: 'STRENGTH' },
  { id: 'm2', type: 'image', src: '/img/studio.png', label: '有氧教室', area: 'STUDIO' },
  { id: 'm3', type: 'image', src: '/img/lounge.png', label: '更衣休息區', area: 'LOUNGE' },
  { id: 'm4', type: 'image', src: '/img/coaching.png', label: '1 對 1 指導', area: 'COACHING' },
  { id: 'm5', type: 'image', src: '/img/nutrition.png', label: '飲食規劃', area: 'NUTRITION' },
  { id: 'm6', type: 'image', src: '/img/hero.png', label: '團體課實況', area: 'CLASS' },
]

export function coachById(id: string) {
  return coaches.find((c) => c.id === id)
}
export function classTypeById(id: string) {
  return classTypes.find((c) => c.id === id)
}

/** Stub roster names for the admin preview. */
const rosterNames = ['王小明', '李佳穎', '張志豪', '陳怡君', '林建宏', '黃雅婷', '吳承恩', '劉欣怡', '蔡宗翰', '楊淑芬', '許家瑋', '鄭雅文', '謝明哲', '洪佩珊', '郭俊傑', '曾詩涵']
export function stubRoster(count: number, seed: number) {
  return Array.from({ length: count }, (_, i) => {
    const n = rosterNames[(i + seed) % rosterNames.length]
    return {
      id: `${seed}-${i}`,
      name: n,
      phone: `09${String(12345678 + (seed * 97 + i * 131) * 1013).slice(0, 8)}`,
      email: `member${seed}${i}@example.com`,
      checkedIn: (i + seed) % 3 === 0,
    }
  })
}
