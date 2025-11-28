/*
  # Yönetici Silme Yetkisi

  1. Güvenlik Değişiklikleri
    - Yöneticilerin kullanıcıları silme yetkisi eklendi
    - Sadece yönetici rolüne sahip kullanıcılar başka kullanıcıları silebilir
    
  2. Notlar
    - Kullanıcı silindiğinde auth.users'dan da otomatik silinir (CASCADE)
*/

-- Sadece yöneticiler kullanıcıları silebilir
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'yonetici'
    )
  );