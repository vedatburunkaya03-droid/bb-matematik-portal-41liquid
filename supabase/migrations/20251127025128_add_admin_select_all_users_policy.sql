/*
  # ADD ADMIN SELECT POLICY FOR USERS TABLE
  
  1. Problem
    - Admin cannot view all users in admin panel
    - Only SELECT policies are: own profile, assigned students, parent's students
    - Missing admin SELECT ALL policy
  
  2. Solution
    - Add SELECT policy for admins to view ALL users
    
  3. Security
    - Only users with 'yonetici' role in JWT can view all users
*/

-- Add admin SELECT policy to view all users
CREATE POLICY "admin_select_all_users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'yonetici'
  );
