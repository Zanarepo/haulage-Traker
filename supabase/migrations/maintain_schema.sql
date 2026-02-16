-- ============================================================
-- NexHaul Maintain — Database Schema Migration
-- Schema: maintain (separate from public/InfraSupply)
-- Cross-schema FKs: maintain.* → public.sites, public.users, etc.
-- ============================================================

-- 1. Create the maintain schema
CREATE SCHEMA IF NOT EXISTS maintain;

-- 2. Add product modules to companies (in public schema)
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS active_modules text[] DEFAULT ARRAY['infra_supply'];

-- ============================================================
-- ASSETS — Machines/equipment registered at sites
-- FK: site_id → public.sites(id)
-- ============================================================
CREATE TABLE maintain.assets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Identity
    type            TEXT NOT NULL CHECK (type IN ('generator','inverter','ac_unit','rectifier','battery_bank','ups','solar_panel','other')),
    make_model      TEXT,
    serial_number   TEXT,
    qr_code         TEXT UNIQUE,           -- For QR scanning feature
    
    -- Health tracking
    hour_meter              NUMERIC DEFAULT 0,
    service_interval_hrs    NUMERIC DEFAULT 250,   -- Default: service every 250 hours
    service_interval_days   INTEGER DEFAULT 10,    -- Default: service every 10 working days
    last_service_date       TIMESTAMPTZ,
    last_service_hour_meter NUMERIC DEFAULT 0,
    fuel_tank_capacity      NUMERIC,               -- Liters
    
    -- Status
    status      TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','decommissioned')),
    notes       TEXT,
    
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- WORK ORDERS — Maintenance tickets (preventive/reactive/inspection)
-- FKs: asset_id → maintain.assets, site_id → public.sites, 
--       engineer_id → public.users, company_id → public.companies
-- ============================================================
CREATE TABLE maintain.work_orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_id    UUID REFERENCES maintain.assets(id) ON DELETE SET NULL,
    site_id     UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    
    -- Assignment
    engineer_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Classification
    type            TEXT NOT NULL CHECK (type IN ('preventive','reactive','inspection','emergency')),
    priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
    title           TEXT NOT NULL,
    description     TEXT,
    
    -- SLA
    sla_target_hrs  NUMERIC,               -- e.g., 4 hours for critical
    
    -- Lifecycle timestamps
    status          TEXT DEFAULT 'open' CHECK (status IN ('open','assigned','in_progress','completed','cancelled','on_hold')),
    scheduled_date  TIMESTAMPTZ,
    assigned_at     TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    
    -- Custom fields
    fault_code      TEXT,
    rca_category    TEXT,                   -- Root Cause Analysis category
    tags            TEXT[],
    
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- VISIT REPORTS — Before/after documentation per work order
-- FK: work_order_id → maintain.work_orders
-- ============================================================
CREATE TABLE maintain.visit_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES maintain.work_orders(id) ON DELETE CASCADE,
    engineer_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Before state
    before_photos       TEXT[],            -- Array of storage URLs
    hour_meter_before   NUMERIC,
    diesel_level_before NUMERIC,           -- Liters or %
    site_condition_notes TEXT,
    
    -- After state
    after_photos        TEXT[],
    hour_meter_after    NUMERIC,
    diesel_level_after  NUMERIC,
    
    -- GPS verification
    geo_lat         NUMERIC,
    geo_lng         NUMERIC,
    geofence_valid  BOOLEAN DEFAULT false, -- Was engineer within site radius?
    
    -- Timing
    arrived_at      TIMESTAMPTZ,
    departed_at     TIMESTAMPTZ,
    
    -- Sync
    offline_synced  BOOLEAN DEFAULT false, -- Was this captured offline and synced later?
    synced_at       TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SAFETY CHECKLISTS — Per visit safety sign-off
-- FK: visit_report_id → maintain.visit_reports
-- ============================================================
CREATE TABLE maintain.safety_checklists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_report_id UUID NOT NULL REFERENCES maintain.visit_reports(id) ON DELETE CASCADE,
    
    checklist_json  JSONB NOT NULL,        -- { "electrical": {...}, "fire": {...}, ... }
    passed          BOOLEAN DEFAULT false,
    notes           TEXT,
    signed_by       UUID REFERENCES public.users(id),
    
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SUPPLY ALLOCATIONS — Materials given to engineers per work order
-- FK: work_order_id → maintain.work_orders
-- ============================================================
CREATE TABLE maintain.supply_allocations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES maintain.work_orders(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    item_name       TEXT NOT NULL,          -- "Engine Oil 15W-40", "Air Filter", "Washing Material"
    item_category   TEXT,                   -- "oil", "filter", "belt", "washing", "other"
    qty_allocated   NUMERIC NOT NULL DEFAULT 0,
    qty_used        NUMERIC DEFAULT 0,
    qty_returned    NUMERIC DEFAULT 0,
    unit            TEXT DEFAULT 'pcs',     -- pcs, liters, kg
    
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MAINTENANCE TASKS — Individual tasks logged during a visit
-- FK: visit_report_id → maintain.visit_reports
-- ============================================================
CREATE TABLE maintain.maintenance_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_report_id UUID NOT NULL REFERENCES maintain.visit_reports(id) ON DELETE CASCADE,
    
    task_type       TEXT NOT NULL,          -- "oil_change", "filter_replacement", "belt_check", "washing", "repair"
    description     TEXT,
    parts_used      TEXT[],                 -- ["fan belt", "fuel filter"]
    issues_found    TEXT,
    
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- GENERATED REPORTS — Saved/scheduled report outputs
-- FK: company_id → public.companies
-- ============================================================
CREATE TABLE maintain.generated_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    report_type     TEXT NOT NULL,          -- "visit_summary", "pm_compliance", "engineer_performance", etc.
    title           TEXT,
    filters_json    JSONB,                  -- { "cluster_id": "...", "date_from": "...", "date_to": "..." }
    generated_by    UUID REFERENCES public.users(id),
    file_url        TEXT,                   -- Supabase storage URL to the generated PDF/CSV
    format          TEXT DEFAULT 'pdf',     -- "pdf", "csv", "xlsx"
    
    -- Scheduling
    is_scheduled    BOOLEAN DEFAULT false,
    schedule_cron   TEXT,                   -- "0 9 * * 1" = every Monday 9am
    recipients      TEXT[],                 -- Email addresses
    
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ASSET SOPs — Standard Operating Procedures per asset type
-- FK: company_id → public.companies
-- ============================================================
CREATE TABLE maintain.asset_sops (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    asset_type      TEXT NOT NULL,          -- Matches maintain.assets.type
    title           TEXT NOT NULL,          -- "FG Wilson P110 — 250hr Service Procedure"
    steps_json      JSONB NOT NULL,         -- [{ "step": 1, "instruction": "...", "warning": "..." }]
    attachments     TEXT[],                 -- URLs to reference docs/images
    
    is_global       BOOLEAN DEFAULT false,  -- true = available to all companies (system templates)
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- INDEXES — Performance optimization
-- ============================================================
CREATE INDEX idx_assets_site          ON maintain.assets(site_id);
CREATE INDEX idx_assets_company       ON maintain.assets(company_id);
CREATE INDEX idx_assets_type          ON maintain.assets(type);
CREATE INDEX idx_assets_qr            ON maintain.assets(qr_code);

CREATE INDEX idx_wo_company           ON maintain.work_orders(company_id);
CREATE INDEX idx_wo_site              ON maintain.work_orders(site_id);
CREATE INDEX idx_wo_engineer          ON maintain.work_orders(engineer_id);
CREATE INDEX idx_wo_status            ON maintain.work_orders(status);
CREATE INDEX idx_wo_type              ON maintain.work_orders(type);
CREATE INDEX idx_wo_scheduled         ON maintain.work_orders(scheduled_date);

CREATE INDEX idx_vr_work_order        ON maintain.visit_reports(work_order_id);
CREATE INDEX idx_vr_engineer          ON maintain.visit_reports(engineer_id);

CREATE INDEX idx_supply_wo            ON maintain.supply_allocations(work_order_id);
CREATE INDEX idx_supply_company       ON maintain.supply_allocations(company_id);

CREATE INDEX idx_reports_company      ON maintain.generated_reports(company_id);


-- ============================================================
-- ROW LEVEL SECURITY — Company isolation
-- ============================================================
ALTER TABLE maintain.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintain.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintain.visit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintain.safety_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintain.supply_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintain.maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintain.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintain.asset_sops ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access data from their own company

CREATE POLICY "company_isolation" ON maintain.assets
    FOR ALL USING (company_id = (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "company_isolation" ON maintain.work_orders
    FOR ALL USING (company_id = (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "company_isolation" ON maintain.supply_allocations
    FOR ALL USING (company_id = (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "company_isolation" ON maintain.generated_reports
    FOR ALL USING (company_id = (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "company_isolation" ON maintain.asset_sops
    FOR ALL USING (
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        OR is_global = true
    );

-- Visit reports, safety checklists, tasks: access via work_order → company chain
CREATE POLICY "via_work_order" ON maintain.visit_reports
    FOR ALL USING (work_order_id IN (
        SELECT id FROM maintain.work_orders 
        WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    ));

CREATE POLICY "via_visit_report" ON maintain.safety_checklists
    FOR ALL USING (visit_report_id IN (
        SELECT id FROM maintain.visit_reports WHERE work_order_id IN (
            SELECT id FROM maintain.work_orders 
            WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        )
    ));

CREATE POLICY "via_visit_report" ON maintain.maintenance_tasks
    FOR ALL USING (visit_report_id IN (
        SELECT id FROM maintain.visit_reports WHERE work_order_id IN (
            SELECT id FROM maintain.work_orders 
            WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        )
    ));


-- ============================================================
-- HELPER VIEW — Asset health with next service calculation
-- ============================================================
CREATE OR REPLACE VIEW maintain.v_asset_health AS
SELECT 
    a.id,
    a.site_id,
    a.company_id,
    a.type,
    a.make_model,
    a.serial_number,
    a.hour_meter,
    a.service_interval_hrs,
    a.service_interval_days,
    a.last_service_date,
    a.last_service_hour_meter,
    a.status,
    
    -- Hours until next service
    (a.last_service_hour_meter + a.service_interval_hrs) - a.hour_meter AS hrs_until_service,
    
    -- Days until next service
    a.last_service_date + (a.service_interval_days || ' days')::INTERVAL AS next_service_date,
    
    -- Is overdue?
    CASE 
        WHEN a.hour_meter >= (a.last_service_hour_meter + a.service_interval_hrs) THEN true
        WHEN a.last_service_date + (a.service_interval_days || ' days')::INTERVAL < now() THEN true
        ELSE false
    END AS is_overdue,
    
    -- Site info (from public schema)
    s.name AS site_name,
    s.site_id_code
FROM maintain.assets a
JOIN public.sites s ON s.id = a.site_id;


-- ============================================================
-- Grant access to authenticated users via Supabase
-- ============================================================
GRANT USAGE ON SCHEMA maintain TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA maintain TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA maintain TO authenticated;
