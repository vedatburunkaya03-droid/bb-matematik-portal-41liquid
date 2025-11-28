/*
  # Remove Problematic Admin Policies
  
  1. Problem
    - Previous admin policies cause recursion
    - They query the users table while defining policy on users table
    
  2. Solution
    - Remove all the newly added admin policies
    - Will use a different approach with security definer functions
*/

DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can view all assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can create assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can delete assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;