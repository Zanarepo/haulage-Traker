-- Add confirmation and asset-linking to dispensing logs
ALTER TABLE public.dispensing_logs
ADD COLUMN confirmed_at TIMESTAMPTZ,
ADD COLUMN confirmed_by UUID REFERENCES public.users(id),
ADD COLUMN confirmed_asset_id UUID REFERENCES public.maintain_assets(id);

-- Index for performance
CREATE INDEX idx_dispensing_logs_asset ON public.dispensing_logs(confirmed_asset_id);
CREATE INDEX idx_dispensing_logs_site ON public.dispensing_logs(site_id);
