/*
  # Sync User Roles to JWT Metadata

  1. Updates
    - Sync all user roles from public.users to auth.users.raw_app_meta_data
    - This ensures JWT tokens contain the role information for RLS policies

  2. Security
    - Uses SECURITY DEFINER function to update auth.users table
    - Only updates users that have a role assigned in public.users
*/

-- Create function to sync user role to JWT metadata
CREATE OR REPLACE FUNCTION sync_user_role_to_jwt()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update auth.users metadata when role changes
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-sync role changes
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.users;
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_jwt();

-- Sync all existing users with roles
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, role FROM public.users WHERE role IS NOT NULL
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_record.role)
    WHERE id = user_record.id;
  END LOOP;
END $$;
