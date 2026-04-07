-- Adiciona coluna para armazenar o motivo de rejeição do cadastro do instrutor
-- Preenchida pelo admin ao recusar; enviada por e-mail ao instrutor via Resend

ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
