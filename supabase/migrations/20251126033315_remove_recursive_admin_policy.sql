/*
  # Remove Recursive Admin Policy
  
  1. Problem
    - Previous policy created infinite recursion by querying users table within policy
    - This breaks all authentication
    
  2. Solution
    - Use only JWT role check (no subquery)
    - Rely on JWT token for admin verification
    
  3. Security
    - Admins verified by JWT token
    - Regular users can only see themselves
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "admin_select_all_users" ON users;

-- Create simple, non-recursive policy
CREATE POLICY "admin_select_all_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Admin by JWT can see all
    (auth.jwt()->>'role') = 'yonetici'
    -- Regular users can only see themselves
    OR auth.uid() = id
  );
