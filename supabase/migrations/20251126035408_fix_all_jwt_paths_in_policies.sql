/*
  # Fix All JWT Paths in RLS Policies

  1. Changes
    - Update all policies to use correct JWT path: app_metadata -> role
    - Affects users table and student_assignments table
    - Ensures admin access works correctly across all tables

  2. Security
    - Maintains same security logic, just fixes JWT path
    - Admin users (yonetici) get full access
    - Regular users get limited access
*/

-- Fix users table UPDATE policy
DROP POLICY IF EXISTS "admin_update_users" ON public.users;
CREATE POLICY "admin_update_users" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'yonetici')
    OR
    (auth.uid() = id)
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'yonetici')
    OR
    (auth.uid() = id)
  );

-- Fix users table DELETE policy
DROP POLICY IF EXISTS "admin_delete_users" ON public.users;
CREATE POLICY "admin_delete_users" ON public.users
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'yonetici'
  );

-- Fix student_assignments SELECT policy
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.student_assignments;
CREATE POLICY "Admins can view all assignments" ON public.student_assignments
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'yonetici'
  );

-- Fix student_assignments DELETE policy
DROP POLICY IF EXISTS "Admins can delete assignments" ON public.student_assignments;
CREATE POLICY "Admins can delete assignments" ON public.student_assignments
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'yonetici'
  );
