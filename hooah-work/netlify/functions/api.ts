import { getDatabase } from '@netlify/database'
import { getUser, verifyRequestOrigin } from '@netlify/identity'
import { getStore } from '@netlify/blobs'

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
const bad = (message: string, status = 400) => json({ error: message }, status)
const readBody = async (request: Request) => request.json().catch(() => ({})) as Promise<Record<string, unknown>>

async function requireUser() {
  const user = await getUser()
  if (!user) throw Object.assign(new Error('請先登入'), { status: 401 })
  return user
}
async function requireAdmin() {
  const user = await requireUser()
  if (!user.roles?.includes('admin')) throw Object.assign(new Error('只有管理員可以執行此操作'), { status: 403 })
  return user
}
async function requireStaff() {
  const user = await requireUser()
  if (!user.roles?.some((r: string) => r === 'admin' || r === 'coach')) throw Object.assign(new Error('沒有後台權限'), { status: 403 })
  return user
}

export default async (request: Request) => {
  const url = new URL(request.url)
  const resource = url.searchParams.get('resource') ?? ''
  const method = request.method
  try {
    // All state-changing API requests must originate from this site.
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') verifyRequestOrigin(request)
    const db = getDatabase()

    if (method === 'GET' && resource === 'media-file') {
      const key = url.searchParams.get('key') ?? ''
      if (!/^[a-zA-Z0-9._-]{1,120}$/.test(key)) return bad('圖片不存在', 404)
      const rows = await db.sql`SELECT storage_key,mime_type FROM media_items WHERE storage_key=${key} AND active=true LIMIT 1`
      if (!rows.length) return bad('圖片不存在', 404)
      const store = getStore('hooah-media')
      const data = await store.get(key, { type: 'arrayBuffer' })
      if (!data) return bad('圖片不存在', 404)
      return new Response(data, { headers: { 'Content-Type': rows[0].mime_type || 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } })
    }

    if (method === 'GET' && resource === 'media-public') {
      const category = url.searchParams.get('category') ?? ''
      if (!['hero','classes','coaches','results','venue','news'].includes(category)) return bad('無效的圖片分類')
      const items = await db.sql`SELECT id,title,category,public_url AS "publicUrl",sort_order AS "sortOrder" FROM media_items WHERE active=true AND category=${category} ORDER BY sort_order,created_at`
      return json({ items })
    }

    if (method === 'GET' && resource === 'media-admin') {
      await requireAdmin()
      const items = await db.sql`SELECT id,title,category,public_url AS "publicUrl",sort_order AS "sortOrder",created_at AS "createdAt" FROM media_items WHERE active=true ORDER BY category,sort_order,created_at DESC`
      return json({ items })
    }

    if (method === 'POST' && resource === 'media-upload') {
      await requireAdmin()
      const form = await request.formData()
      const file = form.get('file')
      const category = String(form.get('category') ?? '')
      const title = String(form.get('title') ?? '').trim().slice(0,120)
      const allowed = ['hero','classes','coaches','results','venue','news']
      if (!(file instanceof File) || !allowed.includes(category) || !title) return bad('請提供圖片、分類與名稱')
      if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) return bad('僅支援 JPG、PNG、WebP、GIF 圖片')
      if (file.size < 1 || file.size > 4 * 1024 * 1024) return bad('圖片大小不可超過 4MB')
      const ext = ({ 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif' } as Record<string,string>)[file.type]
      const fileBuffer = await file.arrayBuffer()
      const bytes = new Uint8Array(fileBuffer)
      const signature = Array.from(bytes.slice(0, 12))
      const validImage = file.type === 'image/jpeg' ? signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
        : file.type === 'image/png' ? signature.slice(0,8).join(',') === '137,80,78,71,13,10,26,10'
        : file.type === 'image/gif' ? String.fromCharCode(...signature.slice(0,6)).startsWith('GIF8')
        : file.type === 'image/webp' ? String.fromCharCode(...signature.slice(0,4)) === 'RIFF' && String.fromCharCode(...signature.slice(8,12)) === 'WEBP'
        : false
      if (!validImage) return bad('圖片格式驗證失敗，請重新選擇圖片')
      const key = `${crypto.randomUUID()}.${ext}`
      const store = getStore('hooah-media')
      await store.set(key, fileBuffer, { metadata: { contentType: file.type } })
      try {
        const order = await db.sql`SELECT COALESCE(MAX(sort_order),-1)::int AS max FROM media_items WHERE category=${category}`
        const publicUrl = `/.netlify/functions/api?resource=media-file&key=${key}`
        const rows = await db.sql`INSERT INTO media_items(kind,title,storage_key,public_url,sort_order,category,mime_type) VALUES('photo',${title},${key},${publicUrl},${Number(order[0]?.max ?? -1)+1},${category},${file.type}) RETURNING id`
        return json({ ok: true, id: rows[0].id, publicUrl }, 201)
      } catch (error) { await store.delete(key); throw error }
    }

    if (method === 'POST' && resource === 'media-reorder') {
      await requireAdmin()
      const body = await readBody(request)
      const ids = Array.isArray(body.ids) ? body.ids.map(String).slice(0,200) : []
      for (let i=0; i<ids.length; i++) await db.sql`UPDATE media_items SET sort_order=${i} WHERE id=${ids[i]} AND active=true`
      return json({ ok: true })
    }

    if (method === 'DELETE' && resource === 'media-delete') {
      await requireAdmin()
      const id = url.searchParams.get('id') ?? ''
      const rows = await db.sql`UPDATE media_items SET active=false WHERE id=${id} AND active=true RETURNING storage_key`
      if (!rows.length) return bad('找不到圖片',404)
      const store = getStore('hooah-media')
      await store.delete(rows[0].storage_key)
      return json({ ok: true })
    }

    if (method === 'GET' && resource === 'public-sessions') {
      const start = url.searchParams.get('start') ?? new Date().toISOString().slice(0,10)
      const end = url.searchParams.get('end') ?? start
      const rows = await db.sql`SELECT ws.id,ws.class_type_id AS \"classTypeId\",ws.coach_id AS \"coachId\",ws.weekday,to_char(ws.start_time,'HH24:MI') AS start,ws.duration_min AS \"durationMin\",ws.capacity,ws.room,gs.day::date::text AS date,COUNT(b.id)::int AS booked FROM weekly_slots ws CROSS JOIN LATERAL generate_series(${start}::date,${end}::date,interval '1 day') AS gs(day) LEFT JOIN class_sessions cs ON cs.weekly_slot_id=ws.id AND cs.session_date=gs.day::date AND cs.status='open' LEFT JOIN class_bookings b ON b.session_id=cs.id AND b.status='confirmed' WHERE ws.active=true AND EXTRACT(DOW FROM gs.day)=ws.weekday GROUP BY ws.id,gs.day ORDER BY gs.day,ws.start_time`
      return json({ sessions: rows })
    }

    if (method === 'GET' && resource === 'public') {
      const [coaches, classTypes, slots] = await Promise.all([
        db.sql`SELECT id,name,title,avatar,photo,bio,certifications,specialties,line_url AS "lineUrl",working_days AS "workingDays",to_char(work_start,'HH24:MI') AS "workStart",to_char(work_end,'HH24:MI') AS "workEnd" FROM coaches WHERE active=true ORDER BY name`,
        db.sql`SELECT id,name,en,intensity,color,blurb FROM class_types WHERE active=true ORDER BY name`,
        db.sql`SELECT id,class_type_id AS "classTypeId",coach_id AS "coachId",weekday,to_char(start_time,'HH24:MI') AS start,duration_min AS "durationMin",capacity,room FROM weekly_slots WHERE active=true ORDER BY weekday,start_time`,
      ])
      return json({ coaches, classTypes, slots })
    }

    if (method === 'POST' && resource === 'class-booking') {
      const body = await readBody(request)
      const slotId = String(body.slotId ?? '')
      const date = String(body.date ?? '')
      const name = String(body.name ?? '').trim()
      const phone = String(body.phone ?? '').replace(/[\s-]/g, '')
      const email = String(body.email ?? '').trim()
      if (!slotId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !name || !/^09\d{8}$/.test(phone) || !/^\S+@\S+\.\S+$/.test(email)) return bad('預約資料不完整或格式錯誤')
      const client = await db.pool.connect()
      try {
        await client.query('BEGIN')
        const slotResult = await client.query('SELECT * FROM weekly_slots WHERE id=$1 AND active=true FOR SHARE', [slotId])
        if (!slotResult.rowCount) { await client.query('ROLLBACK'); return bad('課程不存在或已停開', 404) }
        const slot = slotResult.rows[0]
        const weekday = new Date(`${date}T12:00:00+08:00`).getDay()
        if (weekday !== slot.weekday) { await client.query('ROLLBACK'); return bad('課程日期與星期不符') }
        const sessionResult = await client.query(`INSERT INTO class_sessions (weekly_slot_id,session_date,start_time,duration_min,capacity,room)
          VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (weekly_slot_id,session_date) DO UPDATE SET weekly_slot_id=EXCLUDED.weekly_slot_id RETURNING id,capacity,status`, [slotId,date,slot.start_time,slot.duration_min,slot.capacity,slot.room])
        const session = sessionResult.rows[0]
        if (session.status !== 'open') { await client.query('ROLLBACK'); return bad('此堂課已取消', 409) }
        await client.query('SELECT id FROM class_sessions WHERE id=$1 FOR UPDATE', [session.id])
        const duplicate = await client.query(`SELECT b.id FROM class_bookings b JOIN members m ON m.id=b.member_id WHERE b.session_id=$1 AND m.phone=$2 AND b.status IN ('confirmed','waitlist')`, [session.id,phone])
        if (duplicate.rowCount) { await client.query('ROLLBACK'); return bad('此手機已預約這堂課', 409) }
        const memberResult = await client.query(`INSERT INTO members(name,phone,email) VALUES($1,$2,$3)
          ON CONFLICT(phone) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,updated_at=now() RETURNING id`, [name,phone,email])
        const countResult = await client.query(`SELECT count(*)::int AS count FROM class_bookings WHERE session_id=$1 AND status='confirmed'`, [session.id])
        const status = countResult.rows[0].count >= session.capacity ? 'waitlist' : 'confirmed'
        const bookingResult = await client.query(`INSERT INTO class_bookings(session_id,member_id,status,reminder_line) VALUES($1,$2,$3,$4) RETURNING booking_code,status`, [session.id,memberResult.rows[0].id,status,body.lineNotify === true])
        await client.query('COMMIT')
        return json({ ok: true, ...bookingResult.rows[0] }, 201)
      } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    }

    if (method === 'GET' && resource === 'consult-busy') {
      const coachId = url.searchParams.get('coachId') ?? ''
      const startDate = url.searchParams.get('startDate') ?? new Date().toISOString().slice(0,10)
      const endDate = url.searchParams.get('endDate') ?? startDate
      const rows = await db.sql`SELECT starts_at AS "startsAt",duration_min AS "durationMin" FROM consult_bookings WHERE coach_id=${coachId} AND status IN ('pending','confirmed') AND starts_at >= (${startDate}::date::timestamp AT TIME ZONE 'Asia/Taipei') AND starts_at < ((${endDate}::date + interval '1 day')::timestamp AT TIME ZONE 'Asia/Taipei')`
      return json({ busy: rows })
    }

    if (method === 'POST' && resource === 'consult-booking') {
      const body = await readBody(request)
      const name = String(body.name ?? '').trim(), phone = String(body.phone ?? '').replace(/[\s-]/g, '')
      const coachId = String(body.coachId ?? ''), serviceId = String(body.serviceId ?? '')
      const startsAt = String(body.startsAt ?? ''), duration = Number(body.duration)
      if (!name || !/^09\d{8}$/.test(phone) || !coachId || !serviceId || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/.test(startsAt) || ![45,60].includes(duration)) return bad('諮詢資料不完整')
      const client = await db.pool.connect()
      try {
        await client.query('BEGIN')
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [coachId])
        const service = await client.query('SELECT id FROM consult_services WHERE id=$1 AND active=true', [serviceId])
        const coach = await client.query('SELECT id FROM coaches WHERE id=$1 AND active=true', [coachId])
        if (!service.rowCount || !coach.rowCount) { await client.query('ROLLBACK'); return bad('服務項目或教練不存在', 404) }
        const overlap = await client.query(`SELECT id FROM consult_bookings WHERE coach_id=$1 AND status IN ('pending','confirmed') AND tstzrange(starts_at, starts_at + duration_min * interval '1 minute', '[)') && tstzrange($2::timestamptz, $2::timestamptz + $3 * interval '1 minute', '[)')`, [coachId,startsAt,duration])
        if (overlap.rowCount) { await client.query('ROLLBACK'); return bad('此教練時段已被預約，請重新選擇', 409) }
        const result = await client.query(`INSERT INTO consult_bookings(service_id,coach_id,member_name,phone,height_cm,weight_kg,goal,habit,note,starts_at,duration_min) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::timestamptz,$11) RETURNING id,status`, [serviceId,coachId,name,phone,body.height ? Number(body.height) : null,body.weight ? Number(body.weight) : null,String(body.goal ?? ''),String(body.habit ?? ''),String(body.note ?? ''),startsAt,duration])
        await client.query('COMMIT')
        return json({ ok: true, booking: result.rows[0] }, 201)
      } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    }

    if (method === 'GET' && resource === 'admin-bootstrap') {
      const user = await requireStaff()
      const isAdmin = user.roles?.includes('admin') ?? false
      const profile = await db.sql`SELECT id,identity_user_id,email,display_name,role,coach_id,active FROM profiles WHERE identity_user_id=${user.id} AND active=true LIMIT 1`
      const linkedCoach = profile[0]?.coach_id ?? null
      if (!isAdmin && !linkedCoach) return bad('教練帳號尚未綁定教練資料，請聯絡管理員', 403)
      const [slots, coaches, classTypes] = await Promise.all([
        isAdmin
          ? db.sql`SELECT id,class_type_id AS "classTypeId",coach_id AS "coachId",weekday,to_char(start_time,'HH24:MI') AS start,duration_min AS "durationMin",capacity,room FROM weekly_slots WHERE active=true ORDER BY weekday,start_time`
          : db.sql`SELECT id,class_type_id AS "classTypeId",coach_id AS "coachId",weekday,to_char(start_time,'HH24:MI') AS start,duration_min AS "durationMin",capacity,room FROM weekly_slots WHERE active=true AND coach_id=${linkedCoach} ORDER BY weekday,start_time`,
        isAdmin ? db.sql`SELECT id,name,title,avatar,photo,bio,certifications,specialties,line_url AS "lineUrl",working_days AS "workingDays",to_char(work_start,'HH24:MI') AS "workStart",to_char(work_end,'HH24:MI') AS "workEnd" FROM coaches WHERE active=true ORDER BY name` : db.sql`SELECT id,name,title,avatar,photo,bio,certifications,specialties,line_url AS "lineUrl",working_days AS "workingDays",to_char(work_start,'HH24:MI') AS "workStart",to_char(work_end,'HH24:MI') AS "workEnd" FROM coaches WHERE id=${linkedCoach} AND active=true`,
        db.sql`SELECT id,name,en,intensity,color,blurb FROM class_types WHERE active=true ORDER BY name`,
      ])
      return json({ user: { id: user.id, email: user.email, role: isAdmin ? 'admin' : 'coach', coachId: linkedCoach }, slots, coaches, classTypes })
    }

    if (method === 'GET' && resource === 'consultations') {
      const user = await requireStaff()
      const isAdmin = user.roles?.includes('admin') ?? false
      const rows = isAdmin
        ? await db.sql`SELECT cb.id,cb.member_name AS name,cb.phone,cb.starts_at AS "startsAt",cb.duration_min AS "durationMin",cb.status,cb.goal,cb.habit,cb.note,cs.name AS "serviceName",c.name AS "coachName" FROM consult_bookings cb JOIN consult_services cs ON cs.id=cb.service_id JOIN coaches c ON c.id=cb.coach_id ORDER BY cb.starts_at DESC LIMIT 300`
        : await db.sql`SELECT cb.id,cb.member_name AS name,cb.phone,cb.starts_at AS "startsAt",cb.duration_min AS "durationMin",cb.status,cb.goal,cb.habit,cb.note,cs.name AS "serviceName",c.name AS "coachName" FROM consult_bookings cb JOIN consult_services cs ON cs.id=cb.service_id JOIN coaches c ON c.id=cb.coach_id WHERE cb.coach_id=(SELECT coach_id FROM profiles WHERE identity_user_id=${user.id} AND active=true) ORDER BY cb.starts_at DESC LIMIT 300`
      return json({ consultations: rows })
    }

    if (method === 'POST' && resource === 'consultation-status') {
      const user = await requireStaff()
      const body = await readBody(request)
      const status = String(body.status ?? '')
      if (!['pending','confirmed','cancelled','completed'].includes(status)) return bad('無效的諮詢狀態')
      const isAdmin = user.roles?.includes('admin') ?? false
      const rows = await db.sql`UPDATE consult_bookings SET status=${status} WHERE id=${String(body.id)} AND (${isAdmin} OR coach_id=(SELECT coach_id FROM profiles WHERE identity_user_id=${user.id} AND active=true)) RETURNING id`
      if (!rows.length) return bad('找不到諮詢預約或沒有權限', 404)
      return json({ ok: true })
    }

    if (method === 'GET' && resource === 'roster') {
      const user = await requireStaff()
      const slotId = url.searchParams.get('slotId') ?? ''
      const date = url.searchParams.get('date') ?? ''
      const rows = await db.sql`SELECT cs.id AS "sessionId",b.id AS "bookingId",b.booking_code AS "bookingCode",b.status,b.checked_in AS "checkedIn",m.name,m.phone,m.email
        FROM class_sessions cs JOIN weekly_slots ws ON ws.id=cs.weekly_slot_id JOIN class_bookings b ON b.session_id=cs.id JOIN members m ON m.id=b.member_id
        WHERE ws.id=${slotId} AND cs.session_date=${date}::date AND b.status IN ('confirmed','waitlist')
        AND (${user.roles?.includes('admin') ?? false} OR ws.coach_id=(SELECT coach_id FROM profiles WHERE identity_user_id=${user.id} AND active=true)) ORDER BY b.created_at`
      return json({ roster: rows })
    }

    if (method === 'POST' && resource === 'admin-save-slot') {
      await requireAdmin()
      const body = await readBody(request)
      const id = String(body.id ?? `slot-${crypto.randomUUID()}`)
      const classTypeId = String(body.classTypeId ?? ''), coachId = String(body.coachId ?? '')
      const weekday = Number(body.weekday), start = String(body.start ?? '')
      const durationMin = Number(body.durationMin), capacity = Number(body.capacity), room = String(body.room ?? '')
      if (!classTypeId || !coachId || !Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !/^\d{2}:\d{2}$/.test(start) || !Number.isInteger(durationMin) || durationMin < 15 || !Number.isInteger(capacity) || capacity < 1 || !room) return bad('課程設定有誤')
      await db.sql`INSERT INTO weekly_slots(id,class_type_id,coach_id,weekday,start_time,duration_min,capacity,room) VALUES(${id},${classTypeId},${coachId},${weekday},${start},${durationMin},${capacity},${room}) ON CONFLICT(id) DO UPDATE SET class_type_id=EXCLUDED.class_type_id,coach_id=EXCLUDED.coach_id,weekday=EXCLUDED.weekday,start_time=EXCLUDED.start_time,duration_min=EXCLUDED.duration_min,capacity=EXCLUDED.capacity,room=EXCLUDED.room,updated_at=now()`
      return json({ ok: true, id })
    }

    if (method === 'POST' && resource === 'admin-save-coach') {
      await requireAdmin()
      const body = await readBody(request)
      const id = String(body.id ?? `coach-${crypto.randomUUID()}`)
      const name = String(body.name ?? '').trim(), title = String(body.title ?? '').trim()
      if (!name || !title) return bad('教練姓名及職稱為必填')
      const certifications = Array.isArray(body.certifications) ? JSON.stringify(body.certifications) : '[]'
      const specialties = Array.isArray(body.specialties) ? JSON.stringify(body.specialties) : '[]'
      await db.sql`INSERT INTO coaches(id,name,title,avatar,photo,bio,certifications,specialties,line_url) VALUES(${id},${name},${title},${String(body.avatar ?? '/img/coaching.png')},${String(body.photo ?? '/img/coaching.png')},${String(body.bio ?? '')},${certifications}::jsonb,${specialties}::jsonb,${String(body.lineUrl ?? '')}) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,title=EXCLUDED.title,bio=EXCLUDED.bio,certifications=EXCLUDED.certifications,specialties=EXCLUDED.specialties,line_url=EXCLUDED.line_url,updated_at=now()`
      return json({ ok: true, id }, 201)
    }

    if (method === 'DELETE' && resource === 'admin-delete-slot') {
      await requireAdmin()
      const id = url.searchParams.get('id') ?? ''
      await db.sql`UPDATE weekly_slots SET active=false,updated_at=now() WHERE id=${id}`
      return json({ ok: true })
    }

    if (method === 'POST' && resource === 'admin-checkin') {
      const user = await requireStaff()
      const body = await readBody(request)
      const isAdmin = user.roles?.includes('admin') ?? false
      const rows = await db.sql`UPDATE class_bookings b SET checked_in=${body.checkedIn === true} FROM class_sessions cs JOIN weekly_slots ws ON ws.id=cs.weekly_slot_id WHERE b.session_id=cs.id AND b.id=${String(body.bookingId)} AND (${isAdmin} OR ws.coach_id=(SELECT coach_id FROM profiles WHERE identity_user_id=${user.id} AND active=true)) RETURNING b.id`
      if (!rows.length) return bad('找不到簽到資料或沒有權限', 404)
      return json({ ok: true })
    }

    return bad('找不到 API 資源', 404)
  } catch (error) {
    const status = Number((error as { status?: number })?.status ?? 500)
    const message = error instanceof Error ? error.message : 'Server error'
    return bad(status === 500 ? '伺服器暫時無法處理，請稍後再試' : message, status)
  }
}
