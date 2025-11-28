/*
  # Add Admin Full Access Policies

  1. Problem
    - Admin users cannot see all users in the system
    - Admin users cannot see student assignments
    - Current policies only allow users to see their own data
    
  2. Solution
    - Add policies for admins to view all users
    - Add policies for admins to view, insert, update, delete student assignments
    - Keep existing policies for non-admin users
    
  3. Changes
    - Add "Admins can view all users" policy to users table
    - Add "Admins can view all assignments" policy to student_assignments
    - Add "Admins can create assignments" policy to student_assignments
    - Add "Admins can delete assignments" policy to student_assignments
*/

-- Allow admins to view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'yonetici'
    )
  );

-- Allow admins to view all student assignments
CREATE POLICY "Admins can view all assignments"
  ON student_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'yonetici'
    )
  );

-- Allow admins to create student assignments
CREATE POLICY "Admins can create assignments"
  ON student_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'yonetici'
    )
  );

-- Allow admins to delete student assignments
CREATE POLICY "Admins can delete assignments"
  ON student_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'yonetici'
    )
  );

-- Allow admins to update any user's role
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'yonetici'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'yonetici'
    )
  );

-- Allow admins to delete users
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'yonetici'
    )
  );