CREATE TABLE IF NOT EXISTS site_content (
  content_key text PRIMARY KEY,
  content_value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO site_content(content_key,content_value) VALUES
('hero_slogan','讓訓練成為更好的日常'),
('hero_tagline','專業訓練・陪伴改變'),
('hero_description','小班制團體課線上即時預約，或與專屬教練一起打造你的 12 週減脂計畫。'),
('hero_cta_class','查看課表預約'),
('hero_cta_consult','預約減重諮詢')
ON CONFLICT (content_key) DO NOTHING;
