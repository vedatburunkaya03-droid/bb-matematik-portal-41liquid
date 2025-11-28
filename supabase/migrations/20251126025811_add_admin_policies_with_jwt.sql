/*
  # Add Admin Policies Using JWT

  1. Problem
    - Admin users cannot see all users and assignments
    - Cannot use users table in policy for users table (causes recursion)
    
  2. Solution
    - Store role in auth.users raw_app_meta_data
    - Use auth.jwt() to check role from JWT token
    - No recursion because we're not querying users table
    
  3. Changes
    - First, update all existing users to have role in app_metadata
    - Add admin policies using auth.jwt()
    
  4. Security
    - app_metadata cannot be changed by users
    - Only backend/admin can modify it
    - Safe to use for authorization
*/

-- Update all existing users' auth.users app_metadata with their role
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, role FROM users WHERE role IS NOT NULL
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_record.role)
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Create function to sync role to auth.users when updated
CREATE OR REPLACE FUNCTION sync_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-sync role changes
DROP TRIGGER IF EXISTS sync_role_to_auth_trigger ON users;
CREATE TRIGGER sync_role_to_auth_trigger
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_to_auth();

-- Now add admin policies using JWT
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'yonetici');

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'yonetici')
  WITH CHECK (auth.jwt()->>'role' = 'yonetici');

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (auth.jwt()->>'role' = 'yonetici');

-- Admin policies for student_assignments
CREATE POLICY "Admins can view all assignments"
  ON student_assignments FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'yonetici');

CREATE POLICY "Admins can create assignments"
  ON student_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' = 'yonetici');

CREATE POLICY "Admins can delete assignments"
  ON student_assignments FOR DELETE
  TO authenticated
  USING (auth.jwt()->>'role' = 'yonetici');