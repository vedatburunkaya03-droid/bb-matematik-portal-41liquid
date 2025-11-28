/*
  # Add Teacher View Students Policy

  1. Changes
    - Add policy for teachers to view their assigned students
    - Teachers can read user info for students assigned to them via student_assignments
    - Maintains privacy: teachers only see their own students

  2. Security
    - Teachers can only view students explicitly assigned to them
    - Uses JOIN with student_assignments table to verify relationship
    - No access to other users
*/

-- Add policy for teachers to view their assigned students
CREATE POLICY "Teachers can view assigned students" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    -- Teachers can view students assigned to them
    EXISTS (
      SELECT 1 
      FROM public.student_assignments
      WHERE student_assignments.student_id = users.id
        AND student_assignments.teacher_id = auth.uid()
    )
  );
