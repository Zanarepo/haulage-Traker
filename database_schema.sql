-- DIESEL MONITORING SYSTEM SCHEMA (Supabase/PostgreSQL)
-- Fully idempotent - safe to run multiple times

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS (idempotent with DO block)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('superadmin', 'md', 'accountant', 'auditor', 'admin', 'driver', 'site_engineer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE driver_type AS ENUM ('internal', 'external');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE trip_status AS ENUM ('pending', 'active', 'dispensed', 'reconciled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. CORE MULTI-TENANCY
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USERS & RBAC
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    email TEXT UNIQUE,
    role user_role NOT NULL,
    driver_type driver_type DEFAULT NULL,
    needs_password_reset BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_cluster_assignments (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, cluster_id)
);

-- 5. CLIENTS & SITES
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    haulage_rate_per_liter DECIMAL(10, 2) NOT NULL DEFAULT 35.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    site_id_code TEXT UNIQUE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    tank_capacity DECIMAL(10, 2),
    host_community TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INVENTORY & DEPOT
CREATE TABLE IF NOT EXISTS depot_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    manufacturer_name TEXT,
    total_quantity DECIMAL(15, 2) NOT NULL,
    remaining_quantity DECIMAL(15, 2) NOT NULL,
    purchase_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    depot_purchase_id UUID REFERENCES depot_purchases(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    quantity_allocated DECIMAL(15, 2) NOT NULL,
    quantity_used DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INVENTORY LOGS (Unified audit trail)
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
    quantity DECIMAL(15, 2) NOT NULL,
    reference_id UUID, -- Can be depot_purchase_id or trip_id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LOGISTICS & TRIPS
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES users(id),
    client_id UUID REFERENCES clients(id),
    truck_plate_number TEXT,
    loaded_quantity DECIMAL(10, 2) NOT NULL,
    status trip_status DEFAULT 'pending',
    safety_checklist_json JSONB,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispensing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id),
    quantity_dispensed DECIMAL(10, 2) NOT NULL,
    community_provision_qty DECIMAL(10, 2) DEFAULT 0,
    before_tank_level DECIMAL(10, 2),
    after_tank_level DECIMAL(10, 2),
    waybill_photo_url TEXT,
    driver_signature_url TEXT,
    engineer_signature_url TEXT,
    engineer_name TEXT,
    geo_lat DECIMAL(10, 8),
    geo_lng DECIMAL(11, 8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'dispensed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trip_id, site_id)
);

-- 8. FINANCIALS & AUDIT
CREATE TABLE IF NOT EXISTS financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensing_log_id UUID REFERENCES dispensing_logs(id) ON DELETE CASCADE,
    calculated_haulage_fee DECIMAL(15, 2),
    loss_amount DECIMAL(10, 2),
    is_audit_flagged BOOLEAN DEFAULT FALSE,
    accountant_approval BOOLEAN DEFAULT FALSE,
    auditor_approval BOOLEAN DEFAULT FALSE,
    approved_by_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. PERMISSIONS - Grant table access to Supabase roles FIRST
-- This MUST come before RLS policies.
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ============================================================
-- 10. AUTO-REGISTRATION TRIGGER
-- This is the KEY to making signup work.
-- When a user signs up via supabase.auth.signUp(), they pass
-- company_name and full_name in the metadata. This trigger
-- automatically creates the company + profile with full DB
-- privileges, so no RLS or permission issues.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_company_id UUID;
    meta_company_name TEXT;
    meta_full_name TEXT;
    meta_phone TEXT;
BEGIN
    -- Extract metadata passed during signUp()
    meta_company_name := NEW.raw_user_meta_data->>'company_name';
    meta_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
    meta_phone := NEW.raw_user_meta_data->>'phone';

    -- If company_name was provided, this is a new company registration
    IF meta_company_name IS NOT NULL AND meta_company_name != '' THEN
        -- Create the company
        INSERT INTO public.companies (name)
        VALUES (meta_company_name)
        RETURNING id INTO new_company_id;

        -- Create the user profile as superadmin
        INSERT INTO public.users (id, company_id, full_name, email, phone_number, role, needs_password_reset, is_active)
        VALUES (
            NEW.id,
            new_company_id,
            meta_full_name,
            NEW.email,
            meta_phone,
            'superadmin',
            FALSE,
            TRUE
        );

        -- AUTO-CREATE 21-day Enterprise trial subscription
        INSERT INTO public.subscriptions (company_id, plan, status, trial_start, trial_end)
        VALUES (
            new_company_id,
            'trial',
            'active',
            NOW(),
            NOW() + INTERVAL '21 days'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 11. ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cluster_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE depot_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispensing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_itineraries ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION get_my_company() RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM public.users WHERE id = auth.uid());
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_role() RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- COMPANIES Policies
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
CREATE POLICY "Users can view their own company" ON companies
FOR SELECT USING (id = get_my_company());

DROP POLICY IF EXISTS "Superadmins can update their company" ON companies;
CREATE POLICY "Superadmins can update their company" ON companies
FOR UPDATE TO authenticated
USING (id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'superadmin'))
WITH CHECK (id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'superadmin'));

-- USERS Policies
DROP POLICY IF EXISTS "Users can view own profile and colleagues" ON users;
CREATE POLICY "Users can view own profile and colleagues" ON users
FOR SELECT USING (id = auth.uid() OR company_id = get_my_company());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Management can manage users" ON users;
CREATE POLICY "Management can manage users" ON users
FOR ALL USING (
    get_my_role() IN ('superadmin', 'admin')
    AND company_id = get_my_company()
);

-- CLUSTERS Policies
DROP POLICY IF EXISTS "Company users can view clusters" ON clusters;
CREATE POLICY "Company users can view clusters" ON clusters
FOR SELECT USING (company_id = get_my_company());

DROP POLICY IF EXISTS "Admins can manage clusters" ON clusters;
CREATE POLICY "Admins can manage clusters" ON clusters
FOR ALL USING (company_id = get_my_company() AND get_my_role() IN ('superadmin', 'admin'));

-- USER_CLUSTER_ASSIGNMENTS Policies
DROP POLICY IF EXISTS "Users can view their own assignments" ON user_cluster_assignments;
CREATE POLICY "Users can view their own assignments" ON user_cluster_assignments
FOR SELECT USING (user_id = auth.uid() OR get_my_role() IN ('superadmin', 'admin', 'md', 'accountant', 'auditor'));

DROP POLICY IF EXISTS "Admins can manage assignments" ON user_cluster_assignments;
CREATE POLICY "Admins can manage assignments" ON user_cluster_assignments
FOR ALL USING (get_my_role() IN ('superadmin', 'admin'));

-- CLIENTS Policies
DROP POLICY IF EXISTS "Company users can view clients" ON clients;
CREATE POLICY "Company users can view clients" ON clients
FOR SELECT USING (company_id = get_my_company());

DROP POLICY IF EXISTS "Management can manage clients" ON clients;
CREATE POLICY "Management can manage clients" ON clients
FOR ALL USING (company_id = get_my_company() AND get_my_role() IN ('superadmin', 'admin', 'md', 'accountant'));

-- SITES Policies
DROP POLICY IF EXISTS "Company users can view sites" ON sites;
CREATE POLICY "Company users can view sites" ON sites
FOR SELECT USING (cluster_id IN (SELECT id FROM clusters WHERE company_id = get_my_company()));

DROP POLICY IF EXISTS "Admins can manage sites" ON sites;
CREATE POLICY "Admins can manage sites" ON sites
FOR ALL USING (cluster_id IN (SELECT id FROM clusters WHERE company_id = get_my_company()) AND get_my_role() IN ('superadmin', 'admin'));

-- INVENTORY Policies
DROP POLICY IF EXISTS "Staff can view depot data" ON depot_purchases;
CREATE POLICY "Staff can view depot data" ON depot_purchases
FOR SELECT USING (company_id = get_my_company());

DROP POLICY IF EXISTS "Management can manage inventory" ON depot_purchases;
CREATE POLICY "Management can manage inventory" ON depot_purchases
FOR ALL USING (company_id = get_my_company() AND get_my_role() IN ('superadmin', 'admin', 'md', 'accountant'));

DROP POLICY IF EXISTS "Staff can view allocations" ON client_allocations;
CREATE POLICY "Staff can view allocations" ON client_allocations
FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE company_id = get_my_company()));

DROP POLICY IF EXISTS "Management can manage allocations" ON client_allocations;
CREATE POLICY "Management can manage allocations" ON client_allocations
FOR ALL USING (client_id IN (SELECT id FROM clients WHERE company_id = get_my_company()) AND get_my_role() IN ('superadmin', 'admin', 'accountant'));

-- INVENTORY LOGS Policies
DROP POLICY IF EXISTS "Company users can view inventory logs" ON inventory_logs;
CREATE POLICY "Company users can view inventory logs" ON inventory_logs
FOR SELECT USING (company_id = get_my_company());

DROP POLICY IF EXISTS "Management can manage inventory logs" ON inventory_logs;
CREATE POLICY "Management can manage inventory logs" ON inventory_logs
FOR ALL USING (company_id = get_my_company() AND get_my_role() IN ('superadmin', 'admin', 'md', 'accountant', 'auditor'));

-- TRIPS Policies
DROP POLICY IF EXISTS "Company users can view trips" ON trips;
CREATE POLICY "Company users can view trips" ON trips
FOR SELECT USING (cluster_id IN (SELECT id FROM clusters WHERE company_id = get_my_company()));

DROP POLICY IF EXISTS "Drivers can view and update their own trips" ON trips;
CREATE POLICY "Drivers can view and update their own trips" ON trips
FOR ALL USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all trips" ON trips;
CREATE POLICY "Admins can manage all trips" ON trips
FOR ALL USING (cluster_id IN (SELECT id FROM clusters WHERE company_id = get_my_company()) AND get_my_role() IN ('superadmin', 'admin'));

-- DISPENSING LOGS Policies
DROP POLICY IF EXISTS "Company users can view dispensing logs" ON dispensing_logs;
CREATE POLICY "Company users can view dispensing logs" ON dispensing_logs
FOR SELECT USING (
    trip_id IN (SELECT id FROM trips WHERE cluster_id IN (SELECT id FROM clusters WHERE company_id = get_my_company()))
    OR trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid())
);

DROP POLICY IF EXISTS "Drivers can insert logs for their trips" ON dispensing_logs;
CREATE POLICY "Drivers can insert logs for their trips" ON dispensing_logs
FOR INSERT WITH CHECK (
    trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins and Auditors can manage logs" ON dispensing_logs;
CREATE POLICY "Admins and Auditors can manage logs" ON dispensing_logs
FOR ALL USING (get_my_role() IN ('superadmin', 'admin', 'auditor'));

-- FINANCIALS Policies
DROP POLICY IF EXISTS "Only finance and MD can view financials" ON financials;
CREATE POLICY "Only finance and MD can view financials" ON financials
FOR SELECT USING (get_my_role() IN ('superadmin', 'md', 'accountant', 'auditor', 'admin'));

DROP POLICY IF EXISTS "Finance can manage financials" ON financials;
CREATE POLICY "Finance can manage financials" ON financials
FOR ALL USING (get_my_role() IN ('superadmin', 'accountant', 'auditor', 'admin'));

-- TRIP_ITINERARIES Policies
DROP POLICY IF EXISTS "Company users can view itineraries" ON trip_itineraries;
CREATE POLICY "Company users can view itineraries" ON trip_itineraries
FOR SELECT USING (trip_id IN (SELECT id FROM trips WHERE cluster_id IN (SELECT id FROM clusters WHERE company_id = get_my_company())));

DROP POLICY IF EXISTS "Drivers can update itinerary status" ON trip_itineraries;
CREATE POLICY "Drivers can update itinerary status" ON trip_itineraries
FOR UPDATE USING (trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid()));

DROP POLICY IF EXISTS "Drivers can add itinerary stops" ON trip_itineraries;
CREATE POLICY "Drivers can add itinerary stops" ON trip_itineraries
FOR INSERT WITH CHECK (
    trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage all itineraries" ON trip_itineraries;
CREATE POLICY "Admins can manage all itineraries" ON trip_itineraries
FOR ALL USING (trip_id IN (SELECT id FROM trips WHERE cluster_id IN (SELECT id FROM clusters WHERE company_id = get_my_company())) AND get_my_role() IN ('superadmin', 'admin'));

-- 12. STORAGE RLS
INSERT INTO storage.buckets (id, name, public) VALUES ('alldocs', 'alldocs', true) ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Users can view docs from their company" ON storage.objects;
CREATE POLICY "Users can view docs from their company" ON storage.objects
FOR SELECT USING (bucket_id = 'alldocs');

DROP POLICY IF EXISTS "Drivers can upload trip documents" ON storage.objects;
CREATE POLICY "Drivers can upload trip documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'alldocs' AND 
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('driver', 'superadmin', 'admin', 'site_engineer')
);
-- ============================================================
-- 13. AUTOMATIC STOCK REDUCTION (FIFO)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_trip_stock_reduction()
RETURNS TRIGGER AS $$
DECLARE
    remaining_to_deduct DECIMAL(15, 2);
    batch_record RECORD;
    deduction_qty DECIMAL(15, 2);
BEGIN
    remaining_to_deduct := NEW.loaded_quantity;

    -- PASS 1: Deduct from the intended client's stock
    FOR batch_record IN 
        SELECT id, remaining_quantity 
        FROM public.depot_purchases 
        WHERE client_id = NEW.client_id 
          AND remaining_quantity > 0 
        ORDER BY purchase_date ASC, created_at ASC
    LOOP
        IF remaining_to_deduct <= 0 THEN EXIT; END IF;

        IF batch_record.remaining_quantity >= remaining_to_deduct THEN
            UPDATE public.depot_purchases SET remaining_quantity = remaining_quantity - remaining_to_deduct WHERE id = batch_record.id;
            remaining_to_deduct := 0;
        ELSE
            deduction_qty := batch_record.remaining_quantity;
            UPDATE public.depot_purchases SET remaining_quantity = 0 WHERE id = batch_record.id;
            remaining_to_deduct := remaining_to_deduct - deduction_qty;
        END IF;
    END LOOP;

    -- PASS 2: "BORROWING" - If still have quantity to deduct, take from ANY other available stock
    IF remaining_to_deduct > 0 THEN
        FOR batch_record IN 
            SELECT id, remaining_quantity 
            FROM public.depot_purchases 
            WHERE client_id != NEW.client_id  -- Other clients
              AND remaining_quantity > 0 
            ORDER BY purchase_date ASC, created_at ASC
        LOOP
            IF remaining_to_deduct <= 0 THEN EXIT; END IF;

            IF batch_record.remaining_quantity >= remaining_to_deduct THEN
                UPDATE public.depot_purchases SET remaining_quantity = remaining_quantity - remaining_to_deduct WHERE id = batch_record.id;
                remaining_to_deduct := 0;
            ELSE
                deduction_qty := batch_record.remaining_quantity;
                UPDATE public.depot_purchases SET remaining_quantity = 0 WHERE id = batch_record.id;
                remaining_to_deduct := remaining_to_deduct - deduction_qty;
            END IF;
        END LOOP;
    END IF;

    -- LOG INDIVIDUAL REDUCTION (Unified History)
    INSERT INTO public.inventory_logs (company_id, client_id, type, quantity, reference_id)
    SELECT company_id, NEW.client_id, 'OUT', NEW.loaded_quantity, NEW.id
    FROM public.clients WHERE id = NEW.client_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. FINANCIALS & FEES
CREATE OR REPLACE FUNCTION public.handle_dispensing_financials()
RETURNS TRIGGER AS $$
DECLARE
    v_client_id UUID;
    v_rate DECIMAL(10, 2);
    v_haulage_fee DECIMAL(15, 2);
BEGIN
    -- Get client_id directly from site (more resilient for multi-site pooling)
    -- We use a more robust selection here.
    SELECT client_id INTO v_client_id 
    FROM public.sites 
    WHERE id = NEW.site_id;
    
    -- If site doesn't have a direct client (unlikely), try to get it from the trip
    IF v_client_id IS NULL THEN
        SELECT client_id INTO v_client_id FROM public.trips WHERE id = NEW.trip_id;
    END IF;
    
    -- Get haulage rate from client
    SELECT COALESCE(haulage_rate_per_liter, 0) INTO v_rate 
    FROM public.clients 
    WHERE id = v_client_id;
    
    -- Calculate fee (ensure no NULLs)
    v_haulage_fee := COALESCE(NEW.quantity_dispensed, 0) * COALESCE(v_rate, 0);
    
    -- Insert financial record
    -- We use an explicit INSERT with all needed fields
    INSERT INTO public.financials (
        dispensing_log_id, 
        calculated_haulage_fee, 
        loss_amount,
        is_audit_flagged,
        accountant_approval,
        auditor_approval
    )
    VALUES (
        NEW.id, 
        v_haulage_fee, 
        0,
        FALSE,
        FALSE,
        FALSE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the triggers
DROP TRIGGER IF EXISTS on_trip_created_reduce_stock ON public.trips;
CREATE TRIGGER on_trip_created_reduce_stock
    AFTER INSERT ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.handle_trip_stock_reduction();

-- Re-bind the trigger to ensure it exists and is active
DROP TRIGGER IF EXISTS on_dispensing_create_financials ON public.dispensing_logs;
CREATE TRIGGER on_dispensing_create_financials
    AFTER INSERT ON public.dispensing_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_dispensing_financials();

-- 15. DRIVER TRACKING
CREATE TABLE IF NOT EXISTS public.driver_locations (
    driver_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone in company can view driver locations" ON public.driver_locations;
CREATE POLICY "Anyone in company can view driver locations" ON public.driver_locations
FOR SELECT USING (
    driver_id IN (SELECT id FROM public.users WHERE company_id = get_my_company())
);

DROP POLICY IF EXISTS "Drivers can update their own location" ON public.driver_locations;
CREATE POLICY "Drivers can update their own location" ON public.driver_locations
FOR ALL USING (driver_id = auth.uid());

-- Enable Realtime
-- Note: This is usually done via Supabase Dashboard but we can attempt to add to the publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'driver_locations'
    ) THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
        EXCEPTION WHEN OTHERS THEN
            -- In some environments, this might fail if the publication doesn't exist yet
            NULL;
        END;
    END IF;
END $$;

-- 16. DIESEL RECONCILIATION
CREATE TABLE IF NOT EXISTS public.fuel_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_allocated DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_supplied DECIMAL(15, 2) NOT NULL DEFAULT 0,
    balance DECIMAL(15, 2) GENERATED ALWAYS AS (total_supplied - total_allocated) STORED,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
    reconciled_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Enable RLS
ALTER TABLE public.fuel_reconciliations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view reconciliations from their company" ON public.fuel_reconciliations;
CREATE POLICY "Users can view reconciliations from their company" ON public.fuel_reconciliations
FOR SELECT USING (company_id = get_my_company());

DROP POLICY IF EXISTS "Management can manage reconciliations" ON public.fuel_reconciliations;
CREATE POLICY "Management can manage reconciliations" ON public.fuel_reconciliations
FOR ALL USING (
    company_id = get_my_company() AND 
    get_my_role() IN ('superadmin', 'md', 'accountant', 'admin', 'auditor')
);

-- ============================================================
-- 17. SUBSCRIPTIONS & PLAN MANAGEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'free', 'small_business', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    trial_start TIMESTAMPTZ DEFAULT NOW(),
    trial_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '21 days'),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    paystack_customer_code TEXT,
    paystack_subscription_code TEXT,
    paystack_email_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their company subscription" ON public.subscriptions;
CREATE POLICY "Users can view their company subscription" ON public.subscriptions
FOR SELECT USING (company_id = get_my_company());

DROP POLICY IF EXISTS "Superadmins can manage subscription" ON public.subscriptions;
CREATE POLICY "Superadmins can manage subscription" ON public.subscriptions
FOR ALL USING (
    company_id = get_my_company() AND
    get_my_role() = 'superadmin'
);

-- Grant permissions
GRANT ALL ON public.subscriptions TO anon, authenticated, service_role;

-- Helper function to get current company plan
CREATE OR REPLACE FUNCTION get_company_plan() RETURNS TEXT AS $$
DECLARE
    sub_plan TEXT;
    sub_trial_end TIMESTAMPTZ;
    sub_status TEXT;
BEGIN
    SELECT plan, trial_end, status INTO sub_plan, sub_trial_end, sub_status
    FROM public.subscriptions
    WHERE company_id = get_my_company();

    -- No subscription found
    IF sub_plan IS NULL THEN RETURN 'free'; END IF;
    -- Cancelled or expired
    IF sub_status IN ('cancelled', 'expired') THEN RETURN 'free'; END IF;
    -- Trial expired
    IF sub_plan = 'trial' AND sub_trial_end < NOW() THEN RETURN 'free'; END IF;

    RETURN sub_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
