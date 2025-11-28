/*
  # Fix Admin RLS to Use app_metadata

  1. Changes
    - Drop existing SELECT policy on users table
    - Create new policy that correctly reads role from app_metadata
    - Admin users can see all users
    - Regular users can only see themselves

  2. Security
    - Uses auth.jwt() -> 'app_metadata' -> 'role' to read role from JWT
    - Maintains user privacy for non-admin users
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "admin_select_all_users" ON public.users;

-- Create new SELECT policy with correct JWT path
CREATE POLICY "admin_select_all_users" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    -- Admin can see all users
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'yonetici')
    OR
    -- Users can see themselves
    (auth.uid() = id)
  );
