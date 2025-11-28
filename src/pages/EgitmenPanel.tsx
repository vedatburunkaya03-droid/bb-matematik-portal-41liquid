import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Users, GraduationCap, FileText, AlertTriangle, X } from 'lucide-react';
import { ExamManager } from '../components/ExamManager';
import { supabase } from '../lib/supabase';
import { PanelLayout } from '../components/PanelLayout';
import { GlassModal, GlassButton } from '../components/GlassCard';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface ParentSession {
  id: string;
  parent_id: string;
  sessions_total: number;
  sessions_used: number;
}

export function EgitmenPanel() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [showStudents, setShowStudents] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [processingSpeed, setProcessingSpeed] = useState(5);
  const [motivation, setMotivation] = useState(5);
  const [compatibility, setCompatibility] = useState(5);
  const [detailedNotes, setDetailedNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMyStudents = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('student_assignments')
      .select('student:users!student_id(id, email, full_name)')
      .eq('teacher_id', user.id);

    if (error) {
      console.error('Error fetching students:', error);
    } else {
      const uniqueStudents = Array.from(
        new Map(
          data
            ?.filter((item: any) => item.student !== null)
            .map((item: any) => [item.student.id, item.student])
        ).values()
      ) as Student[];
      setStudents(uniqueStudents);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (showStudents && students.length === 0) {
      fetchMyStudents();
    }
  }, [showStudents]);

  const handleOpenReportForm = (student: Student) => {
    setSelectedStudent(student);
    setShowReportForm(true);
    setProcessingSpeed(5);
    setMotivation(5);
    setCompatibility(5);
    setDetailedNotes('');
    setError('');
    setSuccess('');
  };

  const handleCloseReportForm = () => {
    setShowReportForm(false);
    setSelectedStudent(null);
    setProcessingSpeed(5);
    setMotivation(5);
    setCompatibility(5);
    setDetailedNotes('');
    setError('');
    setSuccess('');
  };

  const handleSubmitReport = async () => {
    if (!selectedStudent || !user?.id) return;

    if (!detailedNotes.trim()) {
      setError('Lütfen detaylı rapor giriniz!');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { data: parentRelation, error: parentError } = await supabase
        .from('parent_student_relationships')
        .select('parent_id')
        .eq('student_id', selectedStudent.id)
        .maybeSingle();

      if (parentError) throw parentError;

      if (!parentRelation) {
        setError('Bu öğrencinin velisi bulunamadı!');
        setSubmitting(false);
        return;
      }

      const { data: parentSession, error: sessionError } = await supabase
        .from('parent_sessions')
        .select('*')
        .eq('parent_id', parentRelation.parent_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) throw sessionError;

      if (!parentSession) {
        setError('Velinin aktif seans paketi bulunamadı!');
        setSubmitting(false);
        return;
      }

      const remainingSessions = parentSession.sessions_total - parentSession.sessions_used;
      if (remainingSessions <= 0) {
        setError('Velinin kalan seansı bulunmuyor!');
        setSubmitting(false);
        return;
      }

      const { error: reportError } = await supabase
        .from('student_reports')
        .insert({
          student_id: selectedStudent.id,
          teacher_id: user.id,
          processing_speed: processingSpeed,
          motivation: motivation,
          compatibility: compatibility,
          detailed_notes: detailedNotes,
          session_deducted: true,
          parent_session_id: parentSession.id
        });

      if (reportError) throw reportError;

      const { error: updateError } = await supabase
        .from('parent_sessions')
        .update({
          sessions_used: parentSession.sessions_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', parentSession.id);

      if (updateError) throw updateError;

      setSuccess('Rapor başarıyla kaydedildi ve veliden 1 seans düşüldü!');
      setTimeout(() => {
        handleCloseReportForm();
      }, 2000);
    } catch (err: any) {
      setError('Rapor kaydedilemedi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelLayout
      title="Eğitmen Paneli"
      icon={<BookOpen className="w-8 h-8 text-white" />}
      userEmail={user?.email}
    >
      <div className="glass rounded-2xl p-8 mb-8">
        <button
          onClick={() => {
            setShowStudents(!showStudents);
            if (!showStudents) fetchMyStudents();
          }}
          className="btn-glass flex items-center gap-2"
        >
          <Users className="w-5 h-5" />
          {showStudents ? 'Öğrencileri Gizle' : 'Öğrencilerimi Gör'}
        </button>

        {showStudents && (
          <div className="mt-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 glass-dark rounded-xl">
                <GraduationCap className="w-16 h-16 text-white/60 mx-auto mb-4" />
                <p className="text-white/80 text-lg">Size atanmış öğrenci bulunmuyor.</p>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-white text-glow mb-6">
                  Atanmış Öğrencilerim ({students.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {students.map(student => (
                    <div
                      key={student.id}
                      className="glass rounded-2xl p-6 border-2 border-green-400/30 hover:scale-105 transition-all duration-300"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <GraduationCap className="w-8 h-8 text-green-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-lg truncate mb-1">
                            {student.full_name}
                          </h4>
                          <p className="text-sm text-white/70 truncate">{student.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenReportForm(student)}
                        className="w-full btn-glass border-purple-400/40 hover:border-purple-400/60 flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Zümre Raporu Oluştur
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ExamManager />

      {showReportForm && selectedStudent && (
        <GlassModal onClose={handleCloseReportForm}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white text-glow mb-2">Zümre Raporu Oluştur</h2>
              <p className="text-white/80">{selectedStudent.full_name} için değerlendirme</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="glass-dark border-yellow-400/50 px-4 py-2 rounded-xl font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-sm">Bu işlem veliden 1 seans düşer</span>
              </div>
              <button
                onClick={handleCloseReportForm}
                className="text-white/70 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 glass-dark border-red-400/50 text-red-200 p-4 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 glass-dark border-green-400/50 text-green-200 p-4 rounded-xl">
              {success}
            </div>
          )}

          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-white font-bold mb-4">İşlem Hızı</label>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/60 text-sm">DÜŞÜK</span>
                  <span className="text-white font-bold text-2xl text-glow">{processingSpeed}/10</span>
                  <span className="text-white/60 text-sm">YÜKSEK</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={processingSpeed}
                  onChange={(e) => setProcessingSpeed(Number(e.target.value))}
                  className="w-full h-3 glass rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-4">Motivasyon</label>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/60 text-sm">DÜŞÜK</span>
                  <span className="text-white font-bold text-2xl text-glow">{motivation}/10</span>
                  <span className="text-white/60 text-sm">YÜKSEK</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={motivation}
                  onChange={(e) => setMotivation(Number(e.target.value))}
                  className="w-full h-3 glass rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-4">Uyumluluk</label>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/60 text-sm">DÜŞÜK</span>
                  <span className="text-white font-bold text-2xl text-glow">{compatibility}/10</span>
                  <span className="text-white/60 text-sm">YÜKSEK</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={compatibility}
                  onChange={(e) => setCompatibility(Number(e.target.value))}
                  className="w-full h-3 glass rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-bold mb-4">Detaylı Rapor & Gözlemler</label>
              <textarea
                value={detailedNotes}
                onChange={(e) => setDetailedNotes(e.target.value)}
                placeholder="Öğrencinin dersteki durumu, eksikleri ve ödev takibi hakkında detaylı bilgi..."
                className="w-full h-48 px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 outline-none resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <GlassButton
                onClick={handleSubmitReport}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                {submitting ? 'Kaydediliyor...' : 'Raporu Kaydet ve Seans Düş'}
              </GlassButton>
              <GlassButton
                onClick={handleCloseReportForm}
                disabled={submitting}
                variant="secondary"
                className="px-8"
              >
                İptal
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      )}
    </PanelLayout>
  );
}
