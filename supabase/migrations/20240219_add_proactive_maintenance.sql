-- Add Proactive Maintenance & Hybrid Logic Fields

-- 1. Extend public.sites for Hybrid logic
ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS is_hybrid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS solar_offset_hours NUMERIC DEFAULT 0;

-- 2. Extend maintain.assets for PM tracking
ALTER TABLE maintain.assets
ADD COLUMN IF NOT EXISTS pm_interval_hours NUMERIC DEFAULT 250,
ADD COLUMN IF NOT EXISTS last_pm_hours NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_pm_date TIMESTAMPTZ;

-- 3. Extend maintain.work_orders for Failure Analysis
ALTER TABLE maintain.work_orders
ADD COLUMN IF NOT EXISTS fault_category TEXT,
ADD COLUMN IF NOT EXISTS root_cause TEXT;

-- 4. Update the v_asset_health view to be smarter
CREATE OR REPLACE VIEW maintain.v_asset_health AS
SELECT 
    a.id,
    a.site_id,
    a.company_id,
    a.type,
    a.make_model,
    a.serial_number,
    a.hour_meter,
    a.pm_interval_hours,
    a.last_pm_hours,
    a.last_pm_date,
    a.status,
    s.is_hybrid,
    s.solar_offset_hours,
    
    -- Hours since last service
    (a.hour_meter - a.last_pm_hours) AS hours_since_service,
    
    -- Hours until next service
    (a.last_pm_hours + a.pm_interval_hours) - a.hour_meter AS hrs_until_service,
    
    -- Status calculation
    CASE 
        WHEN a.hour_meter >= (a.last_pm_hours + a.pm_interval_hours) THEN 'overdue'
        WHEN (a.last_pm_hours + a.pm_interval_hours) - a.hour_meter <= (a.pm_interval_hours * 0.1) THEN 'due_soon'
        ELSE 'healthy'
    END AS health_status,
    
    -- Site info
    s.name AS site_name,
    s.site_id_code
FROM maintain.assets a
JOIN public.sites s ON s.id = a.site_id;
