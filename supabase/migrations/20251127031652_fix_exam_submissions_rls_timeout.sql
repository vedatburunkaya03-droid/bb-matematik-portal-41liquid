/*
  # Fix Exam Submissions RLS Timeout Issue

  1. Problem
    - Nested queries causing timeouts
    - Parent policies too complex
  
  2. Solution
    - Simplify all policies
    - Remove complex joins
    - Direct auth checks only
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Students can view their own submissions" ON exam_submissions;
DROP POLICY IF EXISTS "Parents can view their students exam submissions" ON exam_submissions;

-- Students can view their own submissions (simple check)
CREATE POLICY "Students view own submissions"
  ON exam_submissions
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Teachers can view submissions for their students
CREATE POLICY "Teachers view submissions"
  ON exam_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_assignments
      WHERE exam_assignments.id = exam_submissions.exam_assignment_id
        AND exam_assignments.teacher_id = auth.uid()
    )
  );
