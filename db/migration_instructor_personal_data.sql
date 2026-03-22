-- Dados pessoais do instrutor
ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS cpf text;
