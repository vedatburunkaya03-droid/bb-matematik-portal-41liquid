/*
  # Add Admin User Management Functions

  1. New Functions
    - update_user_admin(user_id, updates): Update any user (admin only)
    - delete_user_admin(user_id): Delete any user (admin only)
    - assign_student_to_teacher_admin(student_id, teacher_id): Assign student (admin only)
    
  2. Security
    - All functions check if caller is admin
    - Functions use SECURITY DEFINER to bypass RLS
    - Raises exception if non-admin tries to call
    
  3. Usage
    - Admin panel uses these functions instead of direct queries
    - Prevents RLS recursion issues
*/

-- Function to update any user (admin only)
CREATE OR REPLACE FUNCTION update_user_admin(
  target_user_id uuid,
  new_full_name text DEFAULT NULL,
  new_role text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Only administrators can access this function';
  END IF;
  
  -- Update user
  UPDATE users
  SET 
    full_name = COALESCE(new_full_name, full_name),
    role = COALESCE(new_role, role)
  WHERE id = target_user_id;
END;
$$;

-- Function to delete any user (admin only)
CREATE OR REPLACE FUNCTION delete_user_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Only administrators can access this function';
  END IF;
  
  -- Delete student assignments first (foreign key)
  DELETE FROM student_assignments WHERE student_id = target_user_id OR teacher_id = target_user_id;
  
  -- Delete from auth.users (this will cascade to public.users if set up correctly)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Delete from public.users
  DELETE FROM users WHERE id = target_user_id;
END;
$$;

-- Function to assign student to teacher (admin only)
CREATE OR REPLACE FUNCTION assign_student_to_teacher_admin(
  p_student_id uuid,
  p_teacher_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assignment_id uuid;
BEGIN
  -- Check if user is admin
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Only administrators can access this function';
  END IF;
  
  -- Create assignment
  INSERT INTO student_assignments (student_id, teacher_id, assigned_by)
  VALUES (p_student_id, p_teacher_id, auth.uid())
  RETURNING id INTO assignment_id;
  
  RETURN assignment_id;
END;
$$;