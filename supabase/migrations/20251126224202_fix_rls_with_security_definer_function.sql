/*
  # Fix RLS with Security Definer Function
  
  The RLS policies are causing infinite recursion because they check the users table,
  which itself has RLS policies. We need a SECURITY DEFINER function that bypasses RLS.
  
  1. Changes
    - Create a SECURITY DEFINER function to check admin role
    - Update parent_student_relationships policies to use this function
    - This function runs with elevated privileges and bypasses RLS
    
  2. Security
    - Function is SECURITY DEFINER but only checks role, safe operation
    - Only returns boolean, no sensitive data exposed
*/

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Bypass RLS by using SECURITY DEFINER
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;
  
  RETURN user_role = 'admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Drop all existing policies on parent_student_relationships
DROP POLICY IF EXISTS "Admins can view all parent-student relationships" ON parent_student_relationships;
DROP POLICY IF EXISTS "Admins can create parent-student relationships" ON parent_student_relationships;
DROP POLICY IF EXISTS "Admins can update parent-student relationships" ON parent_student_relationships;
DROP POLICY IF EXISTS "Admins can delete parent-student relationships" ON parent_student_relationships;
DROP POLICY IF EXISTS "Parents can view their children" ON parent_student_relationships;

-- Create new policies using the security definer function
CREATE POLICY "Admins and parents can view relationships"
  ON parent_student_relationships
  FOR SELECT
  TO authenticated
  USING (
    is_admin_user(auth.uid()) OR parent_id = auth.uid()
  );

CREATE POLICY "Admins can create relationships"
  ON parent_student_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update relationships"
  ON parent_student_relationships
  FOR UPDATE
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete relationships"
  ON parent_student_relationships
  FOR DELETE
  TO authenticated
  USING (is_admin_user(auth.uid()));
