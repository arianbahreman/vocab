ALTER TABLE vocabulary DROP CONSTRAINT IF EXISTS vocabulary_type_check;
ALTER TABLE vocabulary ADD CONSTRAINT vocabulary_type_check
  CHECK (type IN ('word','phrase','verb','noun','adjective','adverb','expression','idiom','preposition','other'));
