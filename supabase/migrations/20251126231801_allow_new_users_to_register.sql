/*
  # Allow New Users to Register
  
  1. Changes
    - Add INSERT policy to allow new users to create their own profile during registration
    - Users can only insert their own profile (matching auth.uid())
    
  2. Security
    - Users can only create a profile for themselves
    - Admins can still create profiles for others
    - Role must be null on self-registration (admin assigns roles later)
*/

-- Allow new users to create their own profile during registration
CREATE POLICY "Users can create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid() AND role IS NULL
  );
