import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPanel } from './pages/AdminPanel';
import { VeliPanel } from './pages/VeliPanel';
import { EgitmenPanel } from './pages/EgitmenPanel';
import { OgrenciPanel } from './pages/OgrenciPanel';
import { DanismanPanel } from './pages/DanismanPanel';
import { ShowcasePage } from './pages/ShowcasePage';

function AppContent() {
  const { currentUser, user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return showLogin ? (
      <LoginPage onToggle={() => setShowLogin(false)} />
    ) : (
      <RegisterPage onToggle={() => setShowLogin(true)} />
    );
  }

  if (!user || !user.role) {
    return <ShowcasePage />;
  }

  switch (user.role) {
    case 'yonetici':
      return <AdminPanel />;
    case 'veli':
      return <VeliPanel />;
    case 'egitmen':
      return <EgitmenPanel />;
    case 'ogrenci':
      return <OgrenciPanel />;
    case 'danisman':
      return <DanismanPanel />;
    default:
      return <ShowcasePage />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
