/*
  # Create Admin Function to Get All Users
  
  1. New Function
    - `get_all_users_as_admin()` - Returns all users if caller is admin
    - SECURITY DEFINER - Bypasses RLS
    - Only executes if caller has 'yonetici' role
    
  2. Security
    - Checks caller's role from public.users table
    - Returns error if not admin
    - Bypasses RLS to read all users
*/

-- Drop existing function if any
DROP FUNCTION IF EXISTS public.get_all_users_as_admin();

-- Create function to get all users (admin only)
CREATE OR REPLACE FUNCTION public.get_all_users_as_admin()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Get caller's role
  SELECT u.role INTO caller_role
  FROM public.users u
  WHERE u.id = auth.uid();
  
  -- Check if caller is admin
  IF caller_role != 'yonetici' THEN
    RAISE EXCEPTION 'Only admins can view all users';
  END IF;
  
  -- Return all users
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.role, u.created_at, u.updated_at
  FROM public.users u
  ORDER BY u.created_at DESC;
END;
$$;
