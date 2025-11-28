/*
  # Remove All is_admin() Function Calls from RLS Policies

  1. Changes
    - Drop all policies that use is_admin() function
    - Create simpler policies without admin special handling
    - Admin operations will be done through security definer functions only
    
  2. Security
    - Users can only update/delete their own data
    - Admin operations go through dedicated security definer functions
    - This prevents infinite recursion during auth
    
  3. Note
    - Admins will use security definer functions for user management
    - Regular users maintain self-service capabilities
*/

-- Drop policies that use is_admin()
DROP POLICY IF EXISTS "Users can update own profile or admin can update all" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;

-- Create simple update policy (users can only update themselves)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No delete policy for regular users
-- Admins will use security definer function for deletions