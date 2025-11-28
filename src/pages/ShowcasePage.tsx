import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Trophy, Users, Clock, Star, CheckCircle, GraduationCap, TrendingUp, LogOut } from 'lucide-react';

export function ShowcasePage() {
  const { user, currentUser, signOut } = useAuth();

  return (
    <div className="min-h-screen relative">
      <div className="gradient-bg">
        <div className="gradient-blob gradient-blob-1"></div>
        <div className="gradient-blob gradient-blob-2"></div>
        <div className="gradient-blob gradient-blob-3"></div>
      </div>

      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                id="katman_1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 3000 3000"
                className="w-12 h-12 animate-float drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
              >
                <defs>
                  <style>{`.cls-1 { fill: none; } .cls-2 { fill: #ffffff; opacity: 0.8; } .cls-3 { fill: #ffffff; }`}</style>
                </defs>
                <path className="cls-2" d="M1546.03,1273.09c-2.59.05-4.02,0-4.02,0h4.02Z"/>
                <rect className="cls-1" x="0" y="0" width="3000" height="3000"/>
                <g>
                  <path className="cls-3" d="M1507.26,1438.82h-10.98c55.83,0,101.09-45.26,101.09-101.09v-36.39c0-77.57-62.88-140.45-140.45-140.45h-300.97v15.33h47.05c23.67,0,42.87,19.19,42.87,42.87v219.74h-.01v265.01c0,25.19-20.42,45.62-45.62,45.62h-44.3v17.37h351.32c77.6,0,140.51-62.91,140.51-140.51v-46.98c0-77.6-62.91-140.51-140.51-140.51ZM1336.06,1209.06h87.69c48.07,0,87.04,38.97,87.04,87.04v34.36c0,48.07-38.97,87.04-87.04,87.04h-87.69v-208.45ZM1546.44,1622.28c0,55.21-44.76,99.97-99.97,99.97h-110.52v-238.86h110.52c55.21,0,99.97,44.76,99.97,99.97v38.92Z"/>
                  <path className="cls-3" d="M1844.06,1596.6c0,33.48-6.79,65.38-19.06,94.4-15.52,36.69-39.82,68.78-70.27,93.61-41.76,34.07-95.08,54.5-153.18,54.5h-367.51v-8.8c34.23-4.35,50.41-30.13,57.15-45.7h270.68s1.43.05,4.02,0c25.68-.41,165.82-9.36,171.9-154.83v-38.63c0-4.36-.19-8.68-.59-12.94-.01-.1-.01-.19-.02-.29-1.86-31.91-10.38-56.7-22.34-75.96h0c-44.07-59.85-121.97-56.22-121.97-56.22v-21.22c97.39-1.04,107.9-84.55,107.9-84.55v.13c.29-2.7.5-5.48.64-8.33.02-.16.02-.31.03-.47.18-2.34.26-4.7.26-7.08v-14.34c0-54.2-43.95-98.15-98.15-98.15h-8.34c-17.19-26.74-43.58-42.45-62.38-50.85h130.34c70.91,0,128.41,57.49,128.41,128.41v17.54c0,69.36-55,125.88-123.76,128.32h14.79c89.17,0,161.45,72.29,161.45,161.45Z"/>
                </g>
              </svg>
              <div>
                <h1 className="text-2xl font-bold text-white text-glow">BB Matematik</h1>
                <p className="text-sm text-white/70">Eğitim Portalı</p>
              </div>
            </div>
            {currentUser && (
              <div className="flex items-center gap-4">
                {user && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{user.full_name}</p>
                    <p className="text-xs text-white/70">{user.email}</p>
                  </div>
                )}
                <button
                  onClick={signOut}
                  className="btn-glass border-red-400/40 hover:border-red-400/60 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Çıkış</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium mb-6">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white">Rol Ataması Bekleniyor</span>
          </div>
          <h2 className="text-5xl font-bold text-white mb-6 text-glow">
            BB Matematik'e Hoş Geldiniz!
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Kayıt işleminiz başarıyla tamamlandı. Yöneticimiz en kısa sürede size bir rol atayacak ve eğitim yolculuğunuz başlayacak.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="glass rounded-2xl p-8 hover:scale-105 transition-transform duration-300">
            <div className="glass p-4 rounded-xl w-fit mb-6">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Zengin İçerik</h3>
            <p className="text-white/70 leading-relaxed">
              Uzman eğitmenlerimiz tarafından hazırlanan kapsamlı ders materyalleri, video anlatımlar ve interaktif sorularla matematik öğrenin.
            </p>
          </div>

          <div className="glass rounded-2xl p-8 hover:scale-105 transition-transform duration-300">
            <div className="glass p-4 rounded-xl w-fit mb-6">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Sınav Sistemi</h3>
            <p className="text-white/70 leading-relaxed">
              Online sınavlar, optik formlar ve anında sonuç değerlendirme sistemiyle kendinizi test edin ve gelişiminizi takip edin.
            </p>
          </div>

          <div className="glass rounded-2xl p-8 hover:scale-105 transition-transform duration-300">
            <div className="glass p-4 rounded-xl w-fit mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Kişisel Takip</h3>
            <p className="text-white/70 leading-relaxed">
              Eğitmenler, danışmanlar ve veliler öğrenci gelişimini yakından takip eder. Herkes kendi rolüne özel panele sahiptir.
            </p>
          </div>
        </div>

        <div className="glass rounded-3xl p-12 mb-16 shadow-2xl shadow-white/10">
          <div className="text-center mb-8">
            <Star className="w-16 h-16 mx-auto mb-4 text-white animate-pulse" />
            <h3 className="text-4xl font-bold text-white mb-4 text-glow">Kampanya ve Avantajlar</h3>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              BB Matematik ile öğrenmenin keyfini çıkarın ve özel fırsatlardan yararlanın
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="glass-dark rounded-xl p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-white flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-lg text-white mb-2">İlk Ay %50 İndirim</h4>
                  <p className="text-white/70">Yeni üyelerimize özel ilk ay yarı fiyatına eğitim fırsatı</p>
                </div>
              </div>
            </div>

            <div className="glass-dark rounded-xl p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-white flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-lg text-white mb-2">Sınırsız Sınav Hakkı</h4>
                  <p className="text-white/70">Tüm paketlerde sınırsız online sınav ve deneme imkanı</p>
                </div>
              </div>
            </div>

            <div className="glass-dark rounded-xl p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-white flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-lg text-white mb-2">Ücretsiz Deneme Dersi</h4>
                  <p className="text-white/70">3 aylık paketlerde bir ders ücretsiz deneme hakkı</p>
                </div>
              </div>
            </div>

            <div className="glass-dark rounded-xl p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-white flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-lg text-white mb-2">Aile Paketi İndirimi</h4>
                  <p className="text-white/70">2. ve 3. öğrenciye %30 aile indirimi avantajı</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-8 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-white" />
            <h3 className="text-3xl font-bold text-white text-glow">Ders İçeriklerimiz</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-dark border-l-4 border-blue-400 rounded-r-xl pl-6 py-4">
              <h4 className="font-bold text-lg text-white mb-2">Temel Matematik</h4>
              <p className="text-white/70">İşlemler, kesirler, ondalık sayılar, yüzdeler ve oran-orantı konuları</p>
            </div>

            <div className="glass-dark border-l-4 border-green-400 rounded-r-xl pl-6 py-4">
              <h4 className="font-bold text-lg text-white mb-2">Cebir</h4>
              <p className="text-white/70">Denklemler, eşitsizlikler, fonksiyonlar ve grafik çizimi</p>
            </div>

            <div className="glass-dark border-l-4 border-purple-400 rounded-r-xl pl-6 py-4">
              <h4 className="font-bold text-lg text-white mb-2">Geometri</h4>
              <p className="text-white/70">Şekiller, açılar, alan-çevre hesaplamaları ve geometrik ispatlar</p>
            </div>

            <div className="glass-dark border-l-4 border-orange-400 rounded-r-xl pl-6 py-4">
              <h4 className="font-bold text-lg text-white mb-2">Sınav Hazırlık</h4>
              <p className="text-white/70">LGS, YKS ve merkezi sınav hazırlık programları</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-10 text-center">
          <h3 className="text-3xl font-bold text-white mb-4 text-glow">Hesabınız Aktifleştiriliyor</h3>
          <p className="text-white/80 max-w-2xl mx-auto leading-relaxed">
            Yöneticimiz en kısa sürede size uygun rolü atayacak ve eğitim portalına tam erişim sağlayacaksınız.
            Bu süreçte herhangi bir sorunuz olursa <span className="font-semibold text-white">admin@bbmatematik.com</span> adresinden bizimle iletişime geçebilirsiniz.
          </p>
        </div>
      </main>

      <footer className="glass-dark border-t border-white/10 py-8 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/70">© 2025 BB Matematik Eğitim Portalı. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
