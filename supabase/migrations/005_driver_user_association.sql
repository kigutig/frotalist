-- ============================================================
-- Migration 005: Associar Motorista ao Usuário do Sistema
-- ============================================================
-- Adiciona a coluna user_id na tabela drivers referenciando a tabela users
-- ============================================================

ALTER TABLE IF EXISTS public.drivers
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
