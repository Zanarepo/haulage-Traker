-- ============================================================
-- SOP PERMISSIONS FIX (PUBLIC SCHEMA)
-- Description: Enables RLS and adds policies for public.maintain_asset_sops
--              to allow all administrative roles to manage SOPs.
-- ============================================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.maintain_asset_sops ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "select_public_asset_sops" ON public.maintain_asset_sops;
DROP POLICY IF EXISTS "manage_public_asset_sops" ON public.maintain_asset_sops;

-- 3. SELECT Policy: All users in the same company can view, or global SOPs
CREATE POLICY "select_public_asset_sops" ON public.maintain_asset_sops
    FOR SELECT USING (
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        OR is_global = true
    );

-- 4. MANAGE Policy: Permissive roles can Create, Update, and Delete
-- NOTE: USING clause must come BEFORE WITH CHECK for FOR ALL policies.
CREATE POLICY "manage_public_asset_sops" ON public.maintain_asset_sops
    FOR ALL 
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'md', 'manager', 'warehouse_manager', 'store_manager', 'storekeeper')
        OR EXISTS (SELECT 1 FROM public.nexhaul_admins WHERE id = auth.uid())
    )
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'md', 'manager', 'warehouse_manager', 'store_manager', 'storekeeper')
        OR EXISTS (SELECT 1 FROM public.nexhaul_admins WHERE id = auth.uid())
    );

-- 5. Reload PostgREST
NOTIFY pgrst, 'reload schema';
