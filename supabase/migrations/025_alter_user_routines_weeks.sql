-- Add weekly block support to user_routines
-- Enables mesocycle tracking with configurable weeks and training days.

ALTER TABLE user_routines
  ADD COLUMN total_weeks    INTEGER DEFAULT 4,
  ADD COLUMN current_week   INTEGER DEFAULT 1,
  ADD COLUMN training_days  TEXT[] DEFAULT '{}';
  -- training_days example: ['lunes','miercoles','viernes']

-- Add aliases column to trainer_exercise_library for better matching
ALTER TABLE trainer_exercise_library
  ADD COLUMN aliases TEXT[] DEFAULT '{}';
  -- aliases example: ['press banca', 'bench press', 'press de banca']
