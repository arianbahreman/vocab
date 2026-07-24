-- Add adverb, pronoun, preposition to the type check constraint
ALTER TABLE vocabulary DROP CONSTRAINT IF EXISTS vocabulary_type_check;
ALTER TABLE vocabulary ADD CONSTRAINT vocabulary_type_check
  CHECK (type IN ('noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'sentence', 'phrase'));