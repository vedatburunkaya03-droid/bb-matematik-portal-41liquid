/*
  # Allow students to read answer keys for their assigned exams
  
  This migration adds RLS policy allowing students to read answer keys
  for exams that have been assigned to them. This is necessary for
  the auto-grading functionality to work.
  
  1. Changes
    - Add SELECT policy for students to read answer keys of their assigned exams
  
  2. Security
    - Students can ONLY read answer keys for exams assigned to them
    - Students CANNOT read keys for unassigned exams
    - Students can ONLY read (SELECT), not modify
*/

-- Allow students to read answer keys for their assigned exams
CREATE POLICY "Students can view answer keys for assigned exams"
  ON exam_answer_keys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM exam_assignments 
      WHERE exam_assignments.exam_id = exam_answer_keys.exam_id
        AND exam_assignments.student_id = auth.uid()
    )
  );
