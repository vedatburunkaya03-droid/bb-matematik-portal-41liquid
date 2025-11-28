import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function LoginPage({ onToggle }: { onToggle: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError('Giriş başarısız. Email veya şifre hatalı.');
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) {
        setError('Şifre sıfırlama maili gönderilemedi.');
      } else {
        setResetSent(true);
      }
    } catch (err) {
      setError('Beklenmeyen bir hata oluştu.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="gradient-bg">
        <div className="gradient-blob gradient-blob-1"></div>
        <div className="gradient-blob gradient-blob-2"></div>
        <div className="gradient-blob gradient-blob-3"></div>
      </div>

      <div className="glass rounded-3xl shadow-2xl shadow-white/10 w-full max-w-md p-10 relative z-10">
        <div className="flex items-center justify-center mb-8">
          <svg
            id="katman_1"
            data-name="katman 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 3000 3000"
            className="w-32 h-32 animate-float drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
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
        </div>

        <h1 className="text-4xl font-bold text-center text-white mb-2 text-glow">BB Matematik</h1>
        <p className="text-center text-white/80 mb-8 font-light">Eğitim Portalı'na Hoş Geldiniz</p>

        {error && (
          <div className="glass-dark border-red-400/50 text-red-200 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {resetSent && (
          <div className="glass-dark border-green-400/50 text-green-200 px-4 py-3 rounded-xl mb-4">
            Şifre sıfırlama linki email adresinize gönderildi!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 outline-none transition"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-glass py-3 text-lg"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>

          <div className="mt-3 text-right">
            <button
              type="button"
              onClick={() => setShowReset(!showReset)}
              className="text-sm text-white/70 hover:text-white transition"
            >
              Şifremi unuttum
            </button>
          </div>
        </form>

        {showReset && (
          <div className="mt-6 glass-dark rounded-xl p-5">
            <p className="text-sm text-white/80 mb-4">Email adresinizi girin, size şifre sıfırlama linki gönderelim:</p>
            <form onSubmit={handlePasswordReset} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 outline-none transition"
                placeholder="ornek@email.com"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-glass"
              >
                {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-white/70">
            Hesabınız yok mu?{' '}
            <button
              onClick={onToggle}
              className="text-white font-medium hover:text-glow transition"
            >
              Kayıt Ol
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
