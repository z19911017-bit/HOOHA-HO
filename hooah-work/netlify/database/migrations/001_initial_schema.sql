-- Hooah運動 booking system: initial production schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_user_id text NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL CHECK (role IN ('admin','coach')),
  coach_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coaches (
  id text PRIMARY KEY,
  identity_user_id text UNIQUE,
  name text NOT NULL,
  title text NOT NULL DEFAULT '',
  avatar text NOT NULL DEFAULT '/img/coaching.png',
  photo text NOT NULL DEFAULT '/img/coaching.png',
  bio text NOT NULL DEFAULT '',
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  specialties jsonb NOT NULL DEFAULT '[]'::jsonb,
  line_url text NOT NULL DEFAULT '',
  working_days integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6],
  work_start time NOT NULL DEFAULT '09:00',
  work_end time NOT NULL DEFAULT '21:00',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  en text NOT NULL DEFAULT '',
  intensity integer NOT NULL DEFAULT 1 CHECK (intensity BETWEEN 1 AND 3),
  color text NOT NULL DEFAULT '#3977a8',
  blurb text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS rooms (
  id bigserial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS weekly_slots (
  id text PRIMARY KEY,
  class_type_id text NOT NULL REFERENCES class_types(id),
  coach_id text NOT NULL REFERENCES coaches(id),
  weekday integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  duration_min integer NOT NULL CHECK (duration_min BETWEEN 15 AND 240),
  capacity integer NOT NULL CHECK (capacity > 0),
  room text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_slot_id text NOT NULL REFERENCES weekly_slots(id),
  session_date date NOT NULL,
  start_time time NOT NULL,
  duration_min integer NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  room text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','cancelled','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (weekly_slot_id, session_date)
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text NOT NULL DEFAULT '',
  line_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','waitlist','cancelled')),
  checked_in boolean NOT NULL DEFAULT false,
  reminder_line boolean NOT NULL DEFAULT false,
  booking_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, member_id)
);

CREATE TABLE IF NOT EXISTS consult_services (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  durations integer[] NOT NULL DEFAULT ARRAY[45,60],
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS consult_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text NOT NULL REFERENCES consult_services(id),
  coach_id text NOT NULL REFERENCES coaches(id),
  member_name text NOT NULL,
  phone text NOT NULL,
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  goal text NOT NULL DEFAULT '',
  habit text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  duration_min integer NOT NULL CHECK (duration_min IN (45,60)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('photo','short_video','hero_video')),
  title text NOT NULL DEFAULT '',
  storage_key text NOT NULL,
  public_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  before_image_url text NOT NULL DEFAULT '',
  after_image_url text NOT NULL DEFAULT '',
  weight_change numeric(5,1),
  period_weeks integer,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_class_bookings_session ON class_bookings(session_id, status);
CREATE INDEX IF NOT EXISTS idx_consult_bookings_coach_start ON consult_bookings(coach_id, starts_at);

INSERT INTO class_types (id,name,en,intensity,color,blurb) VALUES
('hiit','燃脂 HIIT','BURN',3,'oklch(0.66 0.205 40)','高強度間歇，45 分鐘全身燃脂。'),
('kb','壺鈴肌力','KETTLEBELL',2,'oklch(0.45 0.12 250)','從擺盪到推舉，建立全身力量。'),
('core','核心皮拉提斯','CORE',1,'oklch(0.6 0.12 165)','深層核心與姿勢矯正。'),
('trx','TRX 懸吊','TRX',2,'oklch(0.55 0.15 300)','自體重量訓練，穩定與爆發兼具。'),
('box','拳擊有氧','BOXING',3,'oklch(0.55 0.2 20)','組合拳＋步伐，釋放壓力超紓壓。'),
('mobility','伸展放鬆','MOBILITY',1,'oklch(0.7 0.12 90)','筋膜放鬆與關節活動度。')
ON CONFLICT (id) DO NOTHING;

INSERT INTO coaches (id,name,title,avatar,photo,bio,certifications,specialties,line_url,working_days,work_start,work_end) VALUES
('coach-kai','Kai 凱','總教練・肌力與減脂專家','/img/coach-1.png','/img/coach-1.png','前體育系田徑選手，投入肌力體能訓練 9 年。擅長把複雜的訓練科學拆成上班族也能持續的課表，帶領超過 300 位學員完成減脂目標。','["NSCA-CSCS 肌力與體能專家","中華民國健身指導員 C 級","ACE 體重管理專家"]','["增肌減脂","肌力體能","體態雕塑","運動傷害預防"]','https://line.me/ti/p/~hooah.kai',ARRAY[1,2,3,4,5,6],'09:00','21:00'),
('coach-mia','Mia 米亞','減重計畫主理人・營養規劃','/img/coach-2.png','/img/coach-2.png','營養學背景出身的教練，專注女性體態與產後恢復。相信「吃對比少吃更重要」，以飲食記錄＋漸進訓練，陪學員建立不復胖的生活習慣。','["ACSM-CPT 國際私人教練","國家高考營養師","產後運動指導認證"]','["產後修復","飲食規劃","女性體態","核心穩定"]','https://line.me/ti/p/~hooah.mia',ARRAY[0,2,3,4,5,6],'09:00','21:00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms(name) VALUES ('有氧教室 A'),('重訓區'),('多功能教室 B') ON CONFLICT (name) DO NOTHING;

INSERT INTO weekly_slots (id,class_type_id,coach_id,weekday,start_time,duration_min,capacity,room) VALUES
('w1','hiit','coach-kai',1,'09:00',45,12,'有氧教室 A'),
('w2','core','coach-mia',1,'10:30',50,10,'多功能教室 B'),
('w3','kb','coach-kai',1,'19:30',60,10,'重訓區'),
('w4','box','coach-kai',2,'12:15',45,14,'有氧教室 A'),
('w5','trx','coach-mia',2,'18:30',50,8,'多功能教室 B'),
('w6','hiit','coach-mia',2,'20:00',45,12,'有氧教室 A'),
('w7','mobility','coach-mia',3,'09:30',50,12,'多功能教室 B'),
('w8','kb','coach-kai',3,'12:15',45,10,'重訓區'),
('w9','box','coach-kai',3,'19:30',50,14,'有氧教室 A'),
('w10','core','coach-mia',4,'10:00',50,10,'多功能教室 B'),
('w11','hiit','coach-kai',4,'18:30',45,12,'有氧教室 A'),
('w12','trx','coach-kai',4,'20:00',50,8,'重訓區'),
('w13','kb','coach-mia',5,'12:15',45,10,'重訓區'),
('w14','hiit','coach-kai',5,'19:00',45,12,'有氧教室 A'),
('w15','box','coach-kai',6,'10:00',60,16,'有氧教室 A'),
('w16','core','coach-mia',6,'11:30',50,10,'多功能教室 B'),
('w17','kb','coach-kai',6,'15:00',60,10,'重訓區'),
('w18','mobility','coach-mia',0,'10:00',60,14,'多功能教室 B'),
('w19','trx','coach-mia',0,'14:00',50,8,'重訓區')
ON CONFLICT (id) DO NOTHING;

INSERT INTO consult_services (id,name,description,durations) VALUES
('fatloss','減肥／減脂諮詢','飲食習慣盤點、目標設定與 12 週計畫建議。',ARRAY[45,60]),
('posture','體態評估','InBody 體組成＋姿勢與動作評估，找出卡關原因。',ARRAY[45,60])
ON CONFLICT (id) DO NOTHING;
