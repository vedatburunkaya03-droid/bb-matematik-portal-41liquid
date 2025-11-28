/*
  # Auto-create user profiles on auth signup
  
  1. Changes
    - Create a trigger function to automatically create user profiles in public.users
    - Trigger fires after INSERT on auth.users
    - Extracts full_name from raw_user_meta_data
    - Sets role to NULL (admin assigns roles later)
    
  2. Security
    - Trigger runs with SECURITY DEFINER (bypasses RLS)
    - Only creates profile if it doesn't already exist
    - No user input, fully automated
    
  3. Benefits
    - Eliminates orphaned auth.users records
    - No more "user already exists" errors
    - Atomic operation: auth user + profile created together
*/

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create trigger function to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULL,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
