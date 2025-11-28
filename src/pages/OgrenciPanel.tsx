import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, GraduationCap, FileText, Clock, CheckCircle, Play } from 'lucide-react';
import { ExamTaking } from '../components/ExamTaking';
import { PanelLayout } from '../components/PanelLayout';

interface ExamAssignment {
  id: string;
  exam_id: string;
  exam: {
    id: string;
    title: string;
    description: string;
    pdf_url: string;
    duration_minutes: number;
    question_count: number;
  };
  submission?: {
    id: string;
    submitted_at: string | null;
    correct_count: number;
    wrong_count: number;
    empty_count: number;
    score_percentage: number;
  };
}

export function OgrenciPanel() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ExamAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<ExamAssignment | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchAssignments();
    }
  }, [user?.id]);

  const fetchAssignments = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('exam_assignments')
      .select(`
        id,
        exam_id,
        exam:exams (
          id,
          title,
          description,
          pdf_url,
          duration_minutes,
          question_count
        ),
        submission:exam_submissions (
          id,
          submitted_at,
          correct_count,
          wrong_count,
          empty_count,
          score_percentage
        )
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error);
    } else {
      const formattedData = data.map((item: any) => ({
        id: item.id,
        exam_id: item.exam_id,
        exam: item.exam,
        submission: item.submission?.[0] || undefined,
      }));
      setAssignments(formattedData);
    }
    setLoading(false);
  };

  const handleStartExam = (assignment: ExamAssignment) => {
    setActiveExam(assignment);
  };

  const handleExamComplete = () => {
    setActiveExam(null);
    fetchAssignments();
  };

  if (activeExam) {
    return <ExamTaking assignment={activeExam} onComplete={handleExamComplete} />;
  }

  return (
    <PanelLayout
      title="Öğrenci Paneli"
      icon={<GraduationCap className="w-8 h-8 text-white" />}
      userEmail={user?.email}
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white text-glow">Sınavlarım</h2>
        <p className="text-white/70 mt-2">Size atanan sınavları görüntüleyin ve çözün</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center shadow-2xl shadow-white/10">
          <FileText className="w-20 h-20 text-white/60 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-3 text-glow">Henüz Sınav Yok</h3>
          <p className="text-white/70 text-lg">
            Size atanmış sınav bulunmuyor. Eğitmeniniz tarafından sınav ataması yapılmasını bekleyin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map(assignment => {
            const isCompleted = assignment.submission?.submitted_at;
            return (
              <div
                key={assignment.id}
                className={`glass rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${
                  isCompleted ? 'border-2 border-green-400/50' : 'border-2 border-blue-400/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <FileText className={`w-8 h-8 ${isCompleted ? 'text-green-400' : 'text-blue-400'}`} />
                  {isCompleted && (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                </div>

                <h3 className="font-bold text-white mb-2 text-lg">{assignment.exam.title}</h3>
                <p className="text-sm text-white/70 mb-4">{assignment.exam.description}</p>

                <div className="space-y-2 text-sm text-white/80 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{assignment.exam.question_count} Soru</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{assignment.exam.duration_minutes} Dakika</span>
                  </div>
                </div>

                {isCompleted && assignment.submission ? (
                  <div className="space-y-3">
                    <div className="glass-dark rounded-xl p-4 border border-green-400/30">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white mb-2 text-glow">
                          {Math.round(assignment.submission.score_percentage)}%
                        </div>
                        <div className="text-xs text-white/70">Başarı Oranı</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
                        <div>
                          <div className="font-bold text-green-400 text-lg">{assignment.submission.correct_count}</div>
                          <div className="text-white/70">Doğru</div>
                        </div>
                        <div>
                          <div className="font-bold text-red-400 text-lg">{assignment.submission.wrong_count}</div>
                          <div className="text-white/70">Yanlış</div>
                        </div>
                        <div>
                          <div className="font-bold text-white/70 text-lg">{assignment.submission.empty_count}</div>
                          <div className="text-white/70">Boş</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-center text-white/60">
                      Tamamlandı: {new Date(assignment.submission.submitted_at!).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartExam(assignment)}
                    className="w-full btn-glass py-3 flex items-center justify-center gap-2 font-semibold"
                  >
                    <Play className="w-4 h-4" />
                    Sınava Başla
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PanelLayout>
  );
}
