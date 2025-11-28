/*
  # Fix Student Assignments Insert Policy

  1. Changes
    - Drop and recreate INSERT policy with correct JWT path
    - Admin users can create student-teacher assignments
    - Uses app_metadata -> role instead of direct role field

  2. Security
    - Only admin (yonetici) can create assignments
    - Prevents unauthorized assignment creation
*/

-- Drop existing INSERT policy with wrong JWT path
DROP POLICY IF EXISTS "Admins can create assignments" ON public.student_assignments;

-- Create new INSERT policy with correct JWT path
CREATE POLICY "Admins can create assignments" ON public.student_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'yonetici'
  );

-- Also add UPDATE policy for completeness
DROP POLICY IF EXISTS "Admins can update assignments" ON public.student_assignments;
CREATE POLICY "Admins can update assignments" ON public.student_assignments
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'yonetici'
  )
  WITH CHECK (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'yonetici'
  );
