/*
  # BB Matematik Eğitim Portalı - Kullanıcı ve Rol Yönetimi

  1. Yeni Tablolar
    - `users`
      - `id` (uuid, primary key) - Supabase auth.users tablosuyla eşleşir
      - `email` (text, unique) - Kullanıcı email adresi
      - `full_name` (text) - Kullanıcı adı soyadı
      - `role` (text) - Kullanıcı rolü (null = yetkisiz)
      - `created_at` (timestamptz) - Kayıt tarihi
      - `updated_at` (timestamptz) - Güncelleme tarihi

  2. Roller
    - null veya '' = Rol atanmamış (yetkisiz kullanıcı)
    - 'yonetici' = Yönetici (tüm yetkilere sahip)
    - 'veli' = Veli
    - 'egitmen' = Matematik Eğitmeni
    - 'ogrenci' = Öğrenci
    - 'danisman' = Eğitim Danışmanı

  3. Güvenlik
    - RLS aktif
    - Yöneticiler tüm kullanıcıları görebilir ve güncelleyebilir
    - Kullanıcılar sadece kendi bilgilerini görebilir
    - Rol atama sadece yönetici tarafından yapılabilir
*/

-- Users tablosu oluştur
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT NULL CHECK (role IN ('yonetici', 'veli', 'egitmen', 'ogrenci', 'danisman')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS'yi aktifleştir
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Yöneticiler tüm kullanıcıları görebilir
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'yonetici'
    )
  );

-- Kullanıcılar kayıt olduğunda profil oluşturabilir (rol olmadan)
CREATE POLICY "Users can create own profile on signup"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND role IS NULL);

-- Kullanıcılar kendi bilgilerini güncelleyebilir (rol hariç)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM users WHERE id = auth.uid())
  );

-- Sadece yöneticiler rol atayabilir
CREATE POLICY "Admins can update user roles"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'yonetici'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'yonetici'
    )
  );

-- Updated_at otomatik güncelleme için trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();