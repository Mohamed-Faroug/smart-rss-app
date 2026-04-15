-- ============================================================
-- User Features: Favorites & Listen History
-- Run this in Supabase SQL Editor AFTER migration 001
-- ============================================================

-- Favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, episode_id)
);

-- Listen history table
CREATE TABLE IF NOT EXISTS listen_history (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id  UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  listened_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, episode_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_listen_history_user ON listen_history(user_id, listened_at DESC);

-- RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE listen_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own history" ON listen_history
  FOR ALL USING (auth.uid() = user_id);
