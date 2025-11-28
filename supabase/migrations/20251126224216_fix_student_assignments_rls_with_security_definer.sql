/*
  # Fix Student Assignments RLS with Security Definer
  
  Apply the same security definer approach to student_assignments table
  to prevent RLS recursion issues.
  
  1. Changes
    - Update all student_assignments policies to use is_admin_user function
    - Simplify policies to avoid cross-table recursion
    
  2. Security
    - Uses existing is_admin_user function
    - Maintains proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can create assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can update assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can delete assignments" ON student_assignments;
DROP POLICY IF EXISTS "Teachers can view their students assignments" ON student_assignments;
DROP POLICY IF EXISTS "Students can view their own assignments" ON student_assignments;

-- Create new simplified policies
CREATE POLICY "Admins can view all assignments"
  ON student_assignments
  FOR SELECT
  TO authenticated
  USING (
    is_admin_user(auth.uid()) 
    OR teacher_id = auth.uid() 
    OR student_id = auth.uid()
  );

CREATE POLICY "Admins can create assignments"
  ON student_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update assignments"
  ON student_assignments
  FOR UPDATE
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete assignments"
  ON student_assignments
  FOR DELETE
  TO authenticated
  USING (is_admin_user(auth.uid()));
