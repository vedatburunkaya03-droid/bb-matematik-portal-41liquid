/*
  # Add Parent Access to Exam Data

  1. Purpose
    - Allow parents to view their students' exam submissions
    - Allow parents to view exam assignments
    - Allow parents to view exam details
  
  2. Policies
    - Simple parent_student_relationships check
    - No complex nested queries
*/

-- Parents can view their students' exam assignments
CREATE POLICY "Parents view students assignments"
  ON exam_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_student_relationships
      WHERE parent_student_relationships.student_id = exam_assignments.student_id
        AND parent_student_relationships.parent_id = auth.uid()
    )
  );

-- Parents can view their students' exam submissions  
CREATE POLICY "Parents view students submissions"
  ON exam_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_student_relationships
      WHERE parent_student_relationships.student_id = exam_submissions.student_id
        AND parent_student_relationships.parent_id = auth.uid()
    )
  );

-- Parents can view exams of their students
CREATE POLICY "Parents view students exams"
  ON exams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_assignments
      JOIN parent_student_relationships 
        ON parent_student_relationships.student_id = exam_assignments.student_id
      WHERE exam_assignments.exam_id = exams.id
        AND parent_student_relationships.parent_id = auth.uid()
    )
  );
