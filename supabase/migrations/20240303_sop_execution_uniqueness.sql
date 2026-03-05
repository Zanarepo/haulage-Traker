-- Migration: Enforce Uniqueness on SOP Execution Logs
-- Description: Adds a unique constraint to ensure only one SOP execution log exists per Work Order + SOP pair.
--              Includes a cleanup step to remove older duplicates.

-- 1. Cleanup: Keep only the latest record for each (work_order_id, sop_id) pair
DELETE FROM public.maintain_sop_execution_logs a
USING public.maintain_sop_execution_logs b
WHERE a.id < b.id
  AND a.work_order_id = b.work_order_id
  AND a.sop_id = b.sop_id;

-- 2. Add Unique Constraint
-- We only enforce this for work_order_id because logs might exist without a work order (general execution)
-- but for specific work orders, we definitely want only one.
ALTER TABLE public.maintain_sop_execution_logs
DROP CONSTRAINT IF EXISTS unique_sop_execution_per_work_order;

ALTER TABLE public.maintain_sop_execution_logs
ADD CONSTRAINT unique_sop_execution_per_work_order 
UNIQUE (work_order_id, sop_id);

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
