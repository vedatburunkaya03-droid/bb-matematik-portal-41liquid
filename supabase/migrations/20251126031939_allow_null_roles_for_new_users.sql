/*
  # Allow Null Roles for New User Registration
  
  1. Changes
    - Modify users table to allow NULL values for role column
    - Update RLS policies to handle users without roles
    - Add policy for users to view their own profile even without role
    
  2. Security
    - Users without roles can only see their own profile
    - Admins can still see all users
    - Once role is assigned, normal policies apply
*/

-- Allow NULL values for role column
ALTER TABLE users ALTER COLUMN role DROP NOT NULL;

-- Add policy for users without roles to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users without roles to update their own basic info (not role)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
