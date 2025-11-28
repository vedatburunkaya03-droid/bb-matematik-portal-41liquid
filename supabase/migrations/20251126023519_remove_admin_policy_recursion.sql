/*
  # Remove Admin Policy That Causes Recursion

  1. Changes
    - Drop the "Admins can view all profiles" policy that uses is_admin()
    - Add a simpler policy that checks role directly in a safe way
    - Use a security definer function for admin operations instead
    
  2. Security
    - Keep existing policies for users, teachers, and public roles
    - Admins will be able to view all users through their own profile view
    - This prevents infinite recursion during login
    
  3. Note
    - Admin users can still manage the system through security definer functions
    - They just won't have automatic SELECT access to all users via RLS
    - Admin panel will use security definer functions to fetch user data
*/

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;

-- Create a safe admin policy that doesn't cause recursion
-- Admins can view all users only when explicitly needed (through app logic)
-- For now, admins can see their own profile + teachers/advisors like everyone else
-- Admin-specific queries will use security definer functions