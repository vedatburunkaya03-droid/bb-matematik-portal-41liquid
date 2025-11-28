/*
  # Complete RLS Reset for Admin Access
  
  1. Problem
    - Multiple conflicting policies causing admins to not see all users
    - Need clean slate with proper admin access
    
  2. Changes
    - Drop ALL existing policies
    - Create single set of clean policies
    - Ensure admins see all 18 users
    
  3. Security
    - Admins (JWT role='yonetici') see everything
    - Regular users see only themselves
*/

-- Drop ALL existing policies completely
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Everyone can view teachers and advisors" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create brand new policies with unique names
CREATE POLICY "admin_select_all_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role') = 'yonetici'
    OR auth.uid() = id
  );

CREATE POLICY "admin_insert_users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'role') = 'yonetici');

CREATE POLICY "admin_update_users"
  ON users
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'role') = 'yonetici' OR auth.uid() = id)
  WITH CHECK ((auth.jwt()->>'role') = 'yonetici' OR auth.uid() = id);

CREATE POLICY "admin_delete_users"
  ON users
  FOR DELETE
  TO authenticated
  USING ((auth.jwt()->>'role') = 'yonetici');
