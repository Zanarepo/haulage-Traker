-- ============================================================
-- NexHaul Maintain — Visit Report Media (v2)
-- Using 'maintain_visit_report_media' for better consistency
-- Using 'sitedoc' as the storage bucket
-- ============================================================

-- 1. VISIT REPORT MEDIA TABLE
-- Stores multiple images for site visits with headers
CREATE TABLE IF NOT EXISTS public.maintain_visit_report_media (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_report_id UUID NOT NULL REFERENCES public.maintain_visit_reports(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('before', 'after', 'other')),
    file_url        TEXT NOT NULL,
    header          TEXT,
    uploaded_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. SETUP SECURITY (RLS)
ALTER TABLE public.maintain_visit_report_media ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES: Visit Report Media
DROP POLICY IF EXISTS "view_visit_media" ON public.maintain_visit_report_media;
DROP POLICY IF EXISTS "insert_visit_media" ON public.maintain_visit_report_media;
DROP POLICY IF EXISTS "delete_visit_media_admin" ON public.maintain_visit_report_media;
DROP POLICY IF EXISTS "delete_visit_media_engineer" ON public.maintain_visit_report_media;

-- Allow everyone in the company to view media
CREATE POLICY "view_visit_media" ON public.maintain_visit_report_media 
    FOR SELECT USING (
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

-- Allow engineers and admins to insert media
CREATE POLICY "insert_visit_media" ON public.maintain_visit_report_media 
    FOR INSERT WITH CHECK (
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

-- Allow admins to delete any media in their company
CREATE POLICY "delete_visit_media_admin" ON public.maintain_visit_report_media 
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'md'))
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

-- Allow engineers to delete their own uploads
CREATE POLICY "delete_visit_media_engineer" ON public.maintain_visit_report_media 
    FOR DELETE USING (
        uploaded_by = auth.uid()
    );

-- 4. STORAGE SETUP (SITEDOC BUCKET)
-- Path Format: companies/<company_id>/visits/<visit_id>/<filename>

DROP POLICY IF EXISTS "sitedoc_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "sitedoc_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "sitedoc_delete_policy" ON storage.objects;

-- Select: Users can view files if the company_id in the path matches their own
CREATE POLICY "sitedoc_select_policy" ON storage.objects 
    FOR SELECT TO authenticated 
    USING (
        bucket_id = 'sitedoc' AND 
        (storage.foldername(name))[2] = (SELECT company_id::text FROM public.users WHERE id = auth.uid())
    );

-- Insert: Users can upload files if the company_id in the path matches their own
CREATE POLICY "sitedoc_insert_policy" ON storage.objects 
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'sitedoc' AND 
        (storage.foldername(name))[2] = (SELECT company_id::text FROM public.users WHERE id = auth.uid()) AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'md', 'site_engineer'))
    );

-- Delete: Users can delete files if the company_id in the path matches their own
CREATE POLICY "sitedoc_delete_policy" ON storage.objects 
    FOR DELETE TO authenticated 
    USING (
        bucket_id = 'sitedoc' AND 
        (storage.foldername(name))[2] = (SELECT company_id::text FROM public.users WHERE id = auth.uid()) AND
        (
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'md')) OR
            (owner = auth.uid())
        )
    );

-- 5. RELOAD API
NOTIFY pgrst, 'reload schema';
