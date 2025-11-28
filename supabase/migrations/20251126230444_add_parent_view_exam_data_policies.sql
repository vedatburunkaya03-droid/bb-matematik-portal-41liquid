/*
  # Add RLS Policies for Parents to View Student Exam Data
  
  1. Changes
    - Add policy for parents to view exam_assignments of their students
    - Add policy for parents to view exam_submissions of their students
    - Add policy for parents to view exams of their students
    
  2. Security
    - Parents can only view data for students assigned to them via parent_student_relationships
    - No data modification allowed, only read access
*/

-- Allow parents to view exam assignments of their students
CREATE POLICY "Parents can view their students exam assignments"
  ON exam_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM parent_student_relationships
      WHERE parent_student_relationships.student_id = exam_assignments.student_id
        AND parent_student_relationships.parent_id = auth.uid()
    )
  );

-- Allow parents to view exam submissions of their students
CREATE POLICY "Parents can view their students exam submissions"
  ON exam_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM parent_student_relationships
      WHERE parent_student_relationships.student_id = exam_submissions.student_id
        AND parent_student_relationships.parent_id = auth.uid()
    )
  );

-- Allow parents to view exams that their students are assigned to
CREATE POLICY "Parents can view their students exams"
  ON exams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM exam_assignments ea
      JOIN parent_student_relationships psr ON psr.student_id = ea.student_id
      WHERE ea.exam_id = exams.id
        AND psr.parent_id = auth.uid()
    )
  );
