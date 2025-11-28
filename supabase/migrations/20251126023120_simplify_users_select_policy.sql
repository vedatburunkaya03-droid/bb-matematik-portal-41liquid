/*
  # Simplify Users SELECT Policy

  1. Changes
    - Create separate policies for different scenarios to avoid recursion
    - Use multiple simple policies instead of one complex policy
    
  2. Security
    - Policy 1: Users can view their own profile
    - Policy 2: Teachers can view students assigned to them
    - Policy 3: Everyone can view teachers and advisors (public roles)
    
  3. Notes
    - Multiple policies with OR logic (default) are safer than complex USING clauses
    - Admin access will be handled separately with security definer functions
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view profiles with JWT-based permissions" ON users;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Teachers can view their assigned students
CREATE POLICY "Teachers can view assigned students"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    role = 'ogrenci' 
    AND EXISTS (
      SELECT 1 
      FROM student_assignments 
      WHERE student_assignments.student_id = users.id 
      AND student_assignments.teacher_id = auth.uid()
    )
  );

-- Policy 3: Everyone can view teachers and advisors (for reference)
CREATE POLICY "Everyone can view teachers and advisors"
  ON users
  FOR SELECT
  TO authenticated
  USING (role IN ('egitmen', 'danisman'));

-- Policy 4: Admins can view all profiles using security definer function
CREATE POLICY "Admins can view all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (is_admin());