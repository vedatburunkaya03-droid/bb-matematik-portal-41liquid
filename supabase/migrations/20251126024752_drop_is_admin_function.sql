/*
  # Drop is_admin() Function

  1. Changes
    - Drop the old is_admin() function that causes recursion
    - Keep check_is_admin() which is SECURITY DEFINER and safe
    
  2. Reason
    - is_admin() was causing infinite recursion in RLS policies
    - All policies now removed, so function is no longer needed
    - check_is_admin() is the safe alternative for security definer functions
*/

-- Drop the problematic is_admin() function
DROP FUNCTION IF EXISTS is_admin();