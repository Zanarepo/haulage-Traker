-- NEXHAUL PLATFORM ADMIN SCHEMA
-- Hardened Version: No user_metadata references in RLS

-- 1. Create/Update the table
CREATE TABLE IF NOT EXISTS nexhaul_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('nexsuper', 'nexadmin', 'nexsupport')) DEFAULT 'nexadmin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure correct reference to auth.users (fixes FK issue)
DO $$ 
BEGIN
    ALTER TABLE nexhaul_admins 
    DROP CONSTRAINT IF EXISTS nexhaul_admins_id_fkey,
    ADD CONSTRAINT nexhaul_admins_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 2. Enable RLS
ALTER TABLE nexhaul_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 3. Helper Functions (SECURITY DEFINER bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_nexhaul_admin(target_role text DEFAULT NULL)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM nexhaul_admins 
    WHERE id = auth.uid() 
    AND (target_role IS NULL OR role = target_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Create RLS Policies

-- Cleanup existing policies
DROP POLICY IF EXISTS nexsuper_all_access ON nexhaul_admins;
DROP POLICY IF EXISTS admins_view_own ON nexhaul_admins;
DROP POLICY IF EXISTS admins_view_others ON nexhaul_admins;
DROP POLICY IF EXISTS nexsuper_manage_all_companies ON companies;

-- Policy for NexSuper: ALL access
CREATE POLICY nexsuper_all_access ON nexhaul_admins
FOR ALL TO authenticated
USING (is_nexhaul_admin('nexsuper'));

-- Policy for Admins to view their own profile
CREATE POLICY admins_view_own ON nexhaul_admins
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Policy for NexAdmin and NexSupport to view other admins
CREATE POLICY admins_view_others ON nexhaul_admins
FOR SELECT TO authenticated
USING (is_nexhaul_admin());

-- Global Company Management for NexSuper (Fixed to avoid user_metadata)
CREATE POLICY nexsuper_manage_all_companies ON companies
FOR ALL TO authenticated
USING (is_nexhaul_admin('nexsuper'))
WITH CHECK (is_nexhaul_admin('nexsuper'));

-- 5. Role Synchronization Function
-- Populates app_metadata (secure) instead of user_metadata (insecure)
CREATE OR REPLACE FUNCTION handle_nexhaul_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users 
  SET raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role, 'is_platform_admin', true)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing trigger
DROP TRIGGER IF EXISTS on_nexhaul_admin_upsert ON nexhaul_admins;

CREATE TRIGGER on_nexhaul_admin_upsert
AFTER INSERT OR UPDATE ON nexhaul_admins
FOR EACH ROW EXECUTE FUNCTION handle_nexhaul_admin_role();
