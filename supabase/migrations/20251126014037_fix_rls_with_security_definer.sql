/*
  # RLS Sonsuz Döngü Sorunu - Kesin Çözüm

  1. Sorun
    - Politikalar içinde users tablosunu sorgulamak sonsuz döngüye sebep oluyor
    - Her sorgu tekrar aynı politikalardan geçiyor
    
  2. Çözüm
    - SECURITY DEFINER fonksiyon kullan
    - Fonksiyon RLS bypass eder ve direkt veriyi alır
    - Politikalar bu fonksiyonu kullanır
    
  3. Yeni Yapı
    - is_admin() fonksiyonu: RLS bypass ile admin kontrolü
    - Basit ve güvenli politikalar
*/

-- Önce tüm politikaları sil
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- RLS bypass eden yardımcı fonksiyon
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'yonetici'
  );
END;
$$;

-- Kullanıcılar kendi profillerini görebilir VEYA admin tüm profilleri görebilir
CREATE POLICY "Users can view own profile or admin can view all"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

-- Yeni kullanıcılar profil oluşturabilir
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Kullanıcılar kendi profillerini güncelleyebilir (rol hariç) VEYA admin her şeyi güncelleyebilir
CREATE POLICY "Users can update own profile or admin can update all"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (
    (auth.uid() = id AND role = (
      SELECT u.role FROM users u WHERE u.id = auth.uid()
    )) OR is_admin()
  );

-- Sadece adminler kullanıcıları silebilir
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (is_admin());