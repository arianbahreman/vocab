-- Add is_public column for admin-shared vocabularies
ALTER TABLE vocabulary
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_vocabulary_is_public ON vocabulary (is_public);

-- Replace single RLS policy with granular ones
DROP POLICY IF EXISTS "Users can manage their own vocabulary" ON vocabulary;

CREATE POLICY "Users can read own or public vocabulary"
  ON vocabulary
  FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can insert their own vocabulary"
  ON vocabulary
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vocabulary"
  ON vocabulary
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own vocabulary"
  ON vocabulary
  FOR DELETE
  USING (user_id = auth.uid());
