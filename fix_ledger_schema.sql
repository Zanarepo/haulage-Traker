-- Comprehensive Fix for Inventory Tracking & Fulfillment
-- 1. Add master_id column to Ledger
ALTER TABLE public.maintain_inventory_ledger 
ADD COLUMN IF NOT EXISTS master_id UUID REFERENCES public.maintain_inventory_master(id) ON DELETE SET NULL;

-- 2. Add master_id to Engineer Stock
ALTER TABLE public.maintain_engineer_stock
ADD COLUMN IF NOT EXISTS master_id UUID REFERENCES public.maintain_inventory_master(id) ON DELETE SET NULL;

-- 3. Update Status Constraint for Serialized Units to allow 'fulfilled'
ALTER TABLE public.maintain_inventory_units DROP CONSTRAINT IF EXISTS maintain_inventory_units_status_check;
ALTER TABLE public.maintain_inventory_units ADD CONSTRAINT maintain_inventory_units_status_check 
CHECK (status IN ('in_stock', 'issued', 'consumed', 'lost', 'returned', 'fulfilled'));

-- 4. Update stats trigger to handle 'fulfilled' status
CREATE OR REPLACE FUNCTION public.update_maintain_inventory_master_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_TABLE_NAME = 'maintain_inventory_units') THEN
        IF (TG_OP = 'INSERT') THEN
            UPDATE public.maintain_inventory_master 
            SET total_in_stock = total_in_stock + 1 
            WHERE id = NEW.master_id;
        ELSIF (TG_OP = 'UPDATE') THEN
            -- Handle moving from warehouse to engineer/fulfillment
            IF (OLD.status = 'in_stock' AND NEW.status IN ('issued', 'fulfilled')) THEN
                UPDATE public.maintain_inventory_master 
                SET total_in_stock = total_in_stock - 1,
                    total_issued = total_issued + 1
                WHERE id = NEW.master_id;
            -- Handle returns
            ELSIF (OLD.status IN ('issued', 'fulfilled') AND NEW.status = 'in_stock') THEN
                UPDATE public.maintain_inventory_master 
                SET total_in_stock = total_in_stock + 1,
                    total_issued = total_issued - 1
                WHERE id = NEW.master_id;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Update engineer stock trigger to link master_id
CREATE OR REPLACE FUNCTION public.update_engineer_stock_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.maintain_engineer_stock (engineer_id, company_id, item_name, master_id, balance, updated_at)
    VALUES (NEW.engineer_id, NEW.company_id, NEW.item_name, NEW.master_id, NEW.quantity, now())
    ON CONFLICT (engineer_id, item_name)
    DO UPDATE SET 
        balance = public.maintain_engineer_stock.balance + EXCLUDED.balance,
        master_id = COALESCE(public.maintain_engineer_stock.master_id, EXCLUDED.master_id),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
