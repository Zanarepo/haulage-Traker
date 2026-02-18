-- Re-sync Inventory Counts from Unit Records
-- This script fixes discrepancies where the master count doesn't match the actual unit statuses.

-- 1. Update total_in_stock based on units with 'in_stock' status
UPDATE public.maintain_inventory_master m
SET total_in_stock = (
    SELECT COUNT(*) 
    FROM public.maintain_inventory_units u 
    WHERE u.master_id = m.id AND u.status = 'in_stock'
)
WHERE EXISTS (
    SELECT 1 
    FROM public.maintain_inventory_units u 
    WHERE u.master_id = m.id
);

-- 2. Update total_issued based on units with 'issued' or 'fulfilled' status
UPDATE public.maintain_inventory_master m
SET total_issued = (
    SELECT COUNT(*) 
    FROM public.maintain_inventory_units u 
    WHERE u.master_id = m.id AND u.status IN ('issued', 'fulfilled')
)
WHERE EXISTS (
    SELECT 1 
    FROM public.maintain_inventory_units u 
    WHERE u.master_id = m.id
);

-- 3. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
