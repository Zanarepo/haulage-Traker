-- Add missing columns to Maintain Inventory Ledger for UI consistency
ALTER TABLE public.maintain_inventory_ledger 
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS item_category TEXT DEFAULT 'Parts';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
