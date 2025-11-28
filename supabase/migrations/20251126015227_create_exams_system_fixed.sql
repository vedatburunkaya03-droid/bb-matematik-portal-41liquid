/*
  # Sınav Sistemi

  1. Yeni Tablolar
    - `exams`
      - `id` (uuid, primary key): Sınavın benzersiz kimliği
      - `teacher_id` (uuid, foreign key): Sınavı oluşturan eğitmenin ID'si
      - `title` (text): Sınav başlığı
      - `description` (text): Sınav açıklaması
      - `pdf_url` (text): PDF dosyasının URL'si
      - `duration_minutes` (integer): Sınav süresi (dakika)
      - `question_count` (integer): Soru sayısı
      - `created_at` (timestamptz): Oluşturulma zamanı
      - `updated_at` (timestamptz): Güncelleme zamanı
    
    - `exam_answer_keys`
      - `id` (uuid, primary key): Cevap anahtarı ID'si
      - `exam_id` (uuid, foreign key): Sınav ID'si
      - `question_number` (integer): Soru numarası
      - `correct_answer` (text): Doğru cevap (A, B, C, D, E)
      - `created_at` (timestamptz): Oluşturulma zamanı
    
    - `exam_assignments`
      - `id` (uuid, primary key): Atama ID'si
      - `exam_id` (uuid, foreign key): Sınav ID'si
      - `student_id` (uuid, foreign key): Öğrenci ID'si
      - `teacher_id` (uuid, foreign key): Eğitmen ID'si
      - `assigned_at` (timestamptz): Atama zamanı
      - `created_at` (timestamptz): Oluşturulma zamanı
    
    - `exam_submissions`
      - `id` (uuid, primary key): Gönderim ID'si
      - `exam_assignment_id` (uuid, foreign key): Atama ID'si
      - `student_id` (uuid, foreign key): Öğrenci ID'si
      - `started_at` (timestamptz): Başlama zamanı
      - `submitted_at` (timestamptz): Gönderim zamanı
      - `time_spent_seconds` (integer): Harcanan süre (saniye)
      - `correct_count` (integer): Doğru sayısı
      - `wrong_count` (integer): Yanlış sayısı
      - `empty_count` (integer): Boş sayısı
      - `score_percentage` (numeric): Başarı yüzdesi
      - `created_at` (timestamptz): Oluşturulma zamanı
    
    - `exam_answers`
      - `id` (uuid, primary key): Cevap ID'si
      - `submission_id` (uuid, foreign key): Gönderim ID'si
      - `question_number` (integer): Soru numarası
      - `student_answer` (text): Öğrenci cevabı (A, B, C, D, E veya null)
      - `is_correct` (boolean): Doğru mu?
      - `created_at` (timestamptz): Oluşturulma zamanı

  2. İndeksler
    - Sık kullanılan sorgular için indeksler

  3. Güvenlik (RLS)
    - Eğitmenler kendi sınavlarını yönetebilir
    - Öğrenciler kendilerine atanan sınavları görebilir
    - Sadece atanan öğrenci sınava girebilir
*/

-- exams tablosu
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  pdf_url text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  question_count integer NOT NULL CHECK (question_count > 0 AND question_count <= 200),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exams_teacher_id ON exams(teacher_id);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- exam_answer_keys tablosu
CREATE TABLE IF NOT EXISTS exam_answer_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_number integer NOT NULL CHECK (question_number > 0),
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_exam_answer_keys_exam_id ON exam_answer_keys(exam_id);

ALTER TABLE exam_answer_keys ENABLE ROW LEVEL SECURITY;

-- exam_assignments tablosu
CREATE TABLE IF NOT EXISTS exam_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_assignments_exam_id ON exam_assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_student_id ON exam_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_teacher_id ON exam_assignments(teacher_id);

ALTER TABLE exam_assignments ENABLE ROW LEVEL SECURITY;

-- exam_submissions tablosu
CREATE TABLE IF NOT EXISTS exam_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_assignment_id uuid NOT NULL REFERENCES exam_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  time_spent_seconds integer DEFAULT 0,
  correct_count integer DEFAULT 0,
  wrong_count integer DEFAULT 0,
  empty_count integer DEFAULT 0,
  score_percentage numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_assignment_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_submissions_student_id ON exam_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam_assignment_id ON exam_submissions(exam_assignment_id);

ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;

-- exam_answers tablosu
CREATE TABLE IF NOT EXISTS exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  question_number integer NOT NULL CHECK (question_number > 0),
  student_answer text CHECK (student_answer IN ('A', 'B', 'C', 'D', 'E') OR student_answer IS NULL),
  is_correct boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(submission_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_exam_answers_submission_id ON exam_answers(submission_id);

ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exams
CREATE POLICY "Teachers can view their own exams"
  ON exams FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM exam_assignments
      WHERE exam_assignments.exam_id = exams.id
      AND exam_assignments.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert their own exams"
  ON exams FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own exams"
  ON exams FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own exams"
  ON exams FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- RLS Policies for exam_answer_keys
CREATE POLICY "Teachers can manage answer keys for their exams"
  ON exam_answer_keys FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_answer_keys.exam_id
      AND exams.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_answer_keys.exam_id
      AND exams.teacher_id = auth.uid()
    )
  );

-- RLS Policies for exam_assignments
CREATE POLICY "Teachers can view assignments for their exams"
  ON exam_assignments FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid() OR
    student_id = auth.uid()
  );

CREATE POLICY "Teachers can create assignments for their exams"
  ON exam_assignments FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their assignments"
  ON exam_assignments FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- RLS Policies for exam_submissions
CREATE POLICY "Students can view their own submissions"
  ON exam_submissions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM exam_assignments
      JOIN exams ON exams.id = exam_assignments.exam_id
      WHERE exam_assignments.id = exam_submissions.exam_assignment_id
      AND exams.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can create their own submissions"
  ON exam_submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions"
  ON exam_submissions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- RLS Policies for exam_answers
CREATE POLICY "Students can manage their own answers"
  ON exam_answers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_submissions
      WHERE exam_submissions.id = exam_answers.submission_id
      AND exam_submissions.student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_submissions
      WHERE exam_submissions.id = exam_answers.submission_id
      AND exam_submissions.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view answers for their exams"
  ON exam_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_submissions
      JOIN exam_assignments ON exam_assignments.id = exam_submissions.exam_assignment_id
      JOIN exams ON exams.id = exam_assignments.exam_id
      WHERE exam_submissions.id = exam_answers.submission_id
      AND exams.teacher_id = auth.uid()
    )
  );