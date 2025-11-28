/*
  # Simplify Authentication System

  1. Changes
    - Make role column NOT NULL with default value 'ogrenci'
    - Update existing null roles to 'ogrenci'
    - Update trigger to always set role in app_metadata
    
  2. Reasoning
    - New users get 'ogrenci' role by default
    - No more "waiting for role assignment" state
    - Simplified login flow
    - Admin can still change roles later
*/

-- Update any existing users with null role to 'ogrenci'
UPDATE users SET role = 'ogrenci' WHERE role IS NULL;

-- Make role column NOT NULL with default
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'ogrenci';
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

-- Update the trigger function to handle new users properly
CREATE OR REPLACE FUNCTION sync_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure role is never null
  IF NEW.role IS NULL THEN
    NEW.role := 'ogrenci';
  END IF;
  
  -- Sync to auth metadata
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;