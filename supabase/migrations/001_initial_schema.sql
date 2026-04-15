-- ============================================================
-- Podcast Platform - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Podcasts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS podcasts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  author      TEXT,
  language    TEXT DEFAULT 'ar',
  category    TEXT,
  rss_url     TEXT UNIQUE,
  website_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Episodes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS episodes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  podcast_id     UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  guid           TEXT UNIQUE NOT NULL,           -- RSS item GUID for dedup
  title          TEXT NOT NULL,
  description    TEXT,
  audio_url      TEXT NOT NULL,
  audio_type     TEXT DEFAULT 'audio/mpeg',
  audio_size     BIGINT DEFAULT 0,               -- bytes
  duration       INTEGER DEFAULT 0,              -- seconds
  image_url      TEXT,
  published_at   TIMESTAMPTZ,
  episode_number INTEGER,
  season         INTEGER,
  link           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RSS Feeds ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rss_feeds (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url            TEXT UNIQUE NOT NULL,
  podcast_id     UUID REFERENCES podcasts(id) ON DELETE SET NULL,
  sync_status    TEXT DEFAULT 'pending',         -- pending | syncing | success | error
  last_synced_at TIMESTAMPTZ,
  episodes_count INTEGER DEFAULT 0,
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_episodes_published_at ON episodes(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_guid ON episodes(guid);
CREATE INDEX IF NOT EXISTS idx_podcasts_is_featured ON podcasts(is_featured);
CREATE INDEX IF NOT EXISTS idx_podcasts_title ON podcasts USING gin(to_tsvector('arabic', title));
CREATE INDEX IF NOT EXISTS idx_rss_feeds_podcast_id ON rss_feeds(podcast_id);

-- ─── Updated At Trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER podcasts_updated_at
  BEFORE UPDATE ON podcasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;

-- Public read access for all
CREATE POLICY "Public read podcasts" ON podcasts FOR SELECT USING (true);
CREATE POLICY "Public read episodes" ON episodes FOR SELECT USING (true);
CREATE POLICY "Public read rss_feeds" ON rss_feeds FOR SELECT USING (true);

-- Full access for authenticated users (admins)
CREATE POLICY "Auth full access podcasts" ON podcasts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth full access episodes" ON episodes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth full access rss_feeds" ON rss_feeds FOR ALL USING (auth.role() = 'authenticated');

-- Allow anon to insert/update (for demo - restrict in production)
CREATE POLICY "Anon insert podcasts" ON podcasts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update podcasts" ON podcasts FOR UPDATE USING (true);
CREATE POLICY "Anon delete podcasts" ON podcasts FOR DELETE USING (true);
CREATE POLICY "Anon insert episodes" ON episodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon upsert episodes" ON episodes FOR UPDATE USING (true);
CREATE POLICY "Anon delete episodes" ON episodes FOR DELETE USING (true);
CREATE POLICY "Anon insert rss_feeds" ON rss_feeds FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update rss_feeds" ON rss_feeds FOR UPDATE USING (true);
CREATE POLICY "Anon delete rss_feeds" ON rss_feeds FOR DELETE USING (true);

-- ─── Sample Data ─────────────────────────────────────────────────────────────
-- Uncomment to insert sample podcasts for testing:
/*
INSERT INTO podcasts (title, description, author, language, category, is_featured) VALUES
  ('بودكاست التقنية العربية', 'نقاشات تقنية باللغة العربية', 'فريق التقنية', 'ar', 'تقنية', true),
  ('ريادة الأعمال', 'قصص نجاح رواد الأعمال العرب', 'رواد العرب', 'ar', 'أعمال', true),
  ('ساعة ونص', 'بودكاست ترفيهي وثقافي', 'محمد علي', 'ar', 'ثقافة', false);
*/
