import { useState } from 'react';
import { Check } from 'lucide-react';

interface OpticalFormProps {
  questionCount: number;
  answers: Record<number, string>;
  onAnswerChange: (questionNumber: number, answer: string | null) => void;
  isSubmitted: boolean;
}

const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

export function OpticalForm({ questionCount, answers, onAnswerChange, isSubmitted }: OpticalFormProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  const handleOptionClick = (questionNumber: number, option: string) => {
    if (isSubmitted) return;

    if (answers[questionNumber] === option) {
      onAnswerChange(questionNumber, null);
    } else {
      onAnswerChange(questionNumber, option);
    }
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(a => a !== null && a !== undefined).length;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="glass-dark border-b border-white/10 p-6">
        <h3 className="font-bold text-white text-xl mb-3 text-glow">Optik Form</h3>
        <div className="text-sm text-white/80">
          <p className="font-semibold">Cevaplanan: {getAnsweredCount()} / {questionCount}</p>
          <p className="text-xs mt-1 text-white/60">Boş: {questionCount - getAnsweredCount()}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {Array.from({ length: questionCount }, (_, i) => i + 1).map(questionNumber => {
            const currentAnswer = answers[questionNumber];
            const isAnswered = currentAnswer !== null && currentAnswer !== undefined;

            return (
              <div
                key={questionNumber}
                className={`glass rounded-xl p-4 transition-all duration-200 ${
                  selectedQuestion === questionNumber
                    ? 'border-2 border-green-400 scale-105'
                    : isAnswered
                    ? 'border-2 border-green-400/40'
                    : 'border-2 border-white/20'
                }`}
                onMouseEnter={() => setSelectedQuestion(questionNumber)}
                onMouseLeave={() => setSelectedQuestion(null)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-white">
                    Soru {questionNumber}
                  </span>
                  {isAnswered && (
                    <span className="text-xs text-green-400 flex items-center font-semibold">
                      <Check className="w-4 h-4 mr-1" />
                      Cevaplandı
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  {OPTIONS.map(option => {
                    const isSelected = currentAnswer === option;

                    return (
                      <button
                        key={option}
                        onClick={() => handleOptionClick(questionNumber, option)}
                        disabled={isSubmitted}
                        className={`flex-1 py-3 px-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                          isSelected
                            ? 'glass-dark border-2 border-green-400 text-white scale-110 shadow-lg shadow-green-400/20'
                            : 'glass-dark border border-white/20 text-white/70 hover:scale-105 hover:border-white/40'
                        } ${
                          isSubmitted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10 p-4 glass-dark">
        <div className="text-xs text-white/80 mb-3 text-center font-bold">
          Soru Haritası
        </div>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: questionCount }, (_, i) => i + 1).map(qNum => {
            const isAnswered = answers[qNum] !== null && answers[qNum] !== undefined;

            return (
              <div
                key={qNum}
                className={`w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center transition-all ${
                  isAnswered
                    ? 'glass-dark border border-green-400 text-white shadow-sm shadow-green-400/20'
                    : 'glass-dark border border-white/20 text-white/60'
                }`}
              >
                {qNum}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
