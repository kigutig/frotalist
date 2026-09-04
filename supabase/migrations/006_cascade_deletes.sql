-- ============================================================
-- Migration 006: Cascade Deletes for Trucks and Drivers
-- Execute este script no SQL Editor do seu painel Supabase
-- caso deseje que o próprio PostgreSQL faça a exclusão em cascata.
-- ============================================================

-- 1. Trips -> Trucks
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_truck_id_fkey;
ALTER TABLE trips ADD CONSTRAINT trips_truck_id_fkey
  FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE;

-- 2. Checklists -> Trucks
ALTER TABLE checklists DROP CONSTRAINT IF EXISTS checklists_truck_id_fkey;
ALTER TABLE checklists ADD CONSTRAINT checklists_truck_id_fkey
  FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE;

-- 3. Occurrences -> Trucks
ALTER TABLE occurrences DROP CONSTRAINT IF EXISTS occurrences_truck_id_fkey;
ALTER TABLE occurrences ADD CONSTRAINT occurrences_truck_id_fkey
  FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE;

-- 4. Maintenance -> Trucks
ALTER TABLE maintenance DROP CONSTRAINT IF EXISTS maintenance_truck_id_fkey;
ALTER TABLE maintenance ADD CONSTRAINT maintenance_truck_id_fkey
  FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE;

-- 5. Trips -> Drivers
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_driver_id_fkey;
ALTER TABLE trips ADD CONSTRAINT trips_driver_id_fkey
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;

-- 6. Checklists -> Drivers
ALTER TABLE checklists DROP CONSTRAINT IF EXISTS checklists_driver_id_fkey;
ALTER TABLE checklists ADD CONSTRAINT checklists_driver_id_fkey
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;
