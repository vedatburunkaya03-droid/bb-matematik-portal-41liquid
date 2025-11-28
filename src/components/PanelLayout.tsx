import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PanelLayoutProps {
  children: ReactNode;
  title: string;
  icon: ReactNode;
  userEmail?: string;
}

export function PanelLayout({ children, title, icon, userEmail }: PanelLayoutProps) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen relative">
      <div className="gradient-bg">
        <div className="gradient-blob gradient-blob-1"></div>
        <div className="gradient-blob gradient-blob-2"></div>
        <div className="gradient-blob gradient-blob-3"></div>
      </div>

      <div className="relative z-10">
        <header className="glass border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="glass p-3 rounded-xl">
                  {icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white text-glow">{title}</h1>
                  {userEmail && (
                    <p className="text-sm text-white/70">{userEmail}</p>
                  )}
                </div>
              </div>
              <button
                onClick={signOut}
                className="btn-glass flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Çıkış
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
