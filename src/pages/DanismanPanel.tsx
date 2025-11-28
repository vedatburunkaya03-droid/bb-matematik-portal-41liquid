import { useAuth } from '../contexts/AuthContext';
import { LogOut, Briefcase } from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';

export function DanismanPanel() {
  const { user } = useAuth();

  return (
    <PanelLayout
      title="Eğitim Danışmanı Paneli"
      icon={<Briefcase className="w-8 h-8 text-white" />}
      userEmail={user?.email}
    >
      <div className="glass rounded-3xl p-16 text-center shadow-2xl shadow-white/10">
        <Briefcase className="w-20 h-20 text-white mx-auto mb-6 animate-pulse" />
        <h2 className="text-4xl font-bold text-white mb-4 text-glow">Eğitim Danışmanı Paneli</h2>
        <p className="text-white/80 text-lg">Panel içeriği yakında eklenecektir.</p>
      </div>
    </PanelLayout>
  );
}
