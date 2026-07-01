-- Run this in Supabase SQL Editor

-- Vocabulary table
CREATE TABLE vocabulary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('english', 'french')),
  type TEXT NOT NULL CHECK (type IN ('word', 'phrase', 'verb')),
  original TEXT NOT NULL,
  meaning TEXT NOT NULL,
  notes TEXT DEFAULT '',
  score INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Review history table
CREATE TABLE review_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  reviewed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_vocabulary_user_id ON vocabulary(user_id);
CREATE INDEX idx_vocabulary_language ON vocabulary(language);
CREATE INDEX idx_vocabulary_type ON vocabulary(type);
CREATE INDEX idx_review_history_vocabulary_id ON review_history(vocabulary_id);

-- Row level security
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users can manage their own vocabulary"
  ON vocabulary
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own review history"
  ON review_history
  USING (
    vocabulary_id IN (
      SELECT id FROM vocabulary WHERE user_id = auth.uid()
    )
  );
