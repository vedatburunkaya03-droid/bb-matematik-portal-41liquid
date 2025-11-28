/*
  # Remove is_admin() from Student Assignments Policies

  1. Changes
    - Drop all policies using is_admin() on student_assignments table
    - Create simpler policies without admin special handling
    - Admin operations will use security definer functions
    
  2. Security
    - Teachers can view their own assignments
    - Students can view assignments where they are assigned
    - No direct insert/update/delete for regular users
    - Admins use security definer functions for management
    
  3. Note
    - This prevents infinite recursion in RLS
    - Admin panel will call dedicated functions for assignment management
*/

-- Drop all admin policies on student_assignments
DROP POLICY IF EXISTS "Admins can view all assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can insert assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can update assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can delete assignments" ON student_assignments;

-- Recreate simple policies without is_admin()
-- Teachers can view assignments where they are the teacher
CREATE POLICY "Teachers can view own assignments"
  ON student_assignments FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Students can view assignments where they are the student
CREATE POLICY "Students can view own assignments"
  ON student_assignments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for regular users
-- These operations will be done through security definer functions