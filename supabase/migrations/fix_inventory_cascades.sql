-- ============================================================
-- FIX: ADD ON DELETE CASCADE TO INVENTORY DEPENDENCIES
-- ============================================================

-- 1. Fix maintain_receiving_batch_items (Reported Error)
ALTER TABLE public.maintain_receiving_batch_items
DROP CONSTRAINT IF EXISTS maintain_receiving_batch_items_master_id_fkey,
ADD CONSTRAINT maintain_receiving_batch_items_master_id_fkey 
    FOREIGN KEY (master_id) 
    REFERENCES public.maintain_inventory_master(id) 
    ON DELETE CASCADE;

-- 2. Fix maintain_inventory_logs
ALTER TABLE public.maintain_inventory_logs
DROP CONSTRAINT IF EXISTS maintain_inventory_logs_master_id_fkey,
ADD CONSTRAINT maintain_inventory_logs_master_id_fkey 
    FOREIGN KEY (master_id) 
    REFERENCES public.maintain_inventory_master(id) 
    ON DELETE CASCADE;

-- 3. Fix maintain_inventory_ledger
ALTER TABLE public.maintain_inventory_ledger
DROP CONSTRAINT IF EXISTS maintain_inventory_ledger_master_id_fkey,
ADD CONSTRAINT maintain_inventory_ledger_master_id_fkey 
    FOREIGN KEY (master_id) 
    REFERENCES public.maintain_inventory_master(id) 
    ON DELETE CASCADE;

-- 4. Fix maintain_inventory_units (Verify cascade exists, though it was in schema)
-- It already has CASCADE in inventory_management_schema.sql (Line 33), 
-- but doesn't hurt to ensure it's named and proper.
-- ALTER TABLE public.maintain_inventory_units ... (Already OK)

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
