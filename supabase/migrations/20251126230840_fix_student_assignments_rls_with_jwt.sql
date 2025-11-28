/*
  # Fix Student Assignments RLS Policies
  
  1. Changes
    - Drop all policies that use the deleted is_admin_user() function
    - Create new policies using JWT-based admin checks
    - Ensure admins can fully manage student assignments
    
  2. Security
    - Only users with role 'yonetici' in JWT can manage assignments
    - Teachers can view their own assignments
    - Students can view their own assignments
*/

-- Drop all existing policies that use is_admin_user
DROP POLICY IF EXISTS "Admins can create assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can update assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can delete assignments" ON student_assignments;

-- Allow admins to create assignments using JWT check
CREATE POLICY "Admins can create assignments"
  ON student_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'yonetici')
  );

-- Allow admins, teachers (their assignments), and students (their assignments) to view
CREATE POLICY "View assignments"
  ON student_assignments
  FOR SELECT
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'yonetici')
    OR (teacher_id = auth.uid())
    OR (student_id = auth.uid())
  );

-- Allow admins to update assignments
CREATE POLICY "Admins can update assignments"
  ON student_assignments
  FOR UPDATE
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'yonetici')
  )
  WITH CHECK (
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'yonetici')
  );

-- Allow admins to delete assignments
CREATE POLICY "Admins can delete assignments"
  ON student_assignments
  FOR DELETE
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'yonetici')
  );
