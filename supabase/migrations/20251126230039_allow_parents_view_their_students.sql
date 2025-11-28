/*
  # Allow Parents to View Their Students
  
  1. Changes
    - Add RLS policy for parents to view their assigned students' information
    - Parents can only see users who are their children via parent_student_relationships
    
  2. Security
    - Parents can only view students assigned to them
    - No other user data is exposed
*/

-- Allow parents to view their students
CREATE POLICY "Parents can view their students"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM parent_student_relationships
      WHERE parent_student_relationships.student_id = users.id
        AND parent_student_relationships.parent_id = auth.uid()
    )
  );
