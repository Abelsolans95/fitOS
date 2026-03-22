-- Enable pg_trgm extension for fuzzy text matching
-- Used for entity reconciliation: matching Excel exercise/food names
-- against the existing library.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for similarity search on exercise names
CREATE INDEX idx_exercise_library_name_trgm
  ON trainer_exercise_library
  USING GIN (name gin_trgm_ops);

CREATE INDEX idx_exercise_library_aliases_trgm
  ON trainer_exercise_library
  USING GIN (aliases);

-- Trigram index for food names
CREATE INDEX idx_food_library_name_trgm
  ON trainer_food_library
  USING GIN (name gin_trgm_ops);

-- Helper function: find similar exercises by name
-- Returns exercises sorted by similarity score
CREATE OR REPLACE FUNCTION search_similar_exercises(
  search_term TEXT,
  p_trainer_id UUID DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.3,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  trainer_id UUID,
  is_global BOOLEAN,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.id,
    e.name,
    e.trainer_id,
    e.is_global,
    similarity(e.name, search_term) AS similarity
  FROM trainer_exercise_library e
  WHERE
    similarity(e.name, search_term) > similarity_threshold
    AND (
      e.is_global = true
      OR e.trainer_id = p_trainer_id
    )
  ORDER BY similarity DESC
  LIMIT max_results;
$$;

-- Helper function: find similar foods by name
CREATE OR REPLACE FUNCTION search_similar_foods(
  search_term TEXT,
  p_trainer_id UUID DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.3,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  trainer_id UUID,
  is_global BOOLEAN,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    f.id,
    f.name,
    f.trainer_id,
    f.is_global,
    similarity(f.name, search_term) AS similarity
  FROM trainer_food_library f
  WHERE
    similarity(f.name, search_term) > similarity_threshold
    AND (
      f.is_global = true
      OR f.trainer_id = p_trainer_id
    )
  ORDER BY similarity DESC
  LIMIT max_results;
$$;
