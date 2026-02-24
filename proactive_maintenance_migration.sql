-- PROACTIVE MAINTENANCE & HYBRID LOGIC MIGRATION
-- Run this in your Supabase SQL Editor

-- 1. Extend Sites for Hybrid Logic
ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS is_hybrid BOOLEAN DEFAULT false;

ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS solar_offset_hours DECIMAL(4,2) DEFAULT 0;

COMMENT ON COLUMN public.sites.is_hybrid IS 'Flag for sites using solar/inverter hybrid power systems';
COMMENT ON COLUMN public.sites.solar_offset_hours IS 'Estimated hours per day cushion provided by solar energy';

-- 2. Extend Asset Registry for PM Intervals
ALTER TABLE public.maintain_assets
ADD COLUMN IF NOT EXISTS pm_interval_hours INTEGER DEFAULT 250;

ALTER TABLE public.maintain_assets
ADD COLUMN IF NOT EXISTS last_pm_hours INTEGER DEFAULT 0;

ALTER TABLE public.maintain_assets
ADD COLUMN IF NOT EXISTS last_pm_date TIMESTAMPTZ;

COMMENT ON COLUMN public.maintain_assets.pm_interval_hours IS 'Configurable maintenance interval (typically 250h for gensets)';

-- 3. Extend Work Orders for Failure Analysis
ALTER TABLE public.maintain_work_orders
ADD COLUMN IF NOT EXISTS fault_category TEXT;

ALTER TABLE public.maintain_work_orders
ADD COLUMN IF NOT EXISTS root_cause TEXT;

ALTER TABLE public.maintain_work_orders
ADD COLUMN IF NOT EXISTS parts_replaced JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.maintain_work_orders
ADD COLUMN IF NOT EXISTS hour_meter DECIMAL(12,2);

COMMENT ON COLUMN public.maintain_work_orders.hour_meter IS 'The hour meter reading recorded at the time of work order completion';

-- 4. Extend Diesel Readings for Hour Meters
ALTER TABLE public.maintain_diesel_readings
ADD COLUMN IF NOT EXISTS hour_meter DECIMAL(12,2);

COMMENT ON COLUMN public.maintain_diesel_readings.hour_meter IS 'The generator/asset hour meter reading recorded during the site visit';

-- Root cause categories (Enforcement can be done via app or enum)
-- Mechanical, Electrical, Fuel Quality, External Factor, Operator Error, Routine Service
