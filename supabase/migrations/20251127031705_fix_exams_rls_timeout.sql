/*
  # Fix Exams RLS Timeout Issue

  1. Problem
    - Complex nested queries in student/parent policies
  
  2. Solution
    - Simplify to direct checks
    - Remove nested EXISTS
*/

-- Drop existing complex policies
DROP POLICY IF EXISTS "Teachers can view their own exams" ON exams;
DROP POLICY IF EXISTS "Parents can view their students exams" ON exams;

-- Teachers view their own exams
CREATE POLICY "Teachers view own exams"
  ON exams
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Students view exams assigned to them
CREATE POLICY "Students view assigned exams"
  ON exams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_assignments
      WHERE exam_assignments.exam_id = exams.id
        AND exam_assignments.student_id = auth.uid()
    )
  );
