-- ============================================================
-- CLEANUP MAINTENANCE MODULE
-- Wipes everything related to the 'maintain' module
-- ============================================================

-- 1. Drop the separate 'maintain' schema
DROP SCHEMA IF EXISTS maintain CASCADE;

-- 2. Drop the tables in the 'public' schema
DROP TABLE IF EXISTS public.maintain_assets CASCADE;
DROP TABLE IF EXISTS public.maintain_work_orders CASCADE;
DROP TABLE IF EXISTS public.maintain_visit_reports CASCADE;
DROP TABLE IF EXISTS public.maintain_safety_checklists CASCADE;
DROP TABLE IF EXISTS public.maintain_supply_allocations CASCADE;
DROP TABLE IF EXISTS public.maintain_maintenance_tasks CASCADE;
DROP TABLE IF EXISTS public.maintain_generated_reports CASCADE;
DROP TABLE IF EXISTS public.maintain_asset_sops CASCADE;

-- 3. Drop the view
DROP VIEW IF EXISTS public.maintain_v_asset_health CASCADE;

-- 4. Reload API cache
NOTIFY pgrst, 'reload schema';
