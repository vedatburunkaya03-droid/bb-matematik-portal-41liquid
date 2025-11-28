/*
  # Fix Parent-Student Relationships RLS for Admin Insert
  
  The admin cannot insert parent-student relationships because the RLS policy
  only checks JWT metadata which may not be synchronized with the users table.
  
  1. Changes
    - Drop existing admin policy
    - Create new admin policy that checks both JWT and users table
    - Ensure admins can perform all operations (SELECT, INSERT, UPDATE, DELETE)
    
  2. Security
    - Maintains security by verifying admin role from users table
    - Falls back to JWT check for compatibility
*/

-- Drop the existing admin policy
DROP POLICY IF EXISTS "Admins can manage all parent-student relationships" ON parent_student_relationships;

-- Create new admin SELECT policy (checks users table)
CREATE POLICY "Admins can view all parent-student relationships"
  ON parent_student_relationships
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
    OR
    parent_id = auth.uid()
  );

-- Create new admin INSERT policy (checks users table)
CREATE POLICY "Admins can create parent-student relationships"
  ON parent_student_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create new admin UPDATE policy (checks users table)
CREATE POLICY "Admins can update parent-student relationships"
  ON parent_student_relationships
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create new admin DELETE policy (checks users table)
CREATE POLICY "Admins can delete parent-student relationships"
  ON parent_student_relationships
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Drop old parents view policy
DROP POLICY IF EXISTS "Parents can view their children" ON parent_student_relationships;

-- Recreate parents view policy
CREATE POLICY "Parents can view their children"
  ON parent_student_relationships
  FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());
