-- Adiciona coluna para armazenar o documento de credenciamento DETRAN
-- emitido para instrutores autônomos (Resolução CONTRAN nº 1.020/2025)

ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS credenciamento_doc_url TEXT;
