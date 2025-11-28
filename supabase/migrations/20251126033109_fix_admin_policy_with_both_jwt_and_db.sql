/*
  # Fix Admin Policy to Check Both JWT and DB Role
  
  1. Problem
    - Admin needs to see all users but policy only checks JWT
    - If JWT is stale, admin won't see all users
    
  2. Solution
    - Check both JWT role AND database role
    - This ensures admins can see all users even with stale tokens
    
  3. Security
    - Still restrictive - only yonetici role has access
    - Regular users still restricted to their own data
*/

-- Drop existing select policy
DROP POLICY IF EXISTS "admin_select_all_users" ON users;

-- Create new policy that checks both JWT and DB
CREATE POLICY "admin_select_all_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Admin by JWT
    (auth.jwt()->>'role') = 'yonetici'
    -- OR Admin by database (for stale tokens)
    OR EXISTS (
      SELECT 1 FROM users admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.role = 'yonetici'
    )
    -- OR viewing own profile
    OR auth.uid() = id
  );
