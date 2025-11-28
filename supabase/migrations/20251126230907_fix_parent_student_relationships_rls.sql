/*
  # Fix Parent-Student Relationships RLS Policies
  
  1. Changes
    - Remove overly permissive "Anyone can view relationships" policy
    - Add proper policies for admins, parents, teachers, and students
    - Add INSERT policy for admins to create relationships
    - Add DELETE policy for admins to remove relationships
    
  2. Security
    - Only admins can create/delete relationships
    - Parents can view their own relationships
    - Teachers can view relationships for their students
    - Students can view their own parent relationships
*/

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view relationships for display" ON parent_student_relationships;

-- Keep the existing parent policy
-- DROP POLICY IF EXISTS "Parents can view their relationships" ON parent_student_relationships;

-- Add admin INSERT policy
CREATE POLICY "Admins can create parent-student relationships"
  ON parent_student_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'yonetici')
  );

-- Add comprehensive SELECT policy
CREATE POLICY "View parent-student relationships"
  ON parent_student_relationships
  FOR SELECT
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'yonetici')
    OR (parent_id = auth.uid())
    OR (student_id = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM student_assignments
      WHERE student_assignments.student_id = parent_student_relationships.student_id
        AND student_assignments.teacher_id = auth.uid()
    )
  );

-- Add admin DELETE policy
CREATE POLICY "Admins can delete parent-student relationships"
  ON parent_student_relationships
  FOR DELETE
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'yonetici')
  );
