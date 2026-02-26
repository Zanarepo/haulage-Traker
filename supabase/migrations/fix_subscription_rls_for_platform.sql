-- ============================================================
-- FIX: Allow NexHaul platform admins to access ALL subscriptions
-- 
-- Problem: The subscriptions table RLS only allows users to see
-- their OWN company's subscription via get_my_company().
-- NexHaul platform admins are in nexhaul_admins table,
-- NOT in the users table, so get_my_company() returns NULL.
--
-- Solution: Add policies granting platform admins access to
-- ALL subscription records across all companies.
--
-- Access levels:
--   nexsuper  → Full CRUD on all subscriptions
--   nexadmin  → Full CRUD on all subscriptions
--   nexsupport → Read-only (SELECT) on all subscriptions
-- ============================================================

-- 1. NexSuper: Full access to all subscriptions
DROP POLICY IF EXISTS "NexSuper can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "NexSuper can manage all subscriptions" ON public.subscriptions
FOR ALL TO authenticated
USING (is_nexhaul_admin('nexsuper'))
WITH CHECK (is_nexhaul_admin('nexsuper'));

-- 2. NexAdmin: Full access to all subscriptions
DROP POLICY IF EXISTS "NexAdmin can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "NexAdmin can manage all subscriptions" ON public.subscriptions
FOR ALL TO authenticated
USING (is_nexhaul_admin('nexadmin'))
WITH CHECK (is_nexhaul_admin('nexadmin'));

-- 3. NexSupport: Read-only access to all subscriptions
DROP POLICY IF EXISTS "NexSupport can view all subscriptions" ON public.subscriptions;
CREATE POLICY "NexSupport can view all subscriptions" ON public.subscriptions
FOR SELECT TO authenticated
USING (is_nexhaul_admin('nexsupport'));
