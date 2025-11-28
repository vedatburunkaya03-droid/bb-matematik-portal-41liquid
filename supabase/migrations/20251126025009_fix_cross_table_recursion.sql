/*
  # Fix Cross-Table RLS Recursion

  1. Problem
    - users table policy queries student_assignments
    - student_assignments policies query users table
    - This creates infinite recursion loop
    
  2. Solution
    - Remove ALL cross-table queries from policies
    - Keep policies simple with only direct column checks
    - Use auth.uid() for access control
    
  3. Changes
    - Drop "Teachers can view assigned students" from users
    - Drop "Students can view their teachers" from student_assignments
    - Drop "Teachers can view their students" from student_assignments
    - Keep only simple self-reference policies
*/

-- Remove cross-referencing policy from users table
DROP POLICY IF EXISTS "Teachers can view assigned students" ON users;

-- Remove cross-referencing policies from student_assignments table
DROP POLICY IF EXISTS "Students can view their teachers" ON student_assignments;
DROP POLICY IF EXISTS "Teachers can view their students" ON student_assignments;

-- These simple policies remain and work fine:
-- users: "Users can view own profile" (auth.uid() = id)
-- users: "Everyone can view teachers and advisors" (role IN ('egitmen', 'danisman'))
-- student_assignments: "Teachers can view own assignments" (teacher_id = auth.uid())
-- student_assignments: "Students can view own assignments" (student_id = auth.uid())