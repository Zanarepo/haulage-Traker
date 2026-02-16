-- ============================================================
-- NexHaul Maintain — Asset Lifecycle Enhancements
-- ============================================================

-- Add lifecycle columns to maintain_assets
ALTER TABLE public.maintain_assets 
ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
ADD COLUMN IF NOT EXISTS installation_date DATE,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS warranty_expiry_date DATE;

-- Update the health view to ensure it can see new fields
-- We DROP first because CREATE OR REPLACE cannot change column names/order
DROP VIEW IF EXISTS public.maintain_v_asset_health;

CREATE OR REPLACE VIEW public.maintain_v_asset_health AS
SELECT 
    a.*,
    (a.last_service_hour_meter + a.service_interval_hrs) - a.hour_meter AS hrs_until_service,
    a.last_service_date + (a.service_interval_days || ' days')::INTERVAL AS next_service_date,
    CASE 
        WHEN a.hour_meter >= (a.last_service_hour_meter + a.service_interval_hrs) THEN true
        WHEN a.last_service_date + (a.service_interval_days || ' days')::INTERVAL < now() THEN true
        ELSE false
    END AS is_overdue,
    s.name AS site_name, s.site_id_code
FROM public.maintain_assets a
JOIN public.sites s ON s.id = a.site_id;

-- Reload API
NOTIFY pgrst, 'reload schema';

-- 4. SECURITY (RLS)
-- Views in Supabase/PostgreSQL inherit permissions, but can also be secured
-- explicitly if they are tracked by PostgREST or for better isolation.
ALTER VIEW public.maintain_v_asset_health SET (security_invoker = on);

-- Note: No separate POLICY is needed on the view itself if 'security_invoker' is ON,
-- as it will respect the RLS policies already defined on the underlying 'maintain_assets' table.
