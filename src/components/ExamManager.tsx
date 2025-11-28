import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Plus, X, Upload, Trash2, Users as UsersIcon } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description: string;
  pdf_url: string;
  duration_minutes: number;
  question_count: number;
  created_at: string;
}

interface AnswerKey {
  question_number: number;
  correct_answer: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
}

export function ExamManager() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    question_count: 0,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchExams();
      fetchStudents();
    }
  }, [user?.id]);

  const fetchExams = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching exams:', error);
    } else {
      setExams(data || []);
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('student_assignments')
      .select('student:users!student_id(id, email, full_name)')
      .eq('teacher_id', user.id);

    if (error) {
      console.error('Error fetching students:', error);
      alert('Öğrenci listesi yüklenirken hata oluştu: ' + error.message);
    } else {
      const uniqueStudents = Array.from(
        new Map(
          data
            ?.filter((item: any) => item.student !== null)
            .map((item: any) => [item.student.id, item.student])
        ).values()
      ) as Student[];
      setStudents(uniqueStudents);
      console.log('Fetched students for exam assignment:', uniqueStudents);
    }
  };

  const handleCreateExam = async () => {
    if (!pdfFile || !formData.title || formData.question_count === 0 || answerKeys.length !== formData.question_count) {
      alert('Lütfen tüm alanları doldurun ve tüm soruların cevap anahtarını girin.');
      return;
    }

    setUploading(true);

    try {
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('exam-pdfs')
        .upload(fileName, pdfFile);

      if (uploadError) throw uploadError;

      const { data: examData, error: examError } = await supabase
        .from('exams')
        .insert({
          teacher_id: user!.id,
          title: formData.title,
          description: formData.description,
          pdf_url: fileName,
          duration_minutes: formData.duration_minutes,
          question_count: formData.question_count,
        })
        .select()
        .single();

      if (examError) throw examError;

      const answerKeyData = answerKeys.map(ak => ({
        exam_id: examData.id,
        question_number: ak.question_number,
        correct_answer: ak.correct_answer,
      }));

      const { error: keyError } = await supabase
        .from('exam_answer_keys')
        .insert(answerKeyData);

      if (keyError) throw keyError;

      alert('Sınav başarıyla oluşturuldu!');
      setShowCreateModal(false);
      resetForm();
      fetchExams();
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Sınav oluşturulurken hata oluştu.');
    }

    setUploading(false);
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Bu sınavı silmek istediğinizden emin misiniz?')) return;

    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    if (error) {
      console.error('Error deleting exam:', error);
      alert('Sınav silinirken hata oluştu.');
    } else {
      fetchExams();
    }
  };

  const handleAssignExam = async () => {
    if (!selectedExam || selectedStudents.length === 0) {
      alert('Lütfen sınav ve en az bir öğrenci seçin.');
      return;
    }

    const assignmentData = selectedStudents.map(studentId => ({
      exam_id: selectedExam,
      student_id: studentId,
      teacher_id: user!.id,
    }));

    const { error } = await supabase
      .from('exam_assignments')
      .insert(assignmentData);

    if (error) {
      console.error('Error assigning exam:', error);
      alert('Sınav ataması yapılırken hata oluştu.');
    } else {
      alert('Sınav başarıyla atandı!');
      setShowAssignModal(false);
      setSelectedExam('');
      setSelectedStudents([]);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration_minutes: 60,
      question_count: 0,
    });
    setPdfFile(null);
    setAnswerKeys([]);
  };

  const generateAnswerKeyInputs = (count: number) => {
    const newAnswerKeys: AnswerKey[] = [];
    for (let i = 1; i <= count; i++) {
      const existing = answerKeys.find(ak => ak.question_number === i);
      newAnswerKeys.push(existing || { question_number: i, correct_answer: 'A' });
    }
    setAnswerKeys(newAnswerKeys);
  };

  const updateAnswerKey = (questionNumber: number, answer: string) => {
    setAnswerKeys(prev =>
      prev.map(ak =>
        ak.question_number === questionNumber
          ? { ...ak, correct_answer: answer }
          : ak
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white text-glow">Sınav Yönetimi</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn-glass border-blue-400/40 hover:border-blue-400/60 flex items-center space-x-2 px-6 py-3"
          >
            <UsersIcon className="w-5 h-5" />
            <span className="font-semibold">Sınav Ata</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-glass border-green-400/40 hover:border-green-400/60 flex items-center space-x-2 px-6 py-3"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Yeni Sınav</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12 glass rounded-2xl">
          <FileText className="w-16 h-16 text-white/60 mx-auto mb-4" />
          <p className="text-white/80 text-lg">Henüz sınav oluşturmadınız.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <div key={exam.id} className="glass rounded-2xl p-6 hover:scale-105 transition-all duration-300 border-2 border-white/20">
              <div className="flex items-start justify-between mb-4">
                <FileText className="w-10 h-10 text-green-400" />
                <button
                  onClick={() => handleDeleteExam(exam.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{exam.title}</h3>
              <p className="text-sm text-white/70 mb-4">{exam.description}</p>
              <div className="space-y-2 text-sm text-white/80">
                <p className="font-semibold">Soru Sayısı: {exam.question_count}</p>
                <p className="font-semibold">Süre: {exam.duration_minutes} dakika</p>
                <p className="text-white/60 text-xs">Oluşturma: {new Date(exam.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Sınav Oluştur</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sınav Başlığı
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Örn: Matematik 1. Dönem Sınavı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    rows={3}
                    placeholder="Sınav hakkında bilgi"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Süre (Dakika)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soru Sayısı
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={formData.question_count || ''}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, question_count: count });
                        if (count > 0) generateAnswerKeyInputs(count);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF Dosyası
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition">
                      <Upload className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {pdfFile ? pdfFile.name : 'PDF Dosyası Seçin'}
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {formData.question_count > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Cevap Anahtarı ({answerKeys.length}/{formData.question_count})
                    </label>
                    <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                      {answerKeys.map(ak => (
                        <div key={ak.question_number} className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700 w-8">
                            {ak.question_number}.
                          </span>
                          <select
                            value={ak.correct_answer}
                            onChange={(e) => updateAnswerKey(ak.question_number, e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                İptal
              </button>
              <button
                onClick={handleCreateExam}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {uploading ? 'Oluşturuluyor...' : 'Sınav Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Sınav Ata</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedExam('');
                  setSelectedStudents([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sınav Seçin
                  </label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    <option value="">Sınav seçiniz...</option>
                    {exams.map(exam => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Öğrenciler ({selectedStudents.length} seçili)
                  </label>
                  <div className="border border-gray-300 rounded-lg divide-y max-h-64 overflow-y-auto">
                    {students.length === 0 ? (
                      <div className="p-8 text-center">
                        <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm">
                          Size atanmış öğrenci bulunmuyor.
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          Yönetici tarafından öğrenci ataması yapılması gerekiyor.
                        </p>
                      </div>
                    ) : (
                      students.map(student => (
                        <div
                          key={student.id}
                          onClick={() => {
                            setSelectedStudents(prev =>
                              prev.includes(student.id)
                                ? prev.filter(id => id !== student.id)
                                : [...prev, student.id]
                            );
                          }}
                          className="p-3 flex items-center space-x-3 cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => {}}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                            <div className="text-xs text-gray-600">{student.email}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedExam('');
                  setSelectedStudents([]);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                İptal
              </button>
              <button
                onClick={handleAssignExam}
                disabled={!selectedExam || selectedStudents.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                Ata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
