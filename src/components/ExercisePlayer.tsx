import React, { useState, useEffect, useRef } from 'react';
import { Exercise } from '../types';
import { Button } from './ui/button';
import { CheckCircle, XCircle, ArrowRight, Trophy, AlertCircle } from 'lucide-react';
import { Confetti } from './ui/Confetti';
import { submitTaskResult } from '../lib/moodle';
import { toast } from 'sonner@2.0.3';

interface ExercisePlayerProps {
  exercise: Exercise;
  onComplete: (score: number, answers: any[]) => void;
  onExit: () => void;
  studentName?: string;
}

export const ExercisePlayer: React.FC<ExercisePlayerProps> = ({ 
  exercise, 
  onComplete, 
  onExit, 
  studentName 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // ✅ USAR REF PARA ACUMULAR RESPUESTAS SIN PERDERLAS
  const answersRef = useRef<any[]>([]);

  const currentQuestion = exercise.questions[currentIndex];

  useEffect(() => {
    // Reset al cambiar pregunta
    setSelectedOption(null);
    setTextInput('');
    setFeedbackState('idle');
  }, [currentIndex]);

  const handleCheckAnswer = () => {
    let isCorrect = false;
    let val: any = "---";
    
    // 1. Validar según tipo
    if (currentQuestion.type === 'choice' || currentQuestion.type === 'true_false') {
      val = selectedOption;
      isCorrect = selectedOption === currentQuestion.correct_answer;
    } else if (currentQuestion.type === 'fill_blank') {
      val = textInput;
      isCorrect = textInput.trim().toLowerCase() === currentQuestion.correct_answer?.toLowerCase();
    } else if (currentQuestion.type === 'open') {
      val = textInput;
      isCorrect = true;
    }

    // 2. Guardar en el REF (Seguro)
    answersRef.current.push({
      questionText: currentQuestion.question_text,
      studentAnswer: val,
      correctAnswer: currentQuestion.correct_answer,
      isCorrect,
      type: currentQuestion.type
    });

    console.log("💾 Guardando respuesta en REF:", answersRef.current[answersRef.current.length - 1]);
    console.log("📊 Total respuestas acumuladas:", answersRef.current.length);

    if (isCorrect) { 
      setFeedbackState('correct'); 
      setScore(s => s + 1); 
    } else { 
      setFeedbackState('incorrect'); 
    }
  };

  const handleNext = () => {
    if (currentIndex < exercise.questions.length - 1) {
      setCurrentIndex(p => p + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    setIsFinished(true);
    if (score / exercise.questions.length >= 0.5) setShowConfetti(true);
    
    console.log("🏁 Finalizando ejercicio con", answersRef.current.length, "respuestas");
    
    // ✅ Pasar answersRef.current a onComplete
    onComplete(score, answersRef.current);
  };

  // ✅ RENDER HUECOS MEJORADO (Visual)
  const renderFillBlank = () => {
    // Separa por [...] o por 3+ guiones bajos
    const parts = currentQuestion.question_text.split(/\[...\]|_{3,}/);
    
    return (
      <div className="mb-6">
        <p className="text-lg md:text-xl text-slate-700 leading-relaxed flex flex-wrap items-center gap-2">
          {parts.map((part, idx) => (
            <React.Fragment key={idx}>
              <span>{part}</span>
              {idx < parts.length - 1 && (
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={feedbackState !== 'idle'}
                  className="inline-block min-w-[120px] px-3 py-2 border-b-2 border-indigo-300 bg-indigo-50 rounded text-center font-bold text-indigo-700 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  placeholder="..."
                />
              )}
            </React.Fragment>
          ))}
        </p>
      </div>
    );
  };

  // ✅ RENDER ABIERTA (Visual)
  const renderOpen = () => (
    <div className="mb-6">
      <textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        disabled={feedbackState !== 'idle'}
        rows={6}
        className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none text-slate-700 disabled:opacity-60"
        placeholder="Escribe tu respuesta aquí..."
      />
    </div>
  );

  if (isFinished) {
    const finalGrade = (score / exercise.questions.length) * 10;

    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        {showConfetti && <Confetti />}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-2xl text-center border-b-8 border-emerald-200">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
            ¡Ejercicio Completado!
          </h1>

          <p className="text-slate-600 mb-8">
            Has finalizado <span className="font-bold text-indigo-600">{exercise.title}</span>
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <p className="text-xs font-black text-indigo-400 uppercase">Nota</p>
              <p className="text-4xl font-black text-indigo-600">{finalGrade.toFixed(1)}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-xs font-black text-emerald-500 uppercase">Aciertos</p>
              <p className="text-4xl font-black text-emerald-600">{score}/{exercise.questions.length}</p>
            </div>
          </div>

          <Button 
            onClick={() => { onExit(); }} 
            className="w-full h-14 bg-slate-800 text-white font-black rounded-2xl text-lg"
          >
            Volver al Menú
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* ✅ CONTENEDOR SCROLLABLE */}
      <div className="h-full w-full overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4 pb-20">
          <div className="w-full max-w-3xl flex flex-col items-center">
            
            {/* Header (X y Progreso) */}
            <div className="w-full max-w-3xl mb-6 flex items-center justify-between shrink-0">
              <button 
                onClick={onExit} 
                className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-rose-500 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <div className="flex-1 mx-4 h-3 bg-white rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500" 
                  style={{ width: `${((currentIndex + 1) / exercise.questions.length) * 100}%` }}
                />
              </div>
              <div className="bg-white px-3 py-1 rounded-xl font-black text-indigo-600 shadow-sm text-sm">
                {currentIndex + 1} / {exercise.questions.length}
              </div>
            </div>

            {/* TARJETA DE PREGUNTA */}
            <div className="w-full max-w-3xl bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border-b-8 border-slate-200 relative overflow-hidden">
              
              {/* Título Pregunta */}
              <h2 className="text-xl md:text-3xl font-black text-slate-800 mb-6 md:mb-8 text-center leading-tight">
                {currentQuestion.type === 'fill_blank' 
                  ? 'Completa la frase:' 
                  : currentQuestion.question_text.replace('[...]', '_____')
                }
              </h2>
              
              {/* Renderizadores */}
              {currentQuestion.type === 'choice' && (
                <div className="grid gap-3">
                  {currentQuestion.options.map(opt => (
                    <button 
                      key={opt} 
                      onClick={() => setSelectedOption(opt)} 
                      disabled={feedbackState !== 'idle'}
                      className={`p-4 md:p-5 rounded-2xl border-2 text-left font-bold text-base md:text-lg transition-all active:scale-98 ${
                        selectedOption === opt 
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  {['Verdadero', 'Falso'].map(opt => (
                    <button 
                      key={opt} 
                      onClick={() => setSelectedOption(opt)} 
                      disabled={feedbackState !== 'idle'}
                      className={`py-6 md:py-8 rounded-2xl border-b-4 font-black text-lg md:text-2xl transition-all active:translate-y-1 active:border-b-0 ${
                        selectedOption === opt 
                          ? (opt === 'Verdadero' 
                              ? 'bg-emerald-500 text-white border-emerald-700' 
                              : 'bg-rose-500 text-white border-rose-700'
                            )
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'fill_blank' && renderFillBlank()}
              
              {currentQuestion.type === 'open' && renderOpen()}

              {/* Feedback Message */}
              {feedbackState !== 'idle' && (
                <div className={`mt-6 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-bottom-2 ${
                  feedbackState === 'correct' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                }`}>
                  {feedbackState === 'correct' ? (
                    <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">
                      {feedbackState === 'correct' ? '¡Correcto!' : 'Respuesta Incorrecta'}
                    </p>
                    {currentQuestion.explanation && (
                      <p className="text-sm opacity-90 mt-1">{currentQuestion.explanation}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN DE ACCIÓN */}
            <div className="w-full max-w-3xl mt-6 md:mt-8">
              {feedbackState === 'idle' ? (
                <Button 
                  onClick={handleCheckAnswer} 
                  disabled={!selectedOption && !textInput}
                  className="w-full h-14 md:h-16 text-lg md:text-xl font-black rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50 shadow-xl"
                >
                  COMPROBAR
                </Button>
              ) : (
                <Button 
                  onClick={handleNext} 
                  className={`w-full h-14 md:h-16 text-lg md:text-xl font-black rounded-2xl text-white border-b-4 active:translate-y-1 active:border-b-0 transition-all shadow-xl ${
                    feedbackState === 'correct' 
                      ? 'bg-emerald-500 border-emerald-700 hover:bg-emerald-600' 
                      : 'bg-slate-700 border-slate-900 hover:bg-slate-800'
                  }`}
                >
                  CONTINUAR <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};