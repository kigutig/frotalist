-- ============================================================
-- Migration 001: Schema Inicial — Shopping das Academias Frota
-- ============================================================
-- Execute este arquivo no SQL Editor do Supabase:
-- https://app.supabase.com → SQL Editor → New Query
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: users (perfis dos usuários autenticados)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'driver')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: trucks
-- ============================================================
CREATE TABLE IF NOT EXISTS trucks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  internal_code TEXT UNIQUE NOT NULL,
  plate TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL,
  capacity TEXT,
  mileage INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'in_route', 'maintenance', 'blocked', 'inactive')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: drivers
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  cnh TEXT UNIQUE NOT NULL,
  cnh_category TEXT NOT NULL CHECK (cnh_category IN ('A','B','C','D','E','AB','AC','AD','AE')),
  cnh_expiration DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: trips
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id UUID NOT NULL REFERENCES trucks(id),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  departure_checklist_id UUID,
  return_checklist_id UUID,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_at TIMESTAMPTZ,
  return_at TIMESTAMPTZ,
  departure_mileage INTEGER,
  return_mileage INTEGER,
  estimated_return TIMESTAMPTZ,
  deliveries_completed INTEGER DEFAULT 0,
  deliveries_pending INTEGER DEFAULT 0,
  pending_reason TEXT,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'released', 'in_route', 'returned', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: checklists
-- ============================================================
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id),
  truck_id UUID NOT NULL REFERENCES trucks(id),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  type TEXT NOT NULL CHECK (type IN ('departure', 'return')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'completed', 'approved', 'rejected', 'released')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  mileage INTEGER NOT NULL,
  destination TEXT,
  cargo_volumes INTEGER,
  cargo_notes TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  released_by UUID REFERENCES users(id),
  release_justification TEXT,
  driver_signature TEXT,
  responsible_signature TEXT,
  responsible_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: checklist_items
-- ============================================================
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_key TEXT NOT NULL,
  item_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('ok', 'not_ok', 'na', 'pending')),
  observation TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: occurrences
-- ============================================================
CREATE TABLE IF NOT EXISTS occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id),
  truck_id UUID NOT NULL REFERENCES trucks(id),
  trip_id UUID REFERENCES trips(id),
  item_key TEXT,
  category TEXT,
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'sent_to_maintenance')),
  resolution TEXT,
  is_new_at_return BOOLEAN DEFAULT false,
  maintenance_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

-- ============================================================
-- TABELA: checklist_photos
-- ============================================================
CREATE TABLE IF NOT EXISTS checklist_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  occurrence_id UUID REFERENCES occurrences(id),
  storage_path TEXT NOT NULL,
  description TEXT,
  photo_type TEXT CHECK (photo_type IN ('front','rear','left','right','tires','cargo','panel','issue','other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: signatures
-- ============================================================
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  driver_id UUID REFERENCES drivers(id),
  type TEXT NOT NULL CHECK (type IN ('driver', 'responsible', 'manager')),
  signer_name TEXT NOT NULL,
  signature_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: maintenance
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id UUID NOT NULL REFERENCES trucks(id),
  occurrence_id UUID REFERENCES occurrences(id),
  type TEXT NOT NULL CHECK (type IN ('preventive','corrective','emergency','inspection','tire','electrical','mechanical','bodywork','other')),
  description TEXT NOT NULL,
  date DATE NOT NULL,
  mileage INTEGER,
  cost DECIMAL(10,2),
  workshop TEXT,
  parts_used TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FOREIGN KEY FIXES
-- ============================================================
ALTER TABLE occurrences ADD FOREIGN KEY (maintenance_id) REFERENCES maintenance(id);
ALTER TABLE trips ADD FOREIGN KEY (departure_checklist_id) REFERENCES checklists(id);
ALTER TABLE trips ADD FOREIGN KEY (return_checklist_id) REFERENCES checklists(id);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(status);
CREATE INDEX IF NOT EXISTS idx_trucks_plate ON trucks(plate);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_cnh_expiration ON drivers(cnh_expiration);
CREATE INDEX IF NOT EXISTS idx_trips_truck_id ON trips(truck_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_checklists_truck_id ON checklists(truck_id);
CREATE INDEX IF NOT EXISTS idx_checklists_trip_id ON checklists(trip_id);
CREATE INDEX IF NOT EXISTS idx_checklists_type ON checklists(type);
CREATE INDEX IF NOT EXISTS idx_checklists_status ON checklists(status);
CREATE INDEX IF NOT EXISTS idx_occurrences_truck_id ON occurrences(truck_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_severity ON occurrences(severity);
CREATE INDEX IF NOT EXISTS idx_occurrences_status ON occurrences(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at_trucks
  BEFORE UPDATE ON trucks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_drivers
  BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_trips
  BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_checklists
  BEFORE UPDATE ON checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_maintenance
  BEFORE UPDATE ON maintenance FOR EACH ROW EXECUTE FUNCTION update_updated_at();
