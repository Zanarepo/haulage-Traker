-- Seed Predefined Items (Common Parts)
-- Note: Replace '{COMPANY_ID}' with the actual company ID if running manually, 
-- or we can use a subquery for the first company found.

INSERT INTO public.maintain_inventory_items (company_id, name, category, unit)
SELECT id, 'Engine Oil (15W40)', 'Fluids', 'liters' FROM public.companies
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO public.maintain_inventory_items (company_id, name, category, unit)
SELECT id, 'Oil Filter', 'Parts', 'pcs' FROM public.companies
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO public.maintain_inventory_items (company_id, name, category, unit)
SELECT id, 'Fuel Filter', 'Parts', 'pcs' FROM public.companies
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO public.maintain_inventory_items (company_id, name, category, unit)
SELECT id, 'Air Filter', 'Parts', 'pcs' FROM public.companies
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO public.maintain_inventory_items (company_id, name, category, unit)
SELECT id, 'Tire (Front)', 'Tires', 'pcs' FROM public.companies
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO public.maintain_inventory_items (company_id, name, category, unit)
SELECT id, 'Brake Pads (Set)', 'Parts', 'set' FROM public.companies
ON CONFLICT (company_id, name) DO NOTHING;
