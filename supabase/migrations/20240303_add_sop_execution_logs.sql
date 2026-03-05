-- Migration: Add SOP Execution Logs and Linking
-- Description: Creates a table to track when engineers execute SOPs, linked to work orders or itineraries.
-- Idempotent version.

-- 1. Create table if not exists
create table if not exists public.maintain_sop_execution_logs (
    id uuid not null default gen_random_uuid (),
    company_id uuid not null,
    sop_id uuid not null,
    user_id uuid not null,
    work_order_id uuid null,
    execution_data jsonb not null, -- Stores the state of the checklist checkboxes
    submitted_at timestamp with time zone not null default now(),
    locked_at timestamp with time zone not null, -- submitted_at + 2 hours
    
    constraint maintain_sop_execution_logs_pkey primary key (id),
    constraint maintain_sop_execution_logs_company_id_fkey foreign key (company_id) references companies (id) on delete cascade,
    constraint maintain_sop_execution_logs_sop_id_fkey foreign key (sop_id) references maintain_asset_sops (id) on delete cascade,
    constraint maintain_sop_execution_logs_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint maintain_sop_execution_logs_work_order_id_fkey foreign key (work_order_id) references maintain_work_orders (id) on delete set null
);

-- 2. Indexes for faster lookups (Idempotent)
create index if not exists idx_sop_execution_sop_id on public.maintain_sop_execution_logs (sop_id);
create index if not exists idx_sop_execution_work_order on public.maintain_sop_execution_logs (work_order_id);
create index if not exists idx_sop_execution_company on public.maintain_sop_execution_logs (company_id);

-- 3. Enable RLS
alter table public.maintain_sop_execution_logs enable row level security;

-- 4. Policies (Idempotent)
drop policy if exists "Users can view their own company's logs" on public.maintain_sop_execution_logs;
create policy "Users can view their own company's logs"
    on public.maintain_sop_execution_logs for select
    using (company_id in (
        select company_id from users where id = auth.uid()
    ));

drop policy if exists "Authorized users can insert logs" on public.maintain_sop_execution_logs;
create policy "Authorized users can insert logs"
    on public.maintain_sop_execution_logs for insert
    with check (
        company_id in (select company_id from users where id = auth.uid())
        AND (
            (select role from users where id = auth.uid()) IN ('superadmin', 'admin', 'md', 'manager', 'warehouse_manager', 'store_manager', 'storekeeper', 'site_engineer')
            OR EXISTS (select 1 from nexhaul_admins where id = auth.uid())
        )
    );
