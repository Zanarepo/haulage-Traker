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

-- 7. LOGISTICS & TRIPS
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES users(id),
    client_allocation_id UUID REFERENCES client_allocations(id),
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
FOR SELECT USING (trip_id IN (SELECT id FROM trips WHERE cluster_id IN (SELECT id FROM clusters WHERE company_id = get_my_company())));

DROP POLICY IF EXISTS "Drivers can insert logs for their trips" ON dispensing_logs;
CREATE POLICY "Drivers can insert logs for their trips" ON dispensing_logs
FOR INSERT WITH CHECK (trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid()));

DROP POLICY IF EXISTS "Admins and Auditors can manage logs" ON dispensing_logs;
CREATE POLICY "Admins and Auditors can manage logs" ON dispensing_logs
FOR ALL USING (get_my_role() IN ('superadmin', 'admin', 'auditor'));

-- FINANCIALS Policies
DROP POLICY IF EXISTS "Only finance and MD can view financials" ON financials;
CREATE POLICY "Only finance and MD can view financials" ON financials
FOR SELECT USING (get_my_role() IN ('superadmin', 'md', 'accountant', 'auditor'));

DROP POLICY IF EXISTS "Finance can manage financials" ON financials;
CREATE POLICY "Finance can manage financials" ON financials
FOR ALL USING (get_my_role() IN ('superadmin', 'accountant', 'auditor'));

-- 12. STORAGE RLS
INSERT INTO storage.buckets (id, name, public) VALUES ('alldocs', 'alldocs', false) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Users can view docs from their company" ON storage.objects;
CREATE POLICY "Users can view docs from their company" ON storage.objects
FOR SELECT USING (bucket_id = 'alldocs' AND get_my_company() IS NOT NULL);

DROP POLICY IF EXISTS "Drivers can upload trip documents" ON storage.objects;
CREATE POLICY "Drivers can upload trip documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'alldocs' AND get_my_role() = 'driver');
