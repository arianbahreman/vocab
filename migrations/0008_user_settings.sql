-- User settings table for per-user preferences
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_public_vocabs BOOLEAN NOT NULL DEFAULT true,
  default_language TEXT NOT NULL DEFAULT '',
  default_level TEXT NOT NULL DEFAULT 'intermediate',
  flashcards_per_session INTEGER NOT NULL DEFAULT 20,
  review_order TEXT NOT NULL DEFAULT 'due_first',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON user_settings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
