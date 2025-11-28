/*
  # Create Parent Sessions Management System

  1. New Tables
    - `parent_sessions`
      - `id` (uuid, primary key)
      - `parent_id` (uuid, foreign key to users)
      - `sessions_total` (integer) - Total sessions assigned (5, 8, 20, 40)
      - `sessions_used` (integer) - Number of sessions used
      - `sessions_remaining` (integer) - Calculated: total - used
      - `assigned_by` (uuid, foreign key to users) - Admin who assigned
      - `assigned_at` (timestamp)
      - `notes` (text, optional)

  2. Security
    - Enable RLS on `parent_sessions` table
    - Admins can insert, update, delete, and select all sessions
    - Parents can only view their own sessions

  3. Indexes
    - Index on parent_id for fast lookups
*/

-- Create parent_sessions table
CREATE TABLE IF NOT EXISTS parent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sessions_total integer NOT NULL CHECK (sessions_total > 0),
  sessions_used integer NOT NULL DEFAULT 0 CHECK (sessions_used >= 0),
  assigned_by uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sessions_used_not_greater_than_total CHECK (sessions_used <= sessions_total)
);

-- Create index for faster parent lookups
CREATE INDEX IF NOT EXISTS idx_parent_sessions_parent_id ON parent_sessions(parent_id);

-- Enable RLS
ALTER TABLE parent_sessions ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage all sessions"
  ON parent_sessions
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'yonetici'
  )
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'yonetici'
  );

-- Parents can view their own sessions
CREATE POLICY "Parents can view own sessions"
  ON parent_sessions
  FOR SELECT
  TO authenticated
  USING (
    parent_id = auth.uid() AND
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'veli'
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_parent_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER set_parent_sessions_updated_at
  BEFORE UPDATE ON parent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_sessions_updated_at();
