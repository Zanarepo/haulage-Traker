-- ============================================================
-- FIX DIESEL READINGS RLS POLICIES
-- ============================================================

-- The previous policy required a work_order_id for site_engineers.
-- Refills and periodic readings often don't have work orders.

DROP POLICY IF EXISTS "insert_readings" ON public.maintain_diesel_readings;

CREATE POLICY "insert_readings" ON public.maintain_diesel_readings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin') OR
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'site_engineer') AND
     (
         -- Either linked to an active work order
         (work_order_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.maintain_work_orders wo WHERE wo.id = work_order_id AND wo.status != 'completed'))
         OR
         -- OR it is a refill/periodic reading not tied to a specific ticket
         (work_order_id IS NULL)
     )
    )
);

-- RELOAD API
NOTIFY pgrst, 'reload schema';
