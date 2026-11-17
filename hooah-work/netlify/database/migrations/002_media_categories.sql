ALTER TABLE media_items ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'venue';
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS mime_type text NOT NULL DEFAULT 'image/jpeg';
CREATE INDEX IF NOT EXISTS idx_media_items_category_order ON media_items(category, sort_order) WHERE active=true;
