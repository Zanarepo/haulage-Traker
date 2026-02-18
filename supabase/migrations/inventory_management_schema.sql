-- ============================================================
-- CentralIZED INVENTORY & RECEIVING SYSTEM (PUBLIC SCHEMA)
-- ============================================================

-- 1. MASTER INVENTORY CATALOG
-- Tracks products available in the warehouse and their global stats.
CREATE TABLE IF NOT EXISTS public.maintain_inventory_master (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    product_name    TEXT NOT NULL,
    part_no         TEXT,
    item_category   TEXT DEFAULT 'Parts',
    unit            TEXT DEFAULT 'pcs',
    
    -- Financials (Averages or latest)
    last_purchase_price NUMERIC DEFAULT 0,
    manufacturer    TEXT,
    
    -- Stock Aggregates
    total_in_stock  NUMERIC DEFAULT 0,
    total_issued    NUMERIC DEFAULT 0,
    
    updated_at      TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, product_name, part_no)
);

-- 2. SERIALIZED / UNIQUE UNITS
-- Tracks individual items by barcode/serial.
CREATE TABLE IF NOT EXISTS public.maintain_inventory_units (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id       UUID NOT NULL REFERENCES public.maintain_inventory_master(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    barcode         TEXT NOT NULL, -- The unique scanner ID
    status          TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'issued', 'consumed', 'lost', 'returned')),
    
    -- Traceability
    current_holder_id UUID REFERENCES public.users(id), -- If issued to engineer
    current_site_id   UUID REFERENCES public.sites(id),  -- If deployed to site
    
    received_at     TIMESTAMPTZ DEFAULT now(),
    issued_at       TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, barcode)
);

-- 3. RECEIVING BATCHES
-- Records of inflows from suppliers.
CREATE TABLE IF NOT EXISTS public.maintain_receiving_batches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    supplier_name   TEXT,
    reference_no    TEXT, -- Invoice or PO number
    received_by     UUID REFERENCES public.users(id),
    
    total_items     INTEGER DEFAULT 0,
    total_value     NUMERIC DEFAULT 0,
    
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. BATCH ITEMS (Junction for receiving)
CREATE TABLE IF NOT EXISTS public.maintain_receiving_batch_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id        UUID NOT NULL REFERENCES public.maintain_receiving_batches(id) ON DELETE CASCADE,
    master_id       UUID NOT NULL REFERENCES public.maintain_inventory_master(id),
    
    quantity        NUMERIC NOT NULL,
    purchase_price  NUMERIC,
    
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. FUNCTION: UPDATE MASTER AGGREGATES
-- Updates total_in_stock when units are added or non-serialized qty is received.
CREATE OR REPLACE FUNCTION public.update_maintain_inventory_master_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- If a new unit is added to maintain_inventory_units
    IF (TG_TABLE_NAME = 'maintain_inventory_units') THEN
        IF (TG_OP = 'INSERT') THEN
            UPDATE public.maintain_inventory_master 
            SET total_in_stock = total_in_stock + 1 
            WHERE id = NEW.master_id;
        ELSIF (TG_OP = 'UPDATE') THEN
            -- Handle status changes (e.g., in_stock -> issued)
            IF (OLD.status = 'in_stock' AND NEW.status = 'issued') THEN
                UPDATE public.maintain_inventory_master 
                SET total_in_stock = total_in_stock - 1,
                    total_issued = total_issued + 1
                WHERE id = NEW.master_id;
            ELSIF (OLD.status = 'issued' AND NEW.status = 'in_stock') THEN
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

-- 6. TRIGGERS
DROP TRIGGER IF EXISTS trg_units_stats_update ON public.maintain_inventory_units;
CREATE TRIGGER trg_units_stats_update
AFTER INSERT OR UPDATE ON public.maintain_inventory_units
FOR EACH ROW EXECUTE FUNCTION public.update_maintain_inventory_master_stats();

-- 7. SECURITY (RLS)
ALTER TABLE public.maintain_inventory_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintain_inventory_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintain_receiving_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintain_receiving_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation" ON public.maintain_inventory_master FOR ALL USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "company_isolation" ON public.maintain_inventory_units FOR ALL USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "company_isolation" ON public.maintain_receiving_batches FOR ALL USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "company_isolation" ON public.maintain_receiving_batch_items FOR ALL USING (
    batch_id IN (SELECT id FROM public.maintain_receiving_batches WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
