-- Refine Asset Hierarchy: Link assets directly to Clusters
ALTER TABLE public.maintain_assets
ADD COLUMN cluster_id UUID REFERENCES public.clusters(id);

-- Backfill cluster_id from sites
UPDATE public.maintain_assets a
SET cluster_id = s.cluster_id
FROM public.sites s
WHERE a.site_id = s.id;

-- Make it NOT NULL after backfill if possible, but keep it nullable for safety if some assets are siteless
-- (Though the user wants Cluster -> Site -> Asset, so siteless should eventually be rare)
CREATE INDEX idx_maintain_assets_cluster ON public.maintain_assets(cluster_id);
