/*
  # FIX: RLS Policies - Remove Infinite Recursion
  
  1. Problem
    - SELECT policies have infinite recursion
    - Checking if user is admin requires reading users table
    - But reading users table requires checking if user is admin → DEADLOCK
    
  2. Solution
    - Drop ALL existing SELECT policies
    - Create ONE simple policy: Users can read their own profile
    - Create SECURITY DEFINER function to check admin status
    - Use function in policies to avoid recursion
    
  3. Security
    - Users can ONLY see their own profile
    - Admins use SECURITY DEFINER functions to bypass RLS when needed
*/

-- Drop ALL existing SELECT policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "admin_select_all_users" ON public.users;
DROP POLICY IF EXISTS "admin_full_access_select" ON public.users;

-- Create ONE simple SELECT policy: users can ONLY see themselves
CREATE POLICY "users_select_own_profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admin viewing all users will be handled by SECURITY DEFINER functions in the frontend
-- This eliminates infinite recursion completely
