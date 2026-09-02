-- ============================================================
-- Migration 002: Row Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- USERS table policies
-- ============================================================
-- Anyone authenticated can read their own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (id = auth.uid());

-- Admins can read all users
CREATE POLICY "users_admin_read_all" ON users
  FOR SELECT USING (get_user_role() = 'admin');

-- Admins can insert/update users
CREATE POLICY "users_admin_insert" ON users
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "users_admin_update" ON users
  FOR UPDATE USING (get_user_role() = 'admin');

-- ============================================================
-- TRUCKS table policies
-- ============================================================
-- All authenticated users can read trucks
CREATE POLICY "trucks_read_all" ON trucks
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admin and operators can modify trucks
CREATE POLICY "trucks_modify" ON trucks
  FOR ALL USING (get_user_role() IN ('admin', 'operator'));

-- ============================================================
-- DRIVERS table policies
-- ============================================================
-- All authenticated users can read drivers
CREATE POLICY "drivers_read_all" ON drivers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admin and operators can modify drivers
CREATE POLICY "drivers_modify" ON drivers
  FOR ALL USING (get_user_role() IN ('admin', 'operator'));

-- ============================================================
-- TRIPS table policies
-- ============================================================
-- All authenticated users can read trips
CREATE POLICY "trips_read_all" ON trips
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Drivers can only see their own trips
CREATE POLICY "trips_driver_read_own" ON trips
  FOR SELECT USING (
    get_user_role() = 'driver' AND
    driver_id = (SELECT id FROM drivers WHERE id = auth.uid())
  );

-- Admin and operators can modify
CREATE POLICY "trips_modify" ON trips
  FOR ALL USING (get_user_role() IN ('admin', 'operator'));

-- ============================================================
-- CHECKLISTS table policies
-- ============================================================
-- All authenticated users can read checklists
CREATE POLICY "checklists_read_all" ON checklists
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin and operators can create/modify checklists
CREATE POLICY "checklists_modify" ON checklists
  FOR ALL USING (get_user_role() IN ('admin', 'operator'));

-- ============================================================
-- CHECKLIST_ITEMS table policies
-- ============================================================
CREATE POLICY "checklist_items_read_all" ON checklist_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "checklist_items_modify" ON checklist_items
  FOR ALL USING (get_user_role() IN ('admin', 'operator'));

-- ============================================================
-- OCCURRENCES table policies
-- ============================================================
CREATE POLICY "occurrences_read_all" ON occurrences
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "occurrences_modify" ON occurrences
  FOR ALL USING (get_user_role() IN ('admin', 'operator'));

-- ============================================================
-- CHECKLIST_PHOTOS table policies
-- ============================================================
CREATE POLICY "photos_read_all" ON checklist_photos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "photos_modify" ON checklist_photos
  FOR ALL USING (get_user_role() IN ('admin', 'operator'));

-- ============================================================
-- SIGNATURES table policies
-- ============================================================
CREATE POLICY "signatures_read_all" ON signatures
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "signatures_modify" ON signatures
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- MAINTENANCE table policies
-- ============================================================
CREATE POLICY "maintenance_read_all" ON maintenance
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "maintenance_modify" ON maintenance
  FOR ALL USING (get_user_role() IN ('admin', 'operator'));

-- ============================================================
-- AUDIT_LOGS table policies
-- ============================================================
-- Only admins can read audit logs
CREATE POLICY "audit_read_admin" ON audit_logs
  FOR SELECT USING (get_user_role() = 'admin');

-- System can insert audit logs
CREATE POLICY "audit_insert" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
