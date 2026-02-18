-- 1. Expand User Roles Enum (Run this if it hasn't been done)
-- Note: adding these roles to the existing enum to avoid "invalid input value" errors.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'warehouse_manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'store_manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'storekeeper';

-- 2. Trigger Function for Stock Request Notifications
CREATE OR REPLACE FUNCTION public.handle_stock_request_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
    engineer_full_name TEXT;
BEGIN
    -- 1. On INSERT: Notify Admins / Warehouse Managers
    IF (TG_OP = 'INSERT') THEN
        SELECT full_name INTO engineer_full_name FROM public.users WHERE id = NEW.engineer_id;

        FOR admin_record IN 
            SELECT id FROM public.users 
            WHERE company_id = NEW.company_id 
            AND role IN ('admin', 'superadmin', 'warehouse_manager', 'store_manager', 'storekeeper')
            AND is_active = true
        LOOP
            INSERT INTO public.notifications (
                company_id, 
                user_id, 
                type, 
                module, 
                title, 
                message, 
                link
            ) VALUES (
                NEW.company_id,
                admin_record.id,
                'request',
                'maintain',
                'New Stock Request',
                COALESCE(engineer_full_name, 'A cluster') || ' has submitted a new stock request.',
                '/dashboard/maintain/supplies?tab=requests'
            );
        END LOOP;
    
    -- 2. On UPDATE (status change): Notify the requesting Engineer
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            INSERT INTO public.notifications (
                company_id, 
                user_id, 
                type, 
                module, 
                title, 
                message, 
                link
            ) VALUES (
                NEW.company_id,
                NEW.engineer_id,
                NEW.status,
                'maintain',
                'Stock Request ' || INITCAP(NEW.status),
                'Your stock request has been ' || NEW.status || COALESCE(': ' || NEW.admin_notes, '.'),
                '/dashboard/maintain/supplies?tab=requests'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind the Trigger
DROP TRIGGER IF EXISTS on_stock_request_change ON public.maintain_stock_requests;
CREATE TRIGGER on_stock_request_change
    AFTER INSERT OR UPDATE ON public.maintain_stock_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_stock_request_notification();
