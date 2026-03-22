-- Aceita dar aula no carro do aluno
ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS accepts_student_car boolean NOT NULL DEFAULT false;

-- Tipos/modalidades de aula oferecidas (array de texto)
ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS lesson_types text[] NOT NULL DEFAULT ARRAY[]::text[];
