import { useAuth } from '../contexts/AuthContext';
import { LogOut, Clock } from 'lucide-react';

export function NoRolePage() {
  const { user, signOut, session } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="gradient-bg">
        <div className="gradient-blob gradient-blob-1"></div>
        <div className="gradient-blob gradient-blob-2"></div>
        <div className="gradient-blob gradient-blob-3"></div>
      </div>

      <div className="glass rounded-3xl shadow-2xl shadow-white/10 w-full max-w-md p-10 relative z-10">
        <div className="flex items-center justify-center mb-6">
          <div className="glass p-4 rounded-full">
            <Clock className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-white mb-3 text-glow">
          Hesabınız Beklemede
        </h1>

        <p className="text-center text-white/80 mb-6">
          Hoş geldiniz, <span className="font-semibold text-white">{user?.full_name || session?.user?.email?.split('@')[0] || 'Kullanıcı'}</span>!
        </p>

        <div className="glass-dark border-orange-400/50 rounded-xl p-5 mb-6">
          <p className="text-sm text-white/90 leading-relaxed">
            Hesabınıza henüz bir rol atanmadı. Lütfen sistem yöneticisinin size bir rol atamasını bekleyin.
            Rol atandıktan sonra sisteme tekrar giriş yaparak ilgili panele erişebilirsiniz.
          </p>
        </div>

        <div className="space-y-3 text-sm text-white/80 mb-6">
          <p><strong className="text-white">Email:</strong> {user?.email || session?.user?.email || 'Yükleniyor...'}</p>
          <p><strong className="text-white">Durum:</strong> Rol Bekleniyor</p>
        </div>

        <button
          onClick={signOut}
          className="w-full btn-glass border-red-400/40 hover:border-red-400/60 hover:bg-red-500/10 py-3 flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
}
