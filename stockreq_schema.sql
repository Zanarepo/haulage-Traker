-- Create the Stock Requests table
CREATE TABLE IF NOT EXISTS public.maintain_stock_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    engineer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'fulfilled'
    notes TEXT,
    admin_notes TEXT,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.maintain_stock_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to see requests from their own company
CREATE POLICY "Users can see own company stock requests" ON public.maintain_stock_requests
    FOR SELECT TO authenticated
    USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Allow engineers to create stock requests
CREATE POLICY "Engineers can create stock requests" ON public.maintain_stock_requests
    FOR INSERT TO authenticated
    WITH CHECK (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Allow admins/engineers to update requests (restricted to company)
CREATE POLICY "Users can update stock requests" ON public.maintain_stock_requests
    FOR UPDATE TO authenticated
    USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));