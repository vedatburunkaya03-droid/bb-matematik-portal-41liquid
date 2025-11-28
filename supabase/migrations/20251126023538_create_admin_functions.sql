/*
  # Create Security Definer Functions for Admin Operations

  1. New Functions
    - get_all_users_admin(): Returns all users (admin only)
    - get_all_student_assignments_admin(): Returns all assignments (admin only)
    
  2. Security
    - Functions run with SECURITY DEFINER (bypass RLS)
    - Functions check if caller is admin before executing
    - Returns error if non-admin tries to call them
    
  3. Usage
    - Admin panel will call these functions instead of direct table queries
    - This avoids RLS recursion issues during login
*/

-- Function to check if current user is admin (safe, doesn't query users table in RLS context)
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'yonetici'
  );
END;
$$;

-- Function to get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Only administrators can access this function';
  END IF;
  
  -- Return all users
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.role, u.created_at
  FROM users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Function to get all student assignments (admin only)
CREATE OR REPLACE FUNCTION get_all_student_assignments_admin()
RETURNS TABLE (
  id uuid,
  student_id uuid,
  teacher_id uuid,
  assigned_by uuid,
  assigned_at timestamptz,
  student_email text,
  student_name text,
  teacher_email text,
  teacher_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Only administrators can access this function';
  END IF;
  
  -- Return all assignments with user details
  RETURN QUERY
  SELECT 
    sa.id,
    sa.student_id,
    sa.teacher_id,
    sa.assigned_by,
    sa.assigned_at,
    s.email as student_email,
    s.full_name as student_name,
    t.email as teacher_email,
    t.full_name as teacher_name
  FROM student_assignments sa
  LEFT JOIN users s ON sa.student_id = s.id
  LEFT JOIN users t ON sa.teacher_id = t.id
  ORDER BY sa.assigned_at DESC;
END;
$$;