-- ============================================================
-- ADD CLUSTER_ID TO RECEIVING BATCHES
-- ============================================================

-- 1. Add cluster_id to maintain_receiving_batches
ALTER TABLE public.maintain_receiving_batches 
ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES public.clusters(id);

-- 2. Update RLS for maintain_receiving_batches
-- Allow Admins to manage batches if they are in the same cluster
DROP POLICY IF EXISTS "admin_cluster_isolation" ON public.maintain_receiving_batches;
CREATE POLICY "admin_cluster_isolation" ON public.maintain_receiving_batches
FOR ALL USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    AND (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'warehouse_manager', 'storekeeper')
        OR 
        cluster_id IN (SELECT cluster_id FROM public.user_cluster_assignments WHERE user_id = auth.uid())
        OR
        cluster_id IS NULL -- Global batches visible to all admins if needed, but non-superadmins can't manage?
    )
);

-- 3. Update RLS for items to follow batch access
DROP POLICY IF EXISTS "admin_cluster_item_isolation" ON public.maintain_receiving_batch_items;
CREATE POLICY "admin_cluster_item_isolation" ON public.maintain_receiving_batch_items
FOR ALL USING (
    batch_id IN (
        SELECT id FROM public.maintain_receiving_batches 
        WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        AND (
            (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'warehouse_manager', 'storekeeper')
            OR 
            cluster_id IN (SELECT cluster_id FROM public.user_cluster_assignments WHERE user_id = auth.uid())
            OR
            cluster_id IS NULL
        )
    )
);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
