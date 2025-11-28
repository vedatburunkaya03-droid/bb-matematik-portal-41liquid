import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, GraduationCap, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface ExamResult {
  id: string;
  exam_title: string;
  exam_description: string;
  question_count: number;
  duration_minutes: number;
  submitted_at: string;
  correct_count: number;
  wrong_count: number;
  empty_count: number;
  score_percentage: number;
}

interface ParentSession {
  id: string;
  sessions_total: number;
  sessions_used: number;
  assigned_at: string;
  notes: string | null;
}

export function VeliPanel() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [sessions, setSessions] = useState<ParentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchStudents();
      fetchSessions();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedStudent) {
      fetchExamResults(selectedStudent);
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('parent_student_relationships')
      .select('student:users!student_id(id, full_name, email)')
      .eq('parent_id', user.id);

    if (error) {
      console.error('Error fetching students:', error);
    } else {
      const studentList = data
        ?.filter((item: any) => item.student !== null)
        .map((item: any) => item.student) || [];
      setStudents(studentList);
      if (studentList.length > 0) {
        setSelectedStudent(studentList[0].id);
      }
    }
    setLoading(false);
  };

  const fetchSessions = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('parent_sessions')
      .select('*')
      .eq('parent_id', user.id)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
    } else {
      setSessions(data || []);
    }
  };

  const fetchExamResults = async (studentId: string) => {
    setResultsLoading(true);
    const { data, error } = await supabase
      .from('exam_submissions')
      .select(`
        id,
        submitted_at,
        correct_count,
        wrong_count,
        empty_count,
        score_percentage,
        exam_assignment:exam_assignments!inner (
          exam:exams (
            title,
            description,
            question_count,
            duration_minutes
          )
        )
      `)
      .eq('student_id', studentId)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching exam results:', error);
      setExamResults([]);
    } else {
      const formattedResults = data.map((item: any) => ({
        id: item.id,
        exam_title: item.exam_assignment.exam.title,
        exam_description: item.exam_assignment.exam.description,
        question_count: item.exam_assignment.exam.question_count,
        duration_minutes: item.exam_assignment.exam.duration_minutes,
        submitted_at: item.submitted_at,
        correct_count: item.correct_count,
        wrong_count: item.wrong_count,
        empty_count: item.empty_count,
        score_percentage: item.score_percentage,
      }));
      setExamResults(formattedResults);
    }
    setResultsLoading(false);
  };

  const totalSessions = sessions.reduce((sum, s) => sum + s.sessions_total, 0);
  const usedSessions = sessions.reduce((sum, s) => sum + s.sessions_used, 0);
  const remainingSessions = totalSessions - usedSessions;

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  return (
    <PanelLayout
      title="Veli Paneli"
      icon={<Users className="w-8 h-8 text-white" />}
      userEmail={user?.email}
    >
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center shadow-2xl shadow-white/10">
          <GraduationCap className="w-20 h-20 text-white/60 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-3 text-glow">Öğrenci Bulunamadı</h3>
          <p className="text-white/70 text-lg">
            Size atanmış öğrenci bulunmuyor. Yönetici tarafından öğrenci ataması yapılmasını bekleyin.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 text-glow">
              <Clock className="w-8 h-8 text-blue-400" />
              Seanslarım
            </h2>

            {sessions.length === 0 ? (
              <div className="text-center py-12 glass-dark rounded-xl">
                <Clock className="w-16 h-16 text-white/60 mx-auto mb-4" />
                <p className="text-white/80 text-lg">Size henüz seans tanımlanmamış.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="glass-dark border-2 border-blue-400/30 rounded-2xl p-8 text-center">
                    <div className="text-5xl font-bold text-white mb-2 text-glow">{totalSessions}</div>
                    <div className="text-sm text-white/70">Toplam Seans</div>
                  </div>
                  <div className="glass-dark border-2 border-orange-400/30 rounded-2xl p-8 text-center">
                    <div className="text-5xl font-bold text-white mb-2 text-glow">{usedSessions}</div>
                    <div className="text-sm text-white/70">Kullanılan Seans</div>
                  </div>
                  <div className="glass-dark border-2 border-green-400/30 rounded-2xl p-8 text-center">
                    <div className="text-5xl font-bold text-white mb-2 text-glow">{remainingSessions}</div>
                    <div className="text-sm text-white/70">Kalan Seans</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-lg mb-4">Seans Detayları</h3>
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="glass-dark rounded-xl p-6 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white text-lg mb-1">
                            {session.sessions_total} Seans Paketi
                          </div>
                          <div className="text-sm text-white/70">
                            Atanma: {new Date(session.assigned_at).toLocaleDateString('tr-TR')}
                          </div>
                          {session.notes && (
                            <div className="text-sm text-white/60 mt-2 italic">
                              Not: {session.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white/70 mb-1">Kullanılan / Toplam</div>
                          <div className="text-2xl font-bold text-white text-glow">
                            {session.sessions_used} / {session.sessions_total}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 text-glow">
              <GraduationCap className="w-8 h-8 text-purple-400" />
              Öğrencilerim
            </h2>
            <div className="flex flex-wrap gap-4">
              {students.map(student => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student.id)}
                  className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
                    selectedStudent === student.id
                      ? 'glass-dark border-2 border-purple-400 text-white scale-105 shadow-lg shadow-purple-400/20'
                      : 'glass text-white/70 hover:scale-105'
                  }`}
                >
                  {student.full_name}
                </button>
              ))}
            </div>
          </div>

          {selectedStudentData && (
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-8">
                <GraduationCap className="w-10 h-10 text-purple-400" />
                <div>
                  <h3 className="text-2xl font-bold text-white text-glow">{selectedStudentData.full_name}</h3>
                  <p className="text-sm text-white/70">{selectedStudentData.email}</p>
                </div>
              </div>

              <h4 className="text-xl font-bold text-white mb-6 text-glow">Sınav Sonuçları</h4>

              {resultsLoading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
                </div>
              ) : examResults.length === 0 ? (
                <div className="text-center py-12 glass-dark rounded-xl">
                  <FileText className="w-16 h-16 text-white/60 mx-auto mb-4" />
                  <p className="text-white/80 text-lg">Henüz tamamlanmış sınav bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {examResults.map(result => (
                    <div
                      key={result.id}
                      className="glass-dark rounded-2xl p-6 border-2 border-purple-400/30 hover:scale-105 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h5 className="font-bold text-white text-lg mb-2">{result.exam_title}</h5>
                          <p className="text-sm text-white/70 mb-3">{result.exam_description}</p>
                          <div className="flex items-center gap-6 text-sm text-white/60">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span>{result.question_count} Soru</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{result.duration_minutes} Dakika</span>
                            </div>
                            <div>
                              {new Date(result.submitted_at).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-white mb-2 text-glow">
                            {Math.round(result.score_percentage)}%
                          </div>
                          <div className="text-xs text-white/70">Başarı Oranı</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="glass border-2 border-green-400/30 rounded-xl p-4 text-center">
                          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white text-glow">{result.correct_count}</div>
                          <div className="text-xs text-white/70">Doğru</div>
                        </div>
                        <div className="glass border-2 border-red-400/30 rounded-xl p-4 text-center">
                          <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white text-glow">{result.wrong_count}</div>
                          <div className="text-xs text-white/70">Yanlış</div>
                        </div>
                        <div className="glass border-2 border-white/20 rounded-xl p-4 text-center">
                          <AlertCircle className="w-6 h-6 text-white/60 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white text-glow">{result.empty_count}</div>
                          <div className="text-xs text-white/70">Boş</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  );
}
