/*
  # Create Student Reports Table

  1. New Tables
    - `student_reports`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references auth.users)
      - `teacher_id` (uuid, references auth.users)
      - `processing_speed` (integer, 1-10 scale)
      - `motivation` (integer, 1-10 scale)
      - `compatibility` (integer, 1-10 scale)
      - `detailed_notes` (text)
      - `session_deducted` (boolean, tracks if session was deducted)
      - `parent_session_id` (uuid, references parent_sessions)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `student_reports` table
    - Teachers can create reports for their assigned students
    - Teachers can view their own reports
    - Parents can view reports about their children
    - Students can view their own reports
    - Admins have full access

  3. Indexes
    - Index on student_id for fast lookups
    - Index on teacher_id for fast lookups
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS student_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  processing_speed integer NOT NULL CHECK (processing_speed >= 1 AND processing_speed <= 10),
  motivation integer NOT NULL CHECK (motivation >= 1 AND motivation <= 10),
  compatibility integer NOT NULL CHECK (compatibility >= 1 AND compatibility <= 10),
  detailed_notes text NOT NULL,
  session_deducted boolean DEFAULT false,
  parent_session_id uuid REFERENCES parent_sessions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_student_reports_student_id ON student_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_student_reports_teacher_id ON student_reports(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_reports_created_at ON student_reports(created_at DESC);

CREATE POLICY "Teachers can create reports for assigned students"
  ON student_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'egitmen'
    AND EXISTS (
      SELECT 1 FROM student_assignments
      WHERE student_id = student_reports.student_id
      AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view their own reports"
  ON student_reports FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'egitmen'
    AND teacher_id = auth.uid()
  );

CREATE POLICY "Parents can view reports about their children"
  ON student_reports FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'veli'
    AND EXISTS (
      SELECT 1 FROM parent_student_relationships
      WHERE parent_id = auth.uid()
      AND student_id = student_reports.student_id
    )
  );

CREATE POLICY "Students can view their own reports"
  ON student_reports FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'ogrenci'
    AND student_id = auth.uid()
  );

CREATE POLICY "Admins have full access to reports"
  ON student_reports FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');