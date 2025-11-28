import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PDFViewer } from './PDFViewer';
import { OpticalForm } from './OpticalForm';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

interface ExamTakingProps {
  assignment: ExamAssignment;
  onComplete: () => void;
}

export function ExamTaking({ assignment, onComplete }: ExamTakingProps) {
  const { user } = useAuth();
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(assignment.exam.duration_minutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<ExamAssignment | null>(null);

  useEffect(() => {
    initializeSubmission();
    loadPdfUrl();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const loadPdfUrl = async () => {
    try {
      console.log('Loading PDF from path:', assignment.exam.pdf_url);

      const { data, error } = await supabase.storage
        .from('exam-pdfs')
        .createSignedUrl(assignment.exam.pdf_url, 7200);

      if (error) {
        console.error('Storage error:', error);
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error('No signed URL returned');
      }

      console.log('PDF URL loaded successfully:', data.signedUrl);
      setPdfUrl(data.signedUrl);
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      alert(`PDF yüklenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}\n\nLütfen eğitmeninizle iletişime geçin.`);
    }
  };

  const initializeSubmission = async () => {
    const { data: existingSubmission } = await supabase
      .from('exam_submissions')
      .select('id, exam_answers(question_number, student_answer)')
      .eq('exam_assignment_id', assignment.id)
      .maybeSingle();

    if (existingSubmission) {
      setSubmissionId(existingSubmission.id);
      const existingAnswers: Record<number, string> = {};
      existingSubmission.exam_answers?.forEach((ans: any) => {
        if (ans.student_answer) {
          existingAnswers[ans.question_number] = ans.student_answer;
        }
      });
      setAnswers(existingAnswers);
    } else {
      const { data: newSubmission, error } = await supabase
        .from('exam_submissions')
        .insert({
          exam_assignment_id: assignment.id,
          student_id: user!.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating submission:', error);
        alert('Sınav başlatılırken hata oluştu.');
        return;
      }

      setSubmissionId(newSubmission.id);
    }
  };

  const handleAnswerChange = async (questionNumber: number, answer: string | null) => {
    if (!submissionId) return;

    const newAnswers = { ...answers };
    if (answer === null) {
      delete newAnswers[questionNumber];
    } else {
      newAnswers[questionNumber] = answer;
    }
    setAnswers(newAnswers);

    if (answer === null) {
      await supabase
        .from('exam_answers')
        .delete()
        .eq('submission_id', submissionId)
        .eq('question_number', questionNumber);
    } else {
      await supabase
        .from('exam_answers')
        .upsert({
          submission_id: submissionId,
          question_number: questionNumber,
          student_answer: answer,
        });
    }
  };

  const handleSubmit = async () => {
    if (!submissionId) return;

    if (!confirm('Sınavı teslim etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    setIsSubmitting(true);

    try {
      const examId = assignment.exam_id || assignment.exam?.id;

      if (!examId) {
        alert('HATA: Sınav ID bulunamadı!');
        setIsSubmitting(false);
        return;
      }

      const { data: answerKeys, error: keyError } = await supabase
        .from('exam_answer_keys')
        .select('question_number, correct_answer')
        .eq('exam_id', examId);

      if (keyError) throw keyError;

      if (!answerKeys || answerKeys.length === 0) {
        alert('HATA: Cevap anahtarı bulunamadı! Eğitmeninizle iletişime geçin.');
        setIsSubmitting(false);
        return;
      }

      const keyMap = new Map<number, string>();
      answerKeys.forEach(ak => {
        const cleaned = String(ak.correct_answer).trim().toUpperCase();
        keyMap.set(ak.question_number, cleaned);
      });

      let correctCount = 0;
      let wrongCount = 0;
      let emptyCount = 0;

      const answerUpdates = [];
      for (let i = 1; i <= assignment.exam.question_count; i++) {
        const rawStudent = answers[i];
        const studentAnswer = rawStudent ? String(rawStudent).trim().toUpperCase() : null;
        const correctAnswer = keyMap.get(i);
        let isCorrect = false;

        if (!studentAnswer) {
          emptyCount++;
        } else if (correctAnswer && studentAnswer === correctAnswer) {
          correctCount++;
          isCorrect = true;
        } else {
          wrongCount++;
        }

        if (studentAnswer) {
          answerUpdates.push({
            submission_id: submissionId,
            question_number: i,
            student_answer: studentAnswer,
            is_correct: isCorrect,
          });
        }
      }

      if (answerUpdates.length > 0) {
        console.log('Inserting answers:', answerUpdates.length);

        const { error: deleteError } = await supabase
          .from('exam_answers')
          .delete()
          .eq('submission_id', submissionId);

        if (deleteError) {
          console.error('Error deleting old answers:', deleteError);
        }

        const { error: answersError } = await supabase
          .from('exam_answers')
          .insert(answerUpdates);

        if (answersError) {
          console.error('Error inserting answers:', answersError);
          throw new Error(`Cevaplar kaydedilemedi: ${answersError.message}`);
        }
      }

      const scorePercentage = Math.round((correctCount / assignment.exam.question_count) * 100);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      console.log('Updating submission with results:', { correctCount, wrongCount, emptyCount, scorePercentage });

      const { error: updateError } = await supabase
        .from('exam_submissions')
        .update({
          submitted_at: new Date().toISOString(),
          time_spent_seconds: timeSpent,
          correct_count: correctCount,
          wrong_count: wrongCount,
          empty_count: emptyCount,
          score_percentage: scorePercentage,
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('Error updating submission:', updateError);
        throw new Error(`Sınav sonucu güncellenemedi: ${updateError.message}`);
      }

      setResultData({
        ...assignment,
        submission: {
          id: submissionId,
          submitted_at: new Date().toISOString(),
          correct_count: correctCount,
          wrong_count: wrongCount,
          empty_count: emptyCount,
          score_percentage: scorePercentage,
        },
      });
      setShowResult(true);
    } catch (error: any) {
      console.error('Error submitting exam:', error);
      const errorMessage = error?.message || 'Bilinmeyen bir hata oluştu';
      alert(`Sınav teslim edilirken hata oluştu:\n\n${errorMessage}\n\nLütfen tekrar deneyin veya eğitmeninizle iletişime geçin.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 300) return 'text-green-400';
    if (timeLeft > 60) return 'text-orange-400';
    return 'text-red-400';
  };

  if (showResult && resultData) {
    return <ExamResult assignment={resultData} onBack={onComplete} />;
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      <div className="glass-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white text-glow">{assignment.exam.title}</h1>
              <p className="text-sm text-white/70">{assignment.exam.description}</p>
            </div>

            <div className="flex items-center space-x-6">
              <div className="glass rounded-2xl px-6 py-3 flex items-center space-x-3">
                <Clock className={`w-6 h-6 ${getTimeColor()}`} />
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getTimeColor()} text-glow`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-xs text-white/60">Kalan Süre</div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-glass border-green-400/40 hover:border-green-400/60 px-8 py-4 font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'Teslim Ediliyor...' : 'Sınavı Teslim Et'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden bg-white">
          {pdfUrl ? (
            <PDFViewer url={pdfUrl} />
          ) : (
            <div className="flex items-center justify-center h-full bg-slate-950">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
            </div>
          )}
        </div>

        <div className="w-96 border-l border-white/10 bg-slate-950/50">
          <OpticalForm
            questionCount={assignment.exam.question_count}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            isSubmitted={false}
          />
        </div>
      </div>
    </div>
  );
}

interface ExamResultProps {
  assignment: ExamAssignment;
  onBack: () => void;
}

export function ExamResult({ assignment, onBack }: ExamResultProps) {
  const submission = assignment.submission!;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl shadow-2xl max-w-2xl w-full p-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full glass-dark border-2 border-green-400/40 mb-6">
            <CheckCircle className="w-14 h-14 text-green-400" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-3 text-glow">Sınav Tamamlandı!</h2>
          <p className="text-white/70 text-lg">{assignment.exam.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="glass-dark border-2 border-green-400/30 rounded-2xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <div className="text-4xl font-bold text-white text-glow mb-2">{submission.correct_count}</div>
            <div className="text-sm text-white/70">Doğru</div>
          </div>

          <div className="glass-dark border-2 border-red-400/30 rounded-2xl p-6 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <div className="text-4xl font-bold text-white text-glow mb-2">{submission.wrong_count}</div>
            <div className="text-sm text-white/70">Yanlış</div>
          </div>

          <div className="glass-dark border-2 border-white/20 rounded-2xl p-6 text-center">
            <AlertCircle className="w-10 h-10 text-white/60 mx-auto mb-3" />
            <div className="text-4xl font-bold text-white text-glow mb-2">{submission.empty_count}</div>
            <div className="text-sm text-white/70">Boş</div>
          </div>

          <div className="glass-dark border-2 border-blue-400/30 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-white text-glow mb-2">{Math.round(submission.score_percentage)}%</div>
            <div className="text-sm text-white/70">Başarı Oranı</div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onBack}
            className="btn-glass border-white/40 hover:border-white/60 px-12 py-4 font-bold text-lg"
          >
            Sınavlara Dön
          </button>
        </div>
      </div>
    </div>
  );
}
