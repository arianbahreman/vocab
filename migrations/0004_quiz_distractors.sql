CREATE OR REPLACE FUNCTION get_random_quiz_choices(
  p_exclude_id UUID,
  p_language TEXT DEFAULT NULL,
  p_limit INT DEFAULT 12
)
RETURNS TABLE(meaning TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.meaning
  FROM vocabulary v
  WHERE v.user_id = auth.uid()
    AND v.id != p_exclude_id
    AND v.meaning IS NOT NULL
    AND v.meaning <> (
      SELECT meaning FROM vocabulary WHERE id = p_exclude_id AND user_id = auth.uid()
    )
    AND (p_language IS NULL OR v.language = p_language)
  ORDER BY random()
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_random_quiz_choices(UUID, TEXT, INT) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_vocabulary_user_language
  ON vocabulary (user_id, language);
