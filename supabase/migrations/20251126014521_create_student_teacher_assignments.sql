/*
  # Öğrenci-Eğitmen Atama Sistemi

  1. Yeni Tablo
    - `student_assignments`
      - `id` (uuid, primary key): Atamanın benzersiz kimliği
      - `student_id` (uuid, foreign key): Öğrencinin ID'si
      - `teacher_id` (uuid, foreign key): Eğitmenin ID'si
      - `assigned_by` (uuid, foreign key): Atamayı yapan yöneticinin ID'si
      - `assigned_at` (timestamptz): Atama zamanı
      - `created_at` (timestamptz): Kayıt oluşturulma zamanı
      - `updated_at` (timestamptz): Son güncelleme zamanı
  
  2. İndeksler
    - student_id ve teacher_id için indeksler (hızlı sorgulama)
    - Aynı öğrenci-eğitmen çifti için unique constraint
  
  3. Güvenlik
    - RLS aktif
    - Yöneticiler tüm atamaları görebilir ve yönetebilir
    - Eğitmenler sadece kendilerine atanmış öğrencileri görebilir
    - Öğrenciler kendi eğitmenlerini görebilir
*/

-- student_assignments tablosunu oluştur
CREATE TABLE IF NOT EXISTS student_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, teacher_id)
);

-- İndeksler ekle
CREATE INDEX IF NOT EXISTS idx_student_assignments_student_id ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_teacher_id ON student_assignments(teacher_id);

-- RLS'i aktifleştir
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- Yöneticiler tüm atamaları görebilir
CREATE POLICY "Admins can view all assignments"
  ON student_assignments FOR SELECT
  TO authenticated
  USING (is_admin());

-- Eğitmenler kendi öğrencilerini görebilir
CREATE POLICY "Teachers can view their students"
  ON student_assignments FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'egitmen')
  );

-- Öğrenciler kendi eğitmenlerini görebilir
CREATE POLICY "Students can view their teachers"
  ON student_assignments FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ogrenci')
  );

-- Sadece yöneticiler atama yapabilir
CREATE POLICY "Admins can insert assignments"
  ON student_assignments FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Sadece yöneticiler atama silebilir
CREATE POLICY "Admins can delete assignments"
  ON student_assignments FOR DELETE
  TO authenticated
  USING (is_admin());

-- Sadece yöneticiler atama güncelleyebilir
CREATE POLICY "Admins can update assignments"
  ON student_assignments FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());