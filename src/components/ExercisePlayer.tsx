import React, { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { Button } from './ui/button';
import { CheckCircle, XCircle, ArrowRight, Trophy, AlertCircle } from 'lucide-react';
import { Confetti } from './ui/Confetti';
import { submitTaskResult } from '../lib/moodle';
import { toast } from 'sonner@2.0.3';

interface ExercisePlayerProps {
  exercise: Exercise;
  onComplete: (score: number, answers: any[]) => void; // ✅ CORRECCIÓN: Añadir parámetro answers
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
  const [allAnswers, setAllAnswers] = useState<any[]>([]); // Acumulador de respuestas

  const currentQuestion = exercise.questions[currentIndex];

  useEffect(() => {
    setSelectedOption(null);
    setTextInput('');
    setFeedbackState('idle');
  }, [currentIndex]);

  const handleCheckAnswer = () => {
    let isCorrect = false;
    let val: any = null;
    const qType = currentQuestion.type;

    if (qType === 'choice' || qType === 'true_false') {
      isCorrect = selectedOption === currentQuestion.correct_answer;
      val = selectedOption;
    } else if (qType === 'fill_blank') {
      isCorrect = textInput.trim().toLowerCase() === currentQuestion.correct_answer?.toLowerCase();
      val = textInput;
    } else if (qType === 'open') {
      isCorrect = true; // Se marca como completado, corrección manual
      val = textInput;
    }

    // GUARDAR RESPUESTA DETALLADA
    const answerRecord = {
      questionText: currentQuestion.question_text,
      studentAnswer: val,
      correctAnswer: currentQuestion.correct_answer,
      isCorrect: isCorrect,
      type: qType
    };
    
    console.log("💾 Guardando respuesta:", answerRecord);
    setAllAnswers(prev => [...prev, answerRecord]);

    if (isCorrect) { 
      setFeedbackState('correct'); 
      setScore(s => s + 1); 
    } else { 
      setFeedbackState('incorrect'); 
    }
  };

  const handleNext = () => {
    if (currentIndex < exercise.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    setIsFinished(true);
    if (score / exercise.questions.length >= 0.5) setShowConfetti(true);

    if (studentName) {
      toast.loading("Guardando respuestas...");
      
      console.log("📝 Finalizando ejercicio:");
      console.log("  - score:", score);
      console.log("  - total:", exercise.questions.length);
      console.log("  - allAnswers:", allAnswers);
      
      await submitTaskResult(
        exercise.title, 
        studentName, 
        score, 
        exercise.questions.length, 
        allAnswers
      );
      
      toast.dismiss();
      toast.success("✅ Tarea enviada al profesor");
    }
  };

  // RENDERER PARA PREGUNTAS ABIERTAS
  const renderOpen = () => (
    <div className="py-8">
      <textarea
        value={textInput}
        onChange={e => setTextInput(e.target.value)}
        className="w-full min-h-[200px] p-6 border-2 border-slate-300 rounded-2xl text-lg text-slate-800 bg-white focus:border-indigo-500 outline-none resize-none"
        placeholder="Escribe tu respuesta aquí..."
        disabled={feedbackState !== 'idle'}
      />
    </div>
  );

  if (isFinished) {
    const finalGrade = (score / exercise.questions.length) * 10;
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        {showConfetti && <Confetti />}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-2xl border-b-8 border-indigo-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mb-6 shadow-lg">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
              ¡Ejercicio Completado!
            </h1>
            <p className="text-slate-500 text-lg">
              Has terminado <span className="font-bold text-indigo-600">{exercise.title}</span>
            </p>
          </div>

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
            onClick={() => { onComplete(score, allAnswers); onExit(); }} 
            className="w-full h-14 bg-slate-800 text-white font-black rounded-2xl text-lg"
          >
            Volver al Menú
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 w-full max-w-3xl border-b-8 border-indigo-200">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Pregunta {currentIndex + 1} de {exercise.questions.length}
            </span>
            <span className="text-sm font-bold text-indigo-600">
              {Math.round(((currentIndex + 1) / exercise.questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" 
              style={{ width: `${((currentIndex + 1) / exercise.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-8 mt-4 text-center leading-tight">
          {currentQuestion.type === 'fill_blank' 
            ? 'Completa la frase:' 
            : currentQuestion.question_text.replace('[...]', '_____')}
        </h2>

        {currentQuestion.type === 'choice' && (
          <div className="grid gap-3">
            {currentQuestion.options.map(opt => (
              <button
                key={opt}
                onClick={() => setSelectedOption(opt)}
                disabled={feedbackState !== 'idle'}
                className={`p-5 rounded-2xl border-2 text-left font-bold text-lg transition-all ${
                  selectedOption === opt
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                } ${
                  feedbackState === 'correct' && selectedOption === opt
                    ? '!border-emerald-500 !bg-emerald-50 !text-emerald-700'
                    : feedbackState === 'incorrect' && selectedOption === opt
                    ? '!border-rose-500 !bg-rose-50 !text-rose-700'
                    : ''
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.type === 'true_false' && (
          <div className="grid grid-cols-2 gap-4">
            {['Verdadero', 'Falso'].map(opt => (
              <button
                key={opt}
                onClick={() => setSelectedOption(opt)}
                disabled={feedbackState !== 'idle'}
                className={`py-8 rounded-2xl border-b-4 font-black text-xl md:text-2xl transition-all active:translate-y-1 active:border-b-0 ${
                  selectedOption === opt
                    ? (opt === 'Verdadero' 
                      ? 'bg-emerald-500 text-white border-emerald-700' 
                      : 'bg-rose-500 text-white border-rose-700')
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.type === 'fill_blank' && (() => {
          // ✅ CORRECCIÓN: Renderizado con flex-wrap para frases largas
          const parts = currentQuestion.question_text.split(/\[\.\.\.\]|___/); // Soporta [...] o ___
          return (
            <div className="mt-6 bg-white p-6 rounded-3xl border-b-4 border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-4 text-xl md:text-2xl font-medium text-slate-700 leading-relaxed text-center">
                {parts[0] && <span>{parts[0]}</span>}
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={feedbackState !== 'idle'}
                  className={`px-4 py-1 rounded-xl border-b-4 outline-none font-bold text-center min-w-[120px] max-w-[200px] transition-all bg-slate-50 focus:bg-white focus:border-indigo-400 ${
                    feedbackState === 'correct' ? '!bg-emerald-100 !border-emerald-400 !text-emerald-800' : 
                    feedbackState === 'incorrect' ? '!bg-rose-100 !border-rose-400 !text-rose-800' : ''
                  }`}
                  placeholder="?"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && feedbackState === 'idle') {
                      handleCheckAnswer();
                    }
                  }}
                />
                {parts[1] && <span>{parts[1]}</span>}
              </div>
            </div>
          );
        })()}

        {currentQuestion.type === 'open' && renderOpen()}

        {/* Feedback Alert */}
        {feedbackState !== 'idle' && (
          <div className={`mt-8 p-4 rounded-2xl flex items-center gap-3 ${
            feedbackState === 'correct' 
              ? 'bg-emerald-50 text-emerald-800' 
              : 'bg-rose-50 text-rose-800'
          }`}>
            {feedbackState === 'correct' 
              ? <CheckCircle className="w-6 h-6"/> 
              : <AlertCircle className="w-6 h-6"/>}
            <div>
              <p className="font-bold">
                {feedbackState === 'correct' 
                  ? '¡Correcto!' 
                  : `Incorrecto. Era: ${currentQuestion.correct_answer}`}
              </p>
              {currentQuestion.explanation && (
                <p className="text-xs opacity-80">{currentQuestion.explanation}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8">
          {feedbackState === 'idle' ? (
            <Button
              onClick={handleCheckAnswer}
              disabled={!selectedOption && !textInput}
              className="w-full h-16 text-xl font-black rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50"
            >
              COMPROBAR
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className={`w-full h-16 text-xl font-black rounded-2xl text-white border-b-4 active:translate-y-1 active:border-b-0 transition-all ${
                feedbackState === 'correct' 
                  ? 'bg-emerald-500 border-emerald-700' 
                  : 'bg-slate-700 border-slate-900'
              }`}
            >
              CONTINUAR <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};