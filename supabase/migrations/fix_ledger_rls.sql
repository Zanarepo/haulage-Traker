-- Fix RLS Policies for Maintain Inventory Ledger
-- Allows Superadmins and Admins to Update and Delete entries

DROP POLICY IF EXISTS "Admins manage ledger entries" ON public.maintain_inventory_ledger;
CREATE POLICY "Admins manage ledger entries" ON public.maintain_inventory_ledger
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
);

-- Ensure Engineers can still only view and insert
DROP POLICY IF EXISTS "Engineers view own ledger" ON public.maintain_inventory_ledger;
CREATE POLICY "Engineers view own ledger" ON public.maintain_inventory_ledger
FOR SELECT USING (engineer_id = auth.uid());

DROP POLICY IF EXISTS "Storekeepers & Engineers insert ledger" ON public.maintain_inventory_ledger;
CREATE POLICY "Storekeepers & Engineers insert ledger" ON public.maintain_inventory_ledger
FOR INSERT WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
