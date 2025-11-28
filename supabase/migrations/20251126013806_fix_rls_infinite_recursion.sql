/*
  # RLS Politikalarını Düzelt - Sonsuz Döngü Sorunu

  1. Sorun
    - Yönetici politikaları users tablosunu sorgularken kendine referans veriyor
    - Bu sonsuz döngüye sebep oluyor
    
  2. Çözüm
    - Tüm mevcut politikaları sil
    - Basit ve güvenli yeni politikalar oluştur
    - auth.jwt() kullanarak app_metadata'dan rol bilgisini al
    
  3. Yeni Politikalar
    - Kullanıcılar kendi profillerini görebilir
    - Kullanıcılar kendi profillerini güncelleyebilir (rol hariç)
    - Yöneticiler tüm işlemleri yapabilir
*/

-- Tüm mevcut politikaları sil
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can create own profile on signup" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update user roles" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Yöneticiler tüm profilleri görebilir
CREATE POLICY "Admins can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) = 'yonetici'
  );

-- Yeni kullanıcılar profil oluşturabilir
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Kullanıcılar kendi profillerini güncelleyebilir (rol değiştiremez)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- Yöneticiler tüm profilleri güncelleyebilir
CREATE POLICY "Admins can update all profiles"
  ON users FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) = 'yonetici'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) = 'yonetici'
  );

-- Yöneticiler kullanıcıları silebilir
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) = 'yonetici'
  );