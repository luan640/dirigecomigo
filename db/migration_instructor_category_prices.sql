-- Adiciona colunas de preço por categoria para C, D e E na tabela instructors
ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS price_per_lesson_c numeric(10,2) CHECK (price_per_lesson_c IS NULL OR price_per_lesson_c >= 1),
  ADD COLUMN IF NOT EXISTS price_per_lesson_d numeric(10,2) CHECK (price_per_lesson_d IS NULL OR price_per_lesson_d >= 1),
  ADD COLUMN IF NOT EXISTS price_per_lesson_e numeric(10,2) CHECK (price_per_lesson_e IS NULL OR price_per_lesson_e >= 1);
