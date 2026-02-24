-- FIX: Add master_id to inventory logs and ledger
-- FIX: Update RLS policies to allow admins/md/storekeepers

-- 1. Add master_id column
ALTER TABLE public.maintain_inventory_logs 
ADD COLUMN IF NOT EXISTS master_id UUID REFERENCES public.maintain_inventory_master(id);

ALTER TABLE public.maintain_inventory_ledger 
ADD COLUMN IF NOT EXISTS master_id UUID REFERENCES public.maintain_inventory_master(id);

-- 2. Broaden RLS Policies for Inventory Logs
DROP POLICY IF EXISTS "insert_inventory" ON public.maintain_inventory_logs;
CREATE POLICY "insert_inventory" ON public.maintain_inventory_logs 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'md', 'accountant')) OR
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'site_engineer') AND
     EXISTS (SELECT 1 FROM public.maintain_work_orders wo WHERE wo.id = work_order_id AND wo.status != 'completed'))
);

DROP POLICY IF EXISTS "delete_inventory_admin" ON public.maintain_inventory_logs;
CREATE POLICY "delete_inventory_admin" ON public.maintain_inventory_logs 
FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'md'))
);

-- 3. Broaden RLS Policies for Ledger (to allow usage logs)
DROP POLICY IF EXISTS "Admins view all ledger entries" ON public.maintain_inventory_ledger;
CREATE POLICY "Admins view all ledger entries" ON public.maintain_inventory_ledger
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'md', 'accountant'))
);

DROP POLICY IF EXISTS "Storekeepers & Engineers insert ledger" ON public.maintain_inventory_ledger;
CREATE POLICY "Storekeepers & Engineers insert ledger" ON public.maintain_inventory_ledger
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'md', 'storekeeper', 'site_engineer'))
);

-- 4. Reload API cache
NOTIFY pgrst, 'reload schema';
