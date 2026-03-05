-- ============================================================
-- Fix Visit Reports RLS & Company Isolation
-- Target Table: public.maintain_visit_reports
-- ============================================================

-- 1. Add company_id for standard RLS filtering (if missing)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maintain_visit_reports' AND column_name='company_id') THEN
        ALTER TABLE public.maintain_visit_reports ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
        
        -- Backfill company_id from engineers for existing records
        UPDATE public.maintain_visit_reports vr
        SET company_id = u.company_id
        FROM public.users u
        WHERE vr.engineer_id = u.id;
    END IF;
END $$;

-- 2. Drop legacy restrictive policies
DROP POLICY IF EXISTS "via_work_order" ON public.maintain_visit_reports;
DROP POLICY IF EXISTS "company_isolation" ON public.maintain_visit_reports;

-- 3. Create new flexible policies
-- Allows engineers to log visits for their company
-- Allows admins to log visits for their company
CREATE POLICY "company_isolation" ON public.maintain_visit_reports
    FOR ALL USING (
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.nexhaul_admins WHERE id = auth.uid())
    );

-- Specific INSERT policy to ensure engineers set their own company correctly
-- (PostgREST automatically fills company_id if we set it in the insert, but we'll harden it)
-- Note: FOR ALL already covers this, but we want to be explicit if using standard NexHaul patterns.

-- 4. Enable RLS (Ensure it's on)
ALTER TABLE public.maintain_visit_reports ENABLE ROW LEVEL SECURITY;

-- 5. Safety Checklists RLS Fix
-- They currently depend on via_visit_report which might fail if visit_reports had restrictive RLS
-- Let's add company_id to safety checklists too for consistency if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maintain_safety_checklists' AND column_name='company_id') THEN
        ALTER TABLE public.maintain_safety_checklists ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
        
        UPDATE public.maintain_safety_checklists sc
        SET company_id = vr.company_id
        FROM public.maintain_visit_reports vr
        WHERE sc.visit_report_id = vr.id;
    END IF;
END $$;

ALTER TABLE public.maintain_safety_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "via_visit_report" ON public.maintain_safety_checklists;
CREATE POLICY "company_isolation" ON public.maintain_safety_checklists
    FOR ALL USING (
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.nexhaul_admins WHERE id = auth.uid())
    );

COMMENT ON COLUMN public.maintain_visit_reports.company_id IS 'Standard isolation for multi-tenant support.';

-- Reload API
NOTIFY pgrst, 'reload schema';
