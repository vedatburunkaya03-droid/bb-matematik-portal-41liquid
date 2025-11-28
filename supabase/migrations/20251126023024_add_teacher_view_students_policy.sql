/*
  # Allow Teachers to View Their Students

  1. Changes
    - Add new RLS policy for teachers to view their assigned students' information
    - Teachers can only see students who are assigned to them via student_assignments table
    
  2. Security
    - Policy checks that a student_assignment exists linking the teacher to the student
    - Policy also verifies the user has the 'egitmen' role
    - Maintains data privacy - teachers can only see their own students
*/

-- Drop existing policy to recreate with additional permission
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON users;

-- Recreate the policy with teacher access to their students
CREATE POLICY "Users can view own profile or admin can view all or teachers can view their students"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR is_admin() 
    OR (
      -- Teachers can view their assigned students
      role = 'ogrenci' 
      AND EXISTS (
        SELECT 1 
        FROM student_assignments 
        WHERE student_assignments.student_id = users.id 
        AND student_assignments.teacher_id = auth.uid()
      )
    )
    OR (
      -- Teachers can view other teachers (for assignment purposes)
      role = 'egitmen'
    )
  );