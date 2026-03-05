-- ============================================================
-- Visit Reports Enhancements (Refined)
-- Target Table: public.maintain_visit_reports
-- Target Table: public.sites
-- ============================================================

-- 1. Make work_order_id nullable to allow for ad-hoc visits
ALTER TABLE public.maintain_visit_reports 
    ALTER COLUMN work_order_id DROP NOT NULL;

-- 2. Add site_id for direct site association (critical for ad-hoc)
-- Check if column exists first to be safe, though according to user it is missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maintain_visit_reports' AND column_name='site_id') THEN
        ALTER TABLE public.maintain_visit_reports ADD COLUMN site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Add index for performance on site-based queries
CREATE INDEX IF NOT EXISTS idx_maintain_vr_site ON public.maintain_visit_reports(site_id);

-- 4. Note on Sites: 
-- User confirmed public.sites already has latitude and longitude columns.
-- We will use those for geofencing validation.

-- 5. Comments for documentation
COMMENT ON COLUMN public.maintain_visit_reports.work_order_id IS 'Now nullable to support ad-hoc routine visits.';
COMMENT ON COLUMN public.maintain_visit_reports.site_id IS 'Links visit to a site; required for ad-hoc flow.';
