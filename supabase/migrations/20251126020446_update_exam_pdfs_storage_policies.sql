/*
  # Sınav PDF'leri Storage Politikalarını Güncelleme

  1. Mevcut Politikalar
    - Eski politikaları sil
    - Yeni güvenli politikalar ekle

  2. Yeni Güvenlik Modeli
    - Eğitmenler kendi klasörlerine upload edebilir
    - Authenticated kullanıcılar (öğrenci ve eğitmen) PDF'leri okuyabilir
    - Signed URL kullanarak güvenli erişim
*/

-- Eski politikaları temizle
DROP POLICY IF EXISTS "Teachers can upload PDFs to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Students can view assigned exam PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete their own PDFs" ON storage.objects;

-- Eğitmenler kendi klasörlerine PDF upload edebilir
CREATE POLICY "Teachers can upload PDFs to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated kullanıcılar PDF'leri okuyabilir (signed URL için gerekli)
CREATE POLICY "Authenticated users can read exam PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-pdfs'
);

-- Eğitmenler kendi PDF'lerini silebilir
CREATE POLICY "Teachers can delete their own PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);