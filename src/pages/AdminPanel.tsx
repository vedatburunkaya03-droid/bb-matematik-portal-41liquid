import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Shield, Users, UserPlus, Trash2, UserCog, Link as LinkIcon, Clock, Plus, Minus, X } from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { GlassModal, GlassButton } from '../components/GlassCard';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string | null;
  created_at: string;
}

interface ParentSession {
  id: string;
  parent_id: string;
  sessions_total: number;
  sessions_used: number;
  assigned_at: string;
  notes: string | null;
  parent: {
    full_name: string;
    email: string;
  };
}

export function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [showAssignParentModal, setShowAssignParentModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  const [parentSessions, setParentSessions] = useState<ParentSession[]>([]);
  const [selectedParentForSession, setSelectedParentForSession] = useState('');
  const [sessionCount, setSessionCount] = useState<number>(5);
  const [sessionNotes, setSessionNotes] = useState('');

  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedParent, setSelectedParent] = useState('');
  const [selectedParentStudents, setSelectedParentStudents] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchParentSessions();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setUsers(data || []);

      const teacherList = data?.filter(u => u.role === 'egitmen') || [];
      const studentList = data?.filter(u => u.role === 'ogrenci') || [];
      const parentList = data?.filter(u => u.role === 'veli') || [];
      const pendingList = data?.filter(u => u.role === null || u.role === '') || [];

      setTeachers(teacherList);
      setStudents(studentList);
      setParents(parentList);
      setPendingUsers(pendingList);
    } catch (err: any) {
      setError('Kullanıcılar yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      setError('');
      setSuccess('');

      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        selectedUser.id,
        { app_metadata: { role: newRole } }
      );

      if (metadataError) {
        console.warn('JWT metadata update failed:', metadataError);
      }

      setSuccess(`${selectedUser.full_name} kullanıcısına ${newRole} rolü atandı!`);
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
    } catch (err: any) {
      setError('Rol değiştirilemedi: ' + err.message);
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacher || selectedStudents.length === 0) return;

    try {
      setError('');
      setSuccess('');

      for (const studentId of selectedStudents) {
        const { error: deleteError } = await supabase
          .from('student_assignments')
          .delete()
          .eq('student_id', studentId);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from('student_assignments')
          .insert({
            teacher_id: selectedTeacher,
            student_id: studentId,
            assigned_by: user?.id
          });

        if (insertError) throw insertError;
      }

      setSuccess('Öğretmen-öğrenci eşleştirmesi başarılı!');
      setShowAssignTeacherModal(false);
      setSelectedTeacher('');
      setSelectedStudents([]);
    } catch (err: any) {
      setError('Eşleştirme başarısız: ' + err.message);
    }
  };

  const handleAssignParent = async () => {
    if (!selectedParent || selectedParentStudents.length === 0) return;

    try {
      setError('');
      setSuccess('');

      const assignments = selectedParentStudents.map(studentId => ({
        parent_id: selectedParent,
        student_id: studentId
      }));

      const { error: assignError } = await supabase
        .from('parent_student_relationships')
        .upsert(assignments, { onConflict: 'student_id,parent_id' });

      if (assignError) throw assignError;

      setSuccess('Veli-öğrenci eşleştirmesi başarılı!');
      setShowAssignParentModal(false);
      setSelectedParent('');
      setSelectedParentStudents([]);
    } catch (err: any) {
      setError('Eşleştirme başarısız: ' + err.message);
    }
  };

  const fetchParentSessions = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('parent_sessions')
        .select(`
          *,
          parent:users!parent_id(full_name, email)
        `)
        .order('assigned_at', { ascending: false });

      if (fetchError) throw fetchError;

      setParentSessions(data || []);
    } catch (err: any) {
      console.error('Error fetching parent sessions:', err);
    }
  };

  const handleAssignSession = async () => {
    if (!selectedParentForSession || !sessionCount) {
      alert('Lütfen veli ve seans sayısı seçin.');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const { error: insertError } = await supabase
        .from('parent_sessions')
        .insert({
          parent_id: selectedParentForSession,
          sessions_total: sessionCount,
          sessions_used: 0,
          assigned_by: user?.id,
          notes: sessionNotes || null
        });

      if (insertError) throw insertError;

      setSuccess(`${sessionCount} seans başarıyla atandı!`);
      setShowSessionModal(false);
      setSelectedParentForSession('');
      setSessionCount(5);
      setSessionNotes('');
      fetchParentSessions();
    } catch (err: any) {
      setError('Seans ataması başarısız: ' + err.message);
    }
  };

  const handleAdjustSessionUsed = async (sessionId: string, currentUsed: number, change: number, totalSessions: number) => {
    const newUsed = currentUsed + change;

    if (newUsed < 0) {
      alert('Kullanılan seans sayısı 0\'dan küçük olamaz!');
      return;
    }

    if (newUsed > totalSessions) {
      alert(`Kullanılan seans sayısı toplam seansı (${totalSessions}) aşamaz!`);
      return;
    }

    try {
      setError('');
      setSuccess('');

      const { error: updateError } = await supabase
        .from('parent_sessions')
        .update({ sessions_used: newUsed })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      setSuccess(`Seans sayısı ${change > 0 ? 'artırıldı' : 'azaltıldı'}! (${currentUsed} → ${newUsed})`);
      fetchParentSessions();
    } catch (err: any) {
      setError('Seans güncellenemedi: ' + err.message);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Bu seans kaydını silmek istediğinize emin misiniz?')) return;

    try {
      setError('');
      setSuccess('');

      const { error: deleteError } = await supabase
        .from('parent_sessions')
        .delete()
        .eq('id', sessionId);

      if (deleteError) throw deleteError;

      setSuccess('Seans kaydı başarıyla silindi!');
      fetchParentSessions();
    } catch (err: any) {
      setError('Seans silinemedi: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`${userName} kullanıcısını silmek istediğinize emin misiniz?`)) return;

    try {
      setError('');
      setSuccess('');

      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteError) throw deleteError;

      setSuccess(`${userName} başarıyla silindi!`);
      fetchUsers();
    } catch (err: any) {
      setError('Kullanıcı silinemedi: ' + err.message);
    }
  };

  return (
    <PanelLayout
      title="Yönetici Paneli"
      icon={<Shield className="w-8 h-8 text-white" />}
      userEmail={user?.email}
    >
      {error && (
        <div className="glass-dark border-red-400/50 text-red-200 px-6 py-4 rounded-2xl mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="glass-dark border-green-400/50 text-green-200 px-6 py-4 rounded-2xl mb-6">
          {success}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Toplam Kullanıcı</p>
              <p className="text-4xl font-bold text-white text-glow">{users.length}</p>
            </div>
            <Users className="w-12 h-12 text-white/70" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Rol Bekleyen</p>
              <p className="text-4xl font-bold text-white text-glow">{pendingUsers.length}</p>
            </div>
            <Users className="w-12 h-12 text-white/70" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Öğretmenler</p>
              <p className="text-4xl font-bold text-white text-glow">{teachers.length}</p>
            </div>
            <UserCog className="w-12 h-12 text-white/70" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Öğrenciler</p>
              <p className="text-4xl font-bold text-white text-glow">{students.length}</p>
            </div>
            <UserPlus className="w-12 h-12 text-white/70" />
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white text-glow">Hızlı İşlemler</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowAssignTeacherModal(true)}
            className="flex items-center gap-4 p-6 glass-dark border-green-400/30 rounded-xl hover:scale-105 transition-all duration-300"
          >
            <LinkIcon className="w-8 h-8 text-green-400" />
            <div className="text-left">
              <p className="font-bold text-white text-lg">Öğretmen-Öğrenci Eşleştir</p>
              <p className="text-sm text-white/70">Öğrencilere öğretmen atayın</p>
            </div>
          </button>

          <button
            onClick={() => setShowAssignParentModal(true)}
            className="flex items-center gap-4 p-6 glass-dark border-purple-400/30 rounded-xl hover:scale-105 transition-all duration-300"
          >
            <LinkIcon className="w-8 h-8 text-purple-400" />
            <div className="text-left">
              <p className="font-bold text-white text-lg">Veli-Öğrenci Eşleştir</p>
              <p className="text-sm text-white/70">Öğrencilere veli atayın</p>
            </div>
          </button>

          <button
            onClick={() => setShowSessionModal(true)}
            className="flex items-center gap-4 p-6 glass-dark border-blue-400/30 rounded-xl hover:scale-105 transition-all duration-300"
          >
            <Clock className="w-8 h-8 text-blue-400" />
            <div className="text-left">
              <p className="font-bold text-white text-lg">Veli Seans Yönetimi</p>
              <p className="text-sm text-white/70">Velilere seans tanımlayın</p>
            </div>
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-8 mb-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-glow">Veli Seansları</h2>

        {parentSessions.length === 0 ? (
          <div className="text-center py-12 glass-dark rounded-xl">
            <Clock className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <p className="text-white/70 text-lg">Henüz atanmış seans yok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-4 px-4 text-sm font-bold text-white">Veli</th>
                  <th className="text-left py-4 px-4 text-sm font-bold text-white">Email</th>
                  <th className="text-center py-4 px-4 text-sm font-bold text-white">Toplam</th>
                  <th className="text-center py-4 px-4 text-sm font-bold text-white">Kullanılan</th>
                  <th className="text-center py-4 px-4 text-sm font-bold text-white">Kalan</th>
                  <th className="text-left py-4 px-4 text-sm font-bold text-white">Tarih</th>
                  <th className="text-right py-4 px-4 text-sm font-bold text-white">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {parentSessions.map((session) => (
                  <tr key={session.id} className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="py-4 px-4 text-sm text-white">{session.parent.full_name}</td>
                    <td className="py-4 px-4 text-sm text-white/70">{session.parent.email}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-4 py-1.5 glass-dark border-blue-400/30 rounded-full text-sm font-bold text-white">
                        {session.sessions_total}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleAdjustSessionUsed(session.id, session.sessions_used, -1, session.sessions_total)}
                          className="p-2 glass-dark border-red-400/40 rounded-lg hover:scale-110 transition disabled:opacity-30"
                          disabled={session.sessions_used === 0}
                        >
                          <Minus className="w-4 h-4 text-red-400" />
                        </button>
                        <span className="px-5 py-1.5 glass-dark border-orange-400/30 rounded-full text-sm font-bold text-white min-w-[60px] text-center">
                          {session.sessions_used}
                        </span>
                        <button
                          onClick={() => handleAdjustSessionUsed(session.id, session.sessions_used, 1, session.sessions_total)}
                          className="p-2 glass-dark border-green-400/40 rounded-lg hover:scale-110 transition disabled:opacity-30"
                          disabled={session.sessions_used >= session.sessions_total}
                        >
                          <Plus className="w-4 h-4 text-green-400" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-4 py-1.5 glass-dark border-green-400/30 rounded-full text-sm font-bold text-white">
                        {session.sessions_total - session.sessions_used}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-white/70">
                      {new Date(session.assigned_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-red-400 hover:text-red-300 hover:scale-110 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-glow">Kullanıcı Yönetimi</h2>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
            <p className="text-white/70 mt-4">Yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
            <UserRoleColumn
              title="Rol Bekleyen"
              users={pendingUsers}
              icon={<Users className="w-5 h-5 text-white/70" />}
              onAssignRole={(u) => {
                setSelectedUser(u);
                setNewRole('');
                setShowRoleModal(true);
              }}
              onDelete={handleDeleteUser}
              borderColor="border-gray-400/30"
            />

            <UserRoleColumn
              title="Öğrenciler"
              users={students}
              icon={<UserPlus className="w-5 h-5 text-yellow-400" />}
              onAssignRole={(u) => {
                setSelectedUser(u);
                setNewRole(u.role || '');
                setShowRoleModal(true);
              }}
              onDelete={handleDeleteUser}
              borderColor="border-yellow-400/30"
            />

            <UserRoleColumn
              title="Eğitim Danışmanları"
              users={users.filter(u => u.role === 'danisman')}
              icon={<UserCog className="w-5 h-5 text-orange-400" />}
              onAssignRole={(u) => {
                setSelectedUser(u);
                setNewRole(u.role || '');
                setShowRoleModal(true);
              }}
              onDelete={handleDeleteUser}
              borderColor="border-orange-400/30"
            />

            <UserRoleColumn
              title="Veliler"
              users={parents}
              icon={<Users className="w-5 h-5 text-purple-400" />}
              onAssignRole={(u) => {
                setSelectedUser(u);
                setNewRole(u.role || '');
                setShowRoleModal(true);
              }}
              onDelete={handleDeleteUser}
              borderColor="border-purple-400/30"
            />

            <UserRoleColumn
              title="Matematik Eğitmenleri"
              users={teachers}
              icon={<UserCog className="w-5 h-5 text-green-400" />}
              onAssignRole={(u) => {
                setSelectedUser(u);
                setNewRole(u.role || '');
                setShowRoleModal(true);
              }}
              onDelete={handleDeleteUser}
              borderColor="border-green-400/30"
            />
          </div>
        )}
      </div>

      {showRoleModal && selectedUser && (
        <GlassModal onClose={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
          setNewRole('');
        }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white text-glow">
              Rol Değiştir: {selectedUser.full_name}
            </h3>
            <button
              onClick={() => {
                setShowRoleModal(false);
                setSelectedUser(null);
                setNewRole('');
              }}
              className="text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-3">Yeni Rol</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white focus:ring-2 focus:ring-white/50 outline-none"
            >
              <option value="" className="bg-slate-950">Rol Seçin</option>
              <option value="yonetici" className="bg-slate-950">Yönetici</option>
              <option value="egitmen" className="bg-slate-950">Eğitmen</option>
              <option value="ogrenci" className="bg-slate-950">Öğrenci</option>
              <option value="veli" className="bg-slate-950">Veli</option>
              <option value="danisman" className="bg-slate-950">Danışman</option>
            </select>
          </div>

          <div className="flex gap-3">
            <GlassButton onClick={handleRoleChange} className="flex-1">
              Kaydet
            </GlassButton>
            <GlassButton
              onClick={() => {
                setShowRoleModal(false);
                setSelectedUser(null);
                setNewRole('');
              }}
              variant="secondary"
              className="flex-1"
            >
              İptal
            </GlassButton>
          </div>
        </GlassModal>
      )}

      {showAssignTeacherModal && (
        <GlassModal onClose={() => {
          setShowAssignTeacherModal(false);
          setSelectedTeacher('');
          setSelectedStudents([]);
        }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white text-glow">Öğretmen-Öğrenci Eşleştir</h3>
            <button
              onClick={() => {
                setShowAssignTeacherModal(false);
                setSelectedTeacher('');
                setSelectedStudents([]);
              }}
              className="text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-3">Öğretmen Seçin</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white focus:ring-2 focus:ring-green-400/50 outline-none"
            >
              <option value="" className="bg-slate-950">Öğretmen Seçin</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-950">{t.full_name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-3">Öğrenciler</label>
            <div className="glass-dark rounded-xl p-4 max-h-64 overflow-y-auto">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-3 py-3 hover:bg-white/5 rounded-lg px-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, s.id]);
                      } else {
                        setSelectedStudents(selectedStudents.filter(id => id !== s.id));
                      }
                    }}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-white">{s.full_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <GlassButton onClick={handleAssignTeacher} className="flex-1">
              Eşleştir
            </GlassButton>
            <GlassButton
              onClick={() => {
                setShowAssignTeacherModal(false);
                setSelectedTeacher('');
                setSelectedStudents([]);
              }}
              variant="secondary"
              className="flex-1"
            >
              İptal
            </GlassButton>
          </div>
        </GlassModal>
      )}

      {showAssignParentModal && (
        <GlassModal onClose={() => {
          setShowAssignParentModal(false);
          setSelectedParent('');
          setSelectedParentStudents([]);
        }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white text-glow">Veli-Öğrenci Eşleştir</h3>
            <button
              onClick={() => {
                setShowAssignParentModal(false);
                setSelectedParent('');
                setSelectedParentStudents([]);
              }}
              className="text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-3">Veli Seçin</label>
            <select
              value={selectedParent}
              onChange={(e) => setSelectedParent(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white focus:ring-2 focus:ring-purple-400/50 outline-none"
            >
              <option value="" className="bg-slate-950">Veli Seçin</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-950">{p.full_name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-3">Öğrenciler</label>
            <div className="glass-dark rounded-xl p-4 max-h-64 overflow-y-auto">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-3 py-3 hover:bg-white/5 rounded-lg px-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedParentStudents.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedParentStudents([...selectedParentStudents, s.id]);
                      } else {
                        setSelectedParentStudents(selectedParentStudents.filter(id => id !== s.id));
                      }
                    }}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-white">{s.full_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <GlassButton onClick={handleAssignParent} className="flex-1">
              Eşleştir
            </GlassButton>
            <GlassButton
              onClick={() => {
                setShowAssignParentModal(false);
                setSelectedParent('');
                setSelectedParentStudents([]);
              }}
              variant="secondary"
              className="flex-1"
            >
              İptal
            </GlassButton>
          </div>
        </GlassModal>
      )}

      {showSessionModal && (
        <GlassModal onClose={() => {
          setShowSessionModal(false);
          setSelectedParentForSession('');
          setSessionCount(5);
          setSessionNotes('');
        }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white text-glow">Veli Seans Tanımla</h3>
            <button
              onClick={() => {
                setShowSessionModal(false);
                setSelectedParentForSession('');
                setSessionCount(5);
                setSessionNotes('');
              }}
              className="text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-3">Veli Seçin</label>
            <select
              value={selectedParentForSession}
              onChange={(e) => setSelectedParentForSession(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white focus:ring-2 focus:ring-blue-400/50 outline-none"
            >
              <option value="" className="bg-slate-950">Veli Seçin</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-950">{p.full_name} ({p.email})</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-3">Seans Sayısı</label>
            <div className="grid grid-cols-4 gap-3">
              {[5, 8, 20, 40].map((count) => (
                <button
                  key={count}
                  onClick={() => setSessionCount(count)}
                  className={`py-4 px-4 rounded-xl font-bold transition-all duration-300 ${
                    sessionCount === count
                      ? 'glass-dark border-2 border-blue-400 text-white scale-105'
                      : 'glass text-white/70 hover:scale-105'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-3">
              Not (Opsiyonel)
            </label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/50 outline-none"
              rows={3}
              placeholder="Bu seans ataması ile ilgili notlar..."
            />
          </div>

          <div className="flex gap-3">
            <GlassButton onClick={handleAssignSession} className="flex-1">
              Seans Ata
            </GlassButton>
            <GlassButton
              onClick={() => {
                setShowSessionModal(false);
                setSelectedParentForSession('');
                setSessionCount(5);
                setSessionNotes('');
              }}
              variant="secondary"
              className="flex-1"
            >
              İptal
            </GlassButton>
          </div>
        </GlassModal>
      )}
    </PanelLayout>
  );
}

function UserRoleColumn({
  title,
  users,
  icon,
  onAssignRole,
  onDelete,
  borderColor
}: {
  title: string;
  users: User[];
  icon: React.ReactNode;
  onAssignRole: (user: User) => void;
  onDelete: (userId: string, userName: string) => void;
  borderColor: string;
}) {
  return (
    <div className={`glass rounded-2xl p-6 border-2 ${borderColor}`}>
      <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
        {icon}
        {title} ({users.length})
      </h3>
      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="glass-dark rounded-xl p-4">
            <div className="font-semibold text-sm text-white mb-1">{u.full_name}</div>
            <div className="text-xs text-white/70 mb-3 truncate">{u.email}</div>
            <div className="flex gap-2">
              <button
                onClick={() => onAssignRole(u)}
                className="text-xs btn-glass py-1 px-3 flex-1"
              >
                Rol {u.role ? 'Değiştir' : 'Ata'}
              </button>
              <button
                onClick={() => onDelete(u.id, u.full_name)}
                className="text-xs glass-dark border-red-400/40 hover:border-red-400/60 px-3 py-1 rounded-lg transition"
              >
                <Trash2 className="w-3 h-3 inline text-red-400" />
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-sm text-white/60 text-center py-6">Kullanıcı yok</p>
        )}
      </div>
    </div>
  );
}
