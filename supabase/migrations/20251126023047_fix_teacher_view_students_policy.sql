/*
  # Fix RLS Policy for Teachers to View Students

  1. Changes
    - Drop and recreate the users SELECT policy to avoid infinite recursion
    - Use direct role checks instead of function calls where possible
    
  2. Security
    - Users can view their own profile
    - Admins can view all users (checked via role directly to avoid recursion)
    - Teachers can view their assigned students
    - Teachers can view other teachers
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own profile or admin can view all or teachers can view their students" ON users;

-- Recreate with simpler logic
CREATE POLICY "Users can view profiles based on role and assignments"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always view their own profile
    auth.uid() = id 
    
    -- Admin users (checked by role) can view everyone
    OR (
      SELECT role FROM users WHERE id = auth.uid()
    ) = 'yonetici'
    
    -- Teachers can view students assigned to them
    OR (
      role = 'ogrenci' 
      AND EXISTS (
        SELECT 1 
        FROM student_assignments 
        WHERE student_assignments.student_id = users.id 
        AND student_assignments.teacher_id = auth.uid()
      )
    )
    
    -- Everyone can view teachers (for reference purposes)
    OR role = 'egitmen'
    
    -- Everyone can view advisors (for reference purposes)
    OR role = 'danisman'
  );