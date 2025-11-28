/*
  # Fix Parent-Student Relationships Foreign Keys
  
  The parent_student_relationships table was created with references to auth.users
  but it should reference the custom users table instead.
  
  1. Changes
    - Drop existing table
    - Recreate with correct foreign key references to users table (not auth.users)
    - Re-add all RLS policies
    
  2. Security
    - Maintain all existing RLS policies
*/

-- Drop existing table and recreate with correct references
DROP TABLE IF EXISTS parent_student_relationships CASCADE;

-- Create parent_student_relationships table with correct references
CREATE TABLE parent_student_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Create indexes for better performance
CREATE INDEX idx_parent_student_parent ON parent_student_relationships(parent_id);
CREATE INDEX idx_parent_student_student ON parent_student_relationships(student_id);
