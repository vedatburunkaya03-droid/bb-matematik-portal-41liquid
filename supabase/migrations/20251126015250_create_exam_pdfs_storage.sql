/*
  # Sınav PDF'leri için Storage

  1. Storage Bucket
    - `exam-pdfs` bucket'ı oluştur
    - Public erişim yok (güvenlik)
    - Sadece eğitmenler upload edebilir
    - Eğitmenler ve atanan öğrenciler PDF'leri görebilir

  2. Storage Policies
    - Eğitmenler kendi PDF'lerini upload edebilir
    - Eğitmenler kendi PDF'lerini silebilir
    - Atanan öğrenciler PDF'leri görebilir
*/

-- Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-pdfs',
  'exam-pdfs',
  false,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Eğitmenler kendi klasörlerine PDF upload edebilir
CREATE POLICY "Teachers can upload PDFs to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Eğitmenler kendi PDF'lerini görebilir
CREATE POLICY "Teachers can view their own PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Öğrenciler kendilerine atanan sınavların PDF'lerini görebilir
CREATE POLICY "Students can view assigned exam PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-pdfs' AND
  EXISTS (
    SELECT 1 FROM exams
    JOIN exam_assignments ON exam_assignments.exam_id = exams.id
    WHERE exam_assignments.student_id = auth.uid()
    AND (storage.foldername(name))[1] = exams.teacher_id::text
    AND exams.pdf_url LIKE '%' || name || '%'
  )
);

-- Eğitmenler kendi PDF'lerini silebilir
CREATE POLICY "Teachers can delete their own PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);