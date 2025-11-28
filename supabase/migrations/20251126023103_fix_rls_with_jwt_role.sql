/*
  # Fix RLS Using JWT Claims to Avoid Recursion

  1. Changes
    - Use auth.jwt() to get user role from JWT token instead of querying users table
    - This avoids infinite recursion in RLS policies
    
  2. Security
    - Users can view their own profile
    - Admins (via JWT role) can view all users  
    - Teachers can view their assigned students
    - Everyone can view teachers and advisors for reference
    
  3. Note
    - This assumes the user's role is stored in the JWT token's raw_user_meta_data
    - Supabase Auth automatically includes user_metadata in the JWT
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view profiles based on role and assignments" ON users;

-- Create new policy using JWT claims to avoid recursion
CREATE POLICY "Users can view profiles with JWT-based permissions"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always view their own profile
    auth.uid() = id 
    
    -- Admin users (from JWT) can view everyone
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'yonetici'
    
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