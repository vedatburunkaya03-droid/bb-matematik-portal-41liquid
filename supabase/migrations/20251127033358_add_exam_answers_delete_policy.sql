/*
  # Add Delete Policy for Exam Answers

  1. Purpose
    - Allow students to delete their own answers before final submission
    - This is needed when re-submitting exams
  
  2. Policy
    - Students can delete answers from their own submissions
*/

-- Students can delete their own answers
CREATE POLICY "Students delete own answers"
  ON exam_answers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_submissions
      WHERE exam_submissions.id = exam_answers.submission_id
        AND exam_submissions.student_id = auth.uid()
    )
  );
