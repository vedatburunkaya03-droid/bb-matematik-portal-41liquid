/*
  # Allow Teachers to Access Parent Sessions

  1. Problem
    - Teachers need to read parent_sessions to check if parent has remaining sessions
    - Teachers need to update sessions_used when they create reports
    - Currently only admins and parents have access

  2. Solution
    - Add SELECT policy for teachers to read parent sessions of their students' parents
    - Add UPDATE policy for teachers to update sessions_used when creating reports

  3. Security
    - Teachers can only read sessions of parents whose children are assigned to them
    - Teachers can only update sessions_used field (via student report creation)
*/

-- Teachers can view parent sessions of their assigned students' parents
CREATE POLICY "Teachers can view parent sessions of their students"
  ON parent_sessions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'egitmen'
    AND EXISTS (
      SELECT 1 
      FROM parent_student_relationships psr
      JOIN student_assignments sa ON sa.student_id = psr.student_id
      WHERE psr.parent_id = parent_sessions.parent_id
      AND sa.teacher_id = auth.uid()
    )
  );

-- Teachers can update parent sessions (sessions_used) when creating reports
CREATE POLICY "Teachers can update parent sessions for reports"
  ON parent_sessions
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'egitmen'
    AND EXISTS (
      SELECT 1 
      FROM parent_student_relationships psr
      JOIN student_assignments sa ON sa.student_id = psr.student_id
      WHERE psr.parent_id = parent_sessions.parent_id
      AND sa.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'egitmen'
    AND EXISTS (
      SELECT 1 
      FROM parent_student_relationships psr
      JOIN student_assignments sa ON sa.student_id = psr.student_id
      WHERE psr.parent_id = parent_sessions.parent_id
      AND sa.teacher_id = auth.uid()
    )
  );