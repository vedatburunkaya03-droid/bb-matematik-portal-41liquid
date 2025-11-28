/*
  # Create Parent-Student Relationships System
  
  1. New Tables
    - `parent_student_relationships`
      - `id` (uuid, primary key)
      - `parent_id` (uuid, references auth.users)
      - `student_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on parent_student_relationships table
    - Parents can view their own relationships
    - Parents can view exam results of their children
    - Admins can manage all relationships
    
  3. Notes
    - A parent can have multiple children
    - A student can have multiple parents
    - Used to control access to student exam results
*/

-- Create parent_student_relationships table
CREATE TABLE IF NOT EXISTS parent_student_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- Enable RLS
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;

-- Parents can view their own relationships
CREATE POLICY "Parents can view their children"
  ON parent_student_relationships
  FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

-- Admins can manage all relationships
CREATE POLICY "Admins can manage all parent-student relationships"
  ON parent_student_relationships
  FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Parents can view their children's exam assignments
CREATE POLICY "Parents can view children exam assignments"
  ON exam_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM parent_student_relationships 
      WHERE parent_student_relationships.student_id = exam_assignments.student_id
        AND parent_student_relationships.parent_id = auth.uid()
    )
  );

-- Parents can view their children's exam submissions
CREATE POLICY "Parents can view children exam submissions"
  ON exam_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM exam_assignments ea
      JOIN parent_student_relationships psr ON psr.student_id = ea.student_id
      WHERE ea.id = exam_submissions.exam_assignment_id
        AND psr.parent_id = auth.uid()
    )
  );

-- Parents can view basic user info of their children
CREATE POLICY "Parents can view children user info"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM parent_student_relationships 
      WHERE parent_student_relationships.student_id = users.id
        AND parent_student_relationships.parent_id = auth.uid()
    )
  );

-- Parents can view exams assigned to their children
CREATE POLICY "Parents can view children exams"
  ON exams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM exam_assignments ea
      JOIN parent_student_relationships psr ON psr.student_id = ea.student_id
      WHERE ea.exam_id = exams.id
        AND psr.parent_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON parent_student_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON parent_student_relationships(student_id);
