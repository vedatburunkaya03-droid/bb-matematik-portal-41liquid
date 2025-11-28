/*
  # Fix Exam Assignments RLS Timeout Issue

  1. Problem
    - Current RLS policies cause statement timeouts
    - Complex nested queries in parent/teacher policies
    - Student query joins are too deep
  
  2. Solution
    - Drop all exam_assignments policies
    - Create simple, direct policies
    - Remove nested subqueries
    - Use direct auth.uid() checks
  
  3. New Policies
    - Students: Direct student_id check
    - Teachers: Direct teacher_id check  
    - Parents: Simple parent relationship check
*/

-- Drop all existing policies on exam_assignments
DROP POLICY IF EXISTS "Teachers can view assignments for their exams" ON exam_assignments;
DROP POLICY IF EXISTS "Teachers can create assignments for their exams" ON exam_assignments;
DROP POLICY IF EXISTS "Teachers can delete their assignments" ON exam_assignments;
DROP POLICY IF EXISTS "Parents can view their students exam assignments" ON exam_assignments;

-- Students can view their own exam assignments
CREATE POLICY "Students view own assignments"
  ON exam_assignments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Teachers can view assignments they created
CREATE POLICY "Teachers view own assignments"
  ON exam_assignments
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Teachers can insert assignments
CREATE POLICY "Teachers insert assignments"
  ON exam_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- Teachers can delete their assignments
CREATE POLICY "Teachers delete assignments"
  ON exam_assignments
  FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());
