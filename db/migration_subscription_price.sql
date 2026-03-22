-- Adiciona coluna de preco da assinatura mensal dos instrutores na tabela platform_settings
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS subscription_price numeric(10,2) NOT NULL DEFAULT 15
    CHECK (subscription_price > 0);
