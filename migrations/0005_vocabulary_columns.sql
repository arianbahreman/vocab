-- Extend vocabulary table with checklist columns

ALTER TABLE vocabulary RENAME COLUMN original TO word;

ALTER TABLE vocabulary
  ADD COLUMN IF NOT EXISTS example_sentence TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'intermediate',
  ADD COLUMN IF NOT EXISTS frequency_rank INTEGER;

ALTER TABLE vocabulary DROP CONSTRAINT IF EXISTS vocabulary_category_check;
ALTER TABLE vocabulary ADD CONSTRAINT vocabulary_category_check
  CHECK (category IN (
    'home_daily_life',
    'food_dining',
    'people_relationships',
    'body_health',
    'work_money',
    'education_learning',
    'travel_transport',
    'places_environment',
    'nature_weather',
    'technology_communication',
    'government_law_society',
    'culture_arts_leisure',
    'sports_fitness',
    'emotions_personality',
    'thinking_communication',
    'time_numbers_measurement',
    'abstract_concepts_logic',
    'common_verbs_phrasal_verbs',
    'idioms_collocations',
    'connectors_function_words',
    'other'
  ));

ALTER TABLE vocabulary DROP CONSTRAINT IF EXISTS vocabulary_level_check;
ALTER TABLE vocabulary ADD CONSTRAINT vocabulary_level_check
  CHECK (level IN ('elementary', 'intermediate', 'advanced'));

CREATE INDEX IF NOT EXISTS idx_vocabulary_user_category_level
  ON vocabulary (user_id, category, level, frequency_rank);
