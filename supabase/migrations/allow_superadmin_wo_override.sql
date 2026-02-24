-- ============================================================
-- NexHaul Maintain — Superadmin Override for Immutability
-- ============================================================

-- Update the completion check function to allow Superadmins to bypass restrictions
CREATE OR REPLACE FUNCTION public.check_work_order_completion() 
RETURNS TRIGGER AS $$
DECLARE
    is_sa BOOLEAN;
BEGIN
    -- 1. Check if the current user is a superadmin
    SELECT (role = 'superadmin') INTO is_sa 
    FROM public.users 
    WHERE id = auth.uid();

    -- 2. If it's a superadmin, bypass the check and allow the operation
    IF is_sa IS TRUE THEN
        IF (TG_OP = 'DELETE') THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    -- 3. For all other users, enforce immutability on completed work orders
    IF OLD.status = 'completed' THEN
        RAISE EXCEPTION 'Completed work orders cannot be modified or deleted.';
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger is already attached, but we re-apply for certainty
DROP TRIGGER IF EXISTS trg_prevent_completed_wo_edit ON public.maintain_work_orders;
CREATE TRIGGER trg_prevent_completed_wo_edit
BEFORE UPDATE OR DELETE ON public.maintain_work_orders
FOR EACH ROW EXECUTE FUNCTION public.check_work_order_completion();

-- Reload PostgREST
NOTIFY pgrst, 'reload schema';
