-- ============================================================
-- NexHaul Maintain — Fix Asset Deletion Cascades
-- ============================================================

-- 1. Fix dispensing_logs: Allow asset deletion while preserving historical logs
-- First, identify and drop the existing constraint. 
-- The error message indicated it is "dispensing_logs_confirmed_asset_id_fkey"
ALTER TABLE public.dispensing_logs 
DROP CONSTRAINT IF EXISTS dispensing_logs_confirmed_asset_id_fkey;

ALTER TABLE public.dispensing_logs
ADD CONSTRAINT dispensing_logs_confirmed_asset_id_fkey 
FOREIGN KEY (confirmed_asset_id) 
REFERENCES public.maintain_assets(id) 
ON DELETE SET NULL;

-- 2. Audit check: maintain_work_orders already has ON DELETE SET NULL on asset_id?
-- From maintain_schema.sql: asset_id UUID REFERENCES maintain.assets(id) ON DELETE SET NULL
-- (Verified in previous steps)

-- 3. Audit check: maintain_diesel_readings already has ON DELETE SET NULL on asset_id?
-- From add_maintenance_media_and_diesel.sql: asset_id UUID REFERENCES public.maintain_assets(id) ON DELETE SET NULL
-- (Verified in previous steps)

-- Reload API
NOTIFY pgrst, 'reload schema';
