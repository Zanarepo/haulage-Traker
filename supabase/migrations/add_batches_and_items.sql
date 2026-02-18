-- Add Batch columns to Ledger
ALTER TABLE public.maintain_inventory_ledger 
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS batch_name TEXT;

-- Create Predefined Items table
CREATE TABLE IF NOT EXISTS public.maintain_inventory_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'Parts',
    unit            TEXT NOT NULL DEFAULT 'pcs',
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);

-- RLS for Predefined Items
ALTER TABLE public.maintain_inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company items" ON public.maintain_inventory_items
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND company_id = public.maintain_inventory_items.company_id)
);

CREATE POLICY "Admins manage items" ON public.maintain_inventory_items
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
);

-- Seed some initial data (Optional, will do based on company_id at runtime or here for common ones)
-- Note: In a multi-tenant system, we usually seed per company creation, 
-- but I'll add a few globals or instructions for the user.
