-- ============================================================
-- Harden Maintain Roles & RLS
-- Description: Standardizes administrative access across Maintain tables
--              to include all permissive roles found in the system.
-- ============================================================

-- 1. Correct SOP Management Roles
DROP POLICY IF EXISTS "manage_asset_sops" ON maintain.asset_sops;
CREATE POLICY "manage_asset_sops" ON maintain.asset_sops
    FOR ALL 
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'md', 'manager', 'warehouse_manager', 'store_manager', 'storekeeper')
        OR EXISTS (SELECT 1 FROM public.nexhaul_admins WHERE id = auth.uid())
    )
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'md', 'manager', 'warehouse_manager', 'store_manager', 'storekeeper')
        OR EXISTS (SELECT 1 FROM public.nexhaul_admins WHERE id = auth.uid())
    );

-- 2. Correct Execution Log Roles
DROP POLICY IF EXISTS "Authorized users can insert logs" ON public.maintain_sop_execution_logs;
CREATE POLICY "Authorized users can insert logs"
    ON public.maintain_sop_execution_logs for insert
    with check (
        company_id in (select company_id from users where id = auth.uid())
        AND (
            (select role from users where id = auth.uid()) IN ('superadmin', 'admin', 'md', 'manager', 'warehouse_manager', 'store_manager', 'storekeeper', 'site_engineer')
            OR EXISTS (select 1 from nexhaul_admins where id = auth.uid())
        )
    );

-- 3. Update existing Maintain table policies for consistency
DROP POLICY IF EXISTS "company_isolation" ON maintain.assets;
CREATE POLICY "company_isolation" ON maintain.assets
    FOR ALL USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "company_isolation" ON maintain.work_orders;
CREATE POLICY "company_isolation" ON maintain.work_orders
    FOR ALL USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
