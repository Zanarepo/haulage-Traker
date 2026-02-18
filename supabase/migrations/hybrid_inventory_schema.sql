-- ============================================================
-- Hybrid Inventory System: Stock Wallet & Transaction Ledger
-- ============================================================

-- 1. ENGINEER STOCK WALLET
-- Tracks current balance of parts/supplies held by each engineer.
CREATE TABLE IF NOT EXISTS public.maintain_engineer_stock (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engineer_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    item_name       TEXT NOT NULL,
    item_category   TEXT,
    balance         NUMERIC NOT NULL DEFAULT 0,
    unit            TEXT DEFAULT 'pcs',
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(engineer_id, item_name)
);

-- 2. INVENTORY TRANSACTION LEDGER
-- Detailed log of all stock movements.
CREATE TABLE IF NOT EXISTS public.maintain_inventory_ledger (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engineer_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    work_order_id   UUID REFERENCES public.maintain_work_orders(id) ON DELETE SET NULL,
    item_name       TEXT NOT NULL,
    quantity        NUMERIC NOT NULL, -- Positive for restock, negative for usage/loss
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('restock', 'usage', 'return', 'adjustment')),
    notes           TEXT,
    recorded_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. AUTOMATION: UPDATE BALANCE TRIGGER
-- Automatically updates the engineer's wallet when a ledger entry is made.
CREATE OR REPLACE FUNCTION public.update_engineer_stock_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.maintain_engineer_stock (engineer_id, company_id, item_name, balance, updated_at)
    VALUES (NEW.engineer_id, NEW.company_id, NEW.item_name, NEW.quantity, now())
    ON CONFLICT (engineer_id, item_name)
    DO UPDATE SET 
        balance = public.maintain_engineer_stock.balance + EXCLUDED.balance,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists before creating to avoid errors
DROP TRIGGER IF EXISTS trg_after_ledger_insert ON public.maintain_inventory_ledger;
CREATE TRIGGER trg_after_ledger_insert
AFTER INSERT ON public.maintain_inventory_ledger
FOR EACH ROW EXECUTE FUNCTION public.update_engineer_stock_balance();

-- 4. SETUP SECURITY (RLS)
ALTER TABLE public.maintain_engineer_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintain_inventory_ledger ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES: Stock Wallet
DROP POLICY IF EXISTS "Engineers view own stock" ON public.maintain_engineer_stock;
CREATE POLICY "Engineers view own stock" ON public.maintain_engineer_stock
FOR SELECT USING (engineer_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage engineer stock" ON public.maintain_engineer_stock;
DROP POLICY IF EXISTS "Admins view all engineer stock" ON public.maintain_engineer_stock;
CREATE POLICY "Admins manage engineer stock" ON public.maintain_engineer_stock
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'accountant'))
);

-- 6. POLICIES: Ledger
DROP POLICY IF EXISTS "Engineers view own ledger" ON public.maintain_inventory_ledger;
CREATE POLICY "Engineers view own ledger" ON public.maintain_inventory_ledger
FOR SELECT USING (engineer_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all ledger entries" ON public.maintain_inventory_ledger;
CREATE POLICY "Admins view all ledger entries" ON public.maintain_inventory_ledger
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'accountant'))
);

DROP POLICY IF EXISTS "Storekeepers & Engineers insert ledger" ON public.maintain_inventory_ledger;
CREATE POLICY "Storekeepers & Engineers insert ledger" ON public.maintain_inventory_ledger
FOR INSERT WITH CHECK (true);

-- 7. REFRESH API
NOTIFY pgrst, 'reload schema';
