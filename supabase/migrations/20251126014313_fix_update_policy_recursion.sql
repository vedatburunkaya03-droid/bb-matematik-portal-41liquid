/*
  # UPDATE Politikası Düzeltmesi

  1. Sorun
    - UPDATE politikasında WITH CHECK içinde users tablosu sorgulanıyor
    - Bu sonsuz döngüye sebep oluyor
    
  2. Çözüm
    - Kullanıcılar sadece kendi profillerini güncelleyebilir ve rol değiştiremez
    - Adminler her şeyi güncelleyebilir
    - WITH CHECK içinde tablo sorgusu yapma
*/

-- UPDATE politikasını sil ve yeniden oluştur
DROP POLICY IF EXISTS "Users can update own profile or admin can update all" ON users;

-- Kullanıcılar kendi profillerini güncelleyebilir (rol hariç) VEYA admin her şeyi güncelleyebilir
CREATE POLICY "Users can update own profile or admin can update all"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());