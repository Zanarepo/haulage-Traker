-- Add SKU/Metadata column to inventory units and batch items
ALTER TABLE public.maintain_inventory_units 
ADD COLUMN IF NOT EXISTS sku TEXT;

ALTER TABLE public.maintain_receiving_batch_items 
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Update RLS to ensure visibility (if needed, but columns inherited usually)
-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
