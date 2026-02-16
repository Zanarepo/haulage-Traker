-- ============================================================
-- NexHaul Maintain — Media, Diesel & Inventory Tracking
-- ============================================================

-- 1. WORK ORDER MEDIA
-- Stores multiple images for work orders with headers
CREATE TABLE IF NOT EXISTS public.maintain_workorder_media (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES public.maintain_work_orders(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('before', 'after', 'other')),
    file_url        TEXT NOT NULL,
    header          TEXT,
    uploaded_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. DIESEL READINGS (Historical Record)
-- Stores diesel levels for sites, linked to work orders
CREATE TABLE IF NOT EXISTS public.maintain_diesel_readings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    work_order_id   UUID REFERENCES public.maintain_work_orders(id) ON DELETE SET NULL,
    asset_id        UUID REFERENCES public.maintain_assets(id) ON DELETE SET NULL,
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    level           NUMERIC NOT NULL,
    hour_meter      NUMERIC, -- Added for service planning
    reading_type    TEXT NOT NULL CHECK (reading_type IN ('before', 'after', 'refill', 'periodic')),
    recorded_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    recorded_at     TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. INVENTORY LOGS
-- Tracks items used during maintenance
CREATE TABLE IF NOT EXISTS public.maintain_inventory_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES public.maintain_work_orders(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    item_name       TEXT NOT NULL,
    quantity        NUMERIC NOT NULL DEFAULT 1,
    notes           TEXT,
    recorded_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. SETUP SECURITY (RLS)
ALTER TABLE public.maintain_workorder_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintain_diesel_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintain_inventory_logs ENABLE ROW LEVEL SECURITY;

-- 5. GLOBAL IMMUTABILITY TRIGGER
-- Prevents edits/deletions on COMPLETED work orders for EVERYONE
CREATE OR REPLACE FUNCTION public.check_work_order_completion() 
RETURNS TRIGGER AS $$
BEGIN
    -- Check status of the OLD record
    IF OLD.status = 'completed' THEN
        RAISE EXCEPTION 'Completed work orders cannot be modified or deleted.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_completed_wo_edit ON public.maintain_work_orders;
CREATE TRIGGER trg_prevent_completed_wo_edit
BEFORE UPDATE OR DELETE ON public.maintain_work_orders
FOR EACH ROW EXECUTE FUNCTION public.check_work_order_completion();

-- 6. POLICIES: Work Order Media
DROP POLICY IF EXISTS "view_media" ON public.maintain_workorder_media;
DROP POLICY IF EXISTS "insert_media" ON public.maintain_workorder_media;
DROP POLICY IF EXISTS "delete_media_admin" ON public.maintain_workorder_media;
DROP POLICY IF EXISTS "delete_media_engineer" ON public.maintain_workorder_media;

CREATE POLICY "view_media" ON public.maintain_workorder_media FOR SELECT USING (true);

CREATE POLICY "insert_media" ON public.maintain_workorder_media FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin') OR
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'site_engineer') AND
     EXISTS (SELECT 1 FROM public.maintain_work_orders wo WHERE wo.id = work_order_id AND wo.status != 'completed'))
);

CREATE POLICY "delete_media_admin" ON public.maintain_workorder_media FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
);

CREATE POLICY "delete_media_engineer" ON public.maintain_workorder_media FOR DELETE USING (
    uploaded_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.maintain_work_orders wo WHERE wo.id = work_order_id AND wo.status != 'completed')
);

-- 7. POLICIES: Diesel Readings
DROP POLICY IF EXISTS "view_readings" ON public.maintain_diesel_readings;
DROP POLICY IF EXISTS "insert_readings" ON public.maintain_diesel_readings;
DROP POLICY IF EXISTS "delete_readings_admin" ON public.maintain_diesel_readings;
DROP POLICY IF EXISTS "delete_readings_engineer" ON public.maintain_diesel_readings;

CREATE POLICY "view_readings" ON public.maintain_diesel_readings FOR SELECT USING (true);

CREATE POLICY "insert_readings" ON public.maintain_diesel_readings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin') OR
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'site_engineer') AND
     EXISTS (SELECT 1 FROM public.maintain_work_orders wo WHERE wo.id = work_order_id AND wo.status != 'completed'))
);

CREATE POLICY "delete_readings_admin" ON public.maintain_diesel_readings FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
);

CREATE POLICY "delete_readings_engineer" ON public.maintain_diesel_readings FOR DELETE USING (
    recorded_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.maintain_work_orders wo WHERE wo.id = work_order_id AND wo.status != 'completed')
);

-- 8. POLICIES: Inventory Logs
DROP POLICY IF EXISTS "view_inventory" ON public.maintain_inventory_logs;
DROP POLICY IF EXISTS "insert_inventory" ON public.maintain_inventory_logs;
DROP POLICY IF EXISTS "delete_inventory_admin" ON public.maintain_inventory_logs;
DROP POLICY IF EXISTS "delete_inventory_engineer" ON public.maintain_inventory_logs;

CREATE POLICY "view_inventory" ON public.maintain_inventory_logs FOR SELECT USING (true);

CREATE POLICY "insert_inventory" ON public.maintain_inventory_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin') OR
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'site_engineer') AND
     EXISTS (SELECT 1 FROM public.maintain_work_orders wo WHERE wo.id = work_order_id AND wo.status != 'completed'))
);

CREATE POLICY "delete_inventory_admin" ON public.maintain_inventory_logs FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
);

CREATE POLICY "delete_inventory_engineer" ON public.maintain_inventory_logs FOR DELETE USING (
    recorded_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.maintain_work_orders wo WHERE wo.id = work_order_id AND wo.status != 'completed')
);

-- 9. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public) 
VALUES ('workorder', 'workorder', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_delete_policy" ON storage.objects;

CREATE POLICY "media_select_policy" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'workorder');

CREATE POLICY "media_insert_policy" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'workorder' AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'site_engineer'))
);

CREATE POLICY "media_delete_policy" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'workorder' AND (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin') OR
        (owner = auth.uid() AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'site_engineer'))
    )
);

-- RELOAD API
NOTIFY pgrst, 'reload schema';
