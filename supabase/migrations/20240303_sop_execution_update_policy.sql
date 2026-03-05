-- Migration: Add UPDATE policy for SOP Execution Logs
-- Description: Allows engineers and admins to update existing SOP execution logs within the 2-hour window.

-- 1. DROP existing update policy if any (though we suspect it's missing)
DROP POLICY IF EXISTS "Authorized users can update logs" ON public.maintain_sop_execution_logs;

-- 2. CREATE UPDATE Policy
-- Users can update if:
-- 1. They belong to the same company
-- 2. They have the appropriate role
-- 3. The log is NOT locked (now < locked_at)
CREATE POLICY "Authorized users can update logs"
    ON public.maintain_sop_execution_logs
    FOR UPDATE
    USING (
        company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
        AND (
            (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'md', 'manager', 'warehouse_manager', 'store_manager', 'storekeeper', 'site_engineer')
            OR EXISTS (SELECT 1 FROM public.nexhaul_admins WHERE id = auth.uid())
        )
        AND now() < locked_at
    )
    WITH CHECK (
        company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
        AND (
            (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'md', 'manager', 'warehouse_manager', 'store_manager', 'storekeeper', 'site_engineer')
            OR EXISTS (SELECT 1 FROM public.nexhaul_admins WHERE id = auth.uid())
        )
    );

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
