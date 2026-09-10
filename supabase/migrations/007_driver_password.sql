-- ============================================================
-- Migration 007: Senha Própria do Motorista para Checklist de Saída
-- ============================================================
-- Adiciona a coluna password_hash na tabela drivers para verificação
-- de identidade no momento da liberação/saída do veículo.
-- ============================================================

ALTER TABLE IF EXISTS public.drivers
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Adiciona campo de confirmação no checklist caso a tabela exista
ALTER TABLE IF EXISTS public.checklists
ADD COLUMN IF NOT EXISTS driver_password_confirmed BOOLEAN DEFAULT FALSE;
