-- Add JSONB fields column for type-specific data
ALTER TABLE vocabulary
  ADD COLUMN IF NOT EXISTS fields JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Map legacy types to the new 5-type system before applying the constraint
UPDATE vocabulary SET type = 'noun'   WHERE type IN ('word', 'other');
UPDATE vocabulary SET type = 'verb'   WHERE type IN ('adverb');
UPDATE vocabulary SET type = 'phrase' WHERE type IN ('expression', 'idiom', 'preposition');

-- Update type check constraint to match new supported types
ALTER TABLE vocabulary DROP CONSTRAINT IF EXISTS vocabulary_type_check;
ALTER TABLE vocabulary ADD CONSTRAINT vocabulary_type_check
  CHECK (type IN ('noun', 'verb', 'adjective', 'sentence', 'phrase'));

-- Add a GIN index for querying inside JSONB if needed
CREATE INDEX IF NOT EXISTS idx_vocabulary_fields ON vocabulary USING GIN (fields);
