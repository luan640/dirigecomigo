-- Status de aprovação do instrutor pelo admin
ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cnh_photo_url text;

-- Instrutores já verificados são marcados como aprovados/ativos
UPDATE instructors
SET status = 'approved', is_active = true
WHERE is_verified = true;
