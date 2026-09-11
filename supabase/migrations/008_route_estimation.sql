-- ============================================================
-- Migration 008: Estimativa de Distância e Tempo de Viagem (ETA)
-- ============================================================
-- Adiciona colunas para armazenar distância em KM e duração estimada
-- calculadas para rotas de caminhões.
-- ============================================================

ALTER TABLE IF EXISTS public.trips
ADD COLUMN IF NOT EXISTS estimated_distance_km NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;

ALTER TABLE IF EXISTS public.checklists
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS estimated_distance_km NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMPTZ;
