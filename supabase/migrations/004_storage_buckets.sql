-- ============================================================
-- Migration 004: Storage Buckets
-- ============================================================
-- Execute no SQL Editor do Supabase OU configure via Dashboard:
-- Storage → New Bucket
-- ============================================================

-- Bucket para fotos dos checklists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'checklist-photos',
  'checklist-photos',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para fotos dos caminhões
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'truck-photos',
  'truck-photos',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para fotos dos motoristas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-photos',
  'driver-photos',
  false,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS Policies
-- ============================================================

-- Checklist photos — read by authenticated users
CREATE POLICY "checklist_photos_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'checklist-photos' AND
    auth.uid() IS NOT NULL
  );

-- Checklist photos — upload by operators and admins
CREATE POLICY "checklist_photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'checklist-photos' AND
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'operator')
  );

-- Truck photos
CREATE POLICY "truck_photos_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'truck-photos' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "truck_photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'truck-photos' AND
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'operator')
  );

-- Driver photos
CREATE POLICY "driver_photos_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'driver-photos' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "driver_photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'driver-photos' AND
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'operator')
  );
