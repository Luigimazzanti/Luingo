import React, { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { Button } from './ui/button';
import { CheckCircle, XCircle, ArrowRight, RefreshCw, Trophy } from 'lucide-react';
import { Confetti } from './ui/Confetti';
import { submitTaskResult } from '../lib/moodle';
import { toast } from 'sonner@2.0.3';

interface ExercisePlayerProps {
  exercise: Exercise;
  onComplete: (score: number) => void;
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
  const [sentenceOrder, setSentenceOrder] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Guardamos todas las respuestas para el profesor
  const [allAnswers, setAllAnswers] = useState<any[]>([]);

  const currentQuestion = exercise.questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error: Pregunta no encontrada</h2>
          <Button onClick={onExit} variant="outline">Volver</Button>
        </div>
      </div>
    );
  }

  // Reset state per question
  useEffect(() => {
    if (currentQuestion.type === 'order_sentence' && currentQuestion.scrambled_parts) {
      setAvailableWords([...currentQuestion.scrambled_parts]);
      setSentenceOrder([]);
    } else {
      setSelectedOption(null);
      setTextInput('');
    }
    setFeedbackState('idle');
  }, [currentIndex, currentQuestion]);

  const handleCheckAnswer = () => {
    let isCorrect = false;
    let answerValue: any = null;

    if (currentQuestion.type === 'choice' || currentQuestion.type === 'true_false') {
      isCorrect = selectedOption === currentQuestion.correct_answer;
      answerValue = selectedOption;
    } else if (currentQuestion.type === 'fill_blank') {
      isCorrect = textInput.trim().toLowerCase() === currentQuestion.correct_answer?.toString().toLowerCase();
      answerValue = textInput;
    } else if (currentQuestion.type === 'order_sentence') {
      isCorrect = JSON.stringify(sentenceOrder) === JSON.stringify(currentQuestion.correct_order);
      answerValue = sentenceOrder.join(' ');
    } else if (currentQuestion.type === 'open') {
      // Para preguntas abiertas, siempre es correcto (requiere corrección manual del profesor)
      isCorrect = true;
      answerValue = textInput;
    }

    // Guardar respuesta
    const answerData = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question_text,
      studentAnswer: answerValue,
      isCorrect: isCorrect
    };
    setAllAnswers(prev => [...prev, answerData]);

    if (isCorrect) {
      setFeedbackState('correct');
      setScore(prev => prev + 1);
    } else {
      setFeedbackState('incorrect');
    }
  };

  const handleNext = () => {
    if (currentIndex < exercise.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishExercise();
    }
  };

  const finishExercise = async () => {
    setIsFinished(true);
    setShowConfetti(true);

    // Envío silencioso a Moodle al terminar
    if (studentName) {
      toast.loading("Enviando resultados a Moodle...");
      try {
        await submitTaskResult(
          exercise.title, 
          studentName, 
          score, 
          exercise.questions.length
        );
        toast.dismiss();
        toast.success("✅ Tarea guardada en el servidor.");
      } catch (e) {
        console.error(e);
        toast.dismiss();
        toast.error("Error al guardar (pero has practicado bien).");
      }
    }
  };

  // --- RENDERERS ---

  const renderChoice = () => (
    <div className="grid grid-cols-1 gap-3 mt-6">
      {currentQuestion.options?.map((option, idx) => (
        <button
          key={idx}
          onClick={() => feedbackState === 'idle' && setSelectedOption(option)}
          disabled={feedbackState !== 'idle'}
          className={`p-4 rounded-2xl text-lg font-bold border-b-4 transition-all text-left h-auto min-h-[60px] whitespace-normal ${
            selectedOption === option
              ? 'bg-indigo-100 border-indigo-400 text-indigo-800 ring-2 ring-indigo-200'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
          } ${
            feedbackState !== 'idle' && option === currentQuestion.correct_answer
              ? '!bg-emerald-100 !border-emerald-400 !text-emerald-800'
              : ''
          } ${
            feedbackState === 'incorrect' && selectedOption === option
              ? '!bg-rose-100 !border-rose-400 !text-rose-800'
              : ''
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );

  // NUEVO: Render para Verdadero/Falso
  const renderTrueFalse = () => (
    <div className="grid grid-cols-2 gap-4 mt-6">
      <button
        onClick={() => feedbackState === 'idle' && setSelectedOption('Verdadero')}
        disabled={feedbackState !== 'idle'}
        className={`p-6 rounded-2xl text-xl font-black border-b-4 transition-all ${
          selectedOption === 'Verdadero'
            ? 'bg-emerald-100 border-emerald-400 text-emerald-800 ring-2 ring-emerald-200'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        } ${
          feedbackState !== 'idle' && currentQuestion.correct_answer === 'Verdadero'
            ? '!bg-emerald-100 !border-emerald-400 !text-emerald-800'
            : ''
        } ${
          feedbackState === 'incorrect' && selectedOption === 'Verdadero'
            ? '!bg-rose-100 !border-rose-400 !text-rose-800'
            : ''
        }`}
      >
        ✅ Verdadero
      </button>
      <button
        onClick={() => feedbackState === 'idle' && setSelectedOption('Falso')}
        disabled={feedbackState !== 'idle'}
        className={`p-6 rounded-2xl text-xl font-black border-b-4 transition-all ${
          selectedOption === 'Falso'
            ? 'bg-rose-100 border-rose-400 text-rose-800 ring-2 ring-rose-200'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        } ${
          feedbackState !== 'idle' && currentQuestion.correct_answer === 'Falso'
            ? '!bg-emerald-100 !border-emerald-400 !text-emerald-800'
            : ''
        } ${
          feedbackState === 'incorrect' && selectedOption === 'Falso'
            ? '!bg-rose-100 !border-rose-400 !text-rose-800'
            : ''
        }`}
      >
        ❌ Falso
      </button>
    </div>
  );

  const renderFillBlank = () => {
    const parts = currentQuestion.question_text.split('[...]');
    return (
      <div className="mt-6 bg-white p-6 rounded-3xl border-b-4 border-slate-200 shadow-sm text-xl font-medium text-slate-700 leading-loose">
        {parts[0]}
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          disabled={feedbackState !== 'idle'}
          className={`mx-2 px-3 py-1 rounded-lg border-b-4 outline-none font-bold text-center min-w-[120px] transition-all ${
            feedbackState === 'correct' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : feedbackState === 'incorrect'
              ? 'bg-rose-50 border-rose-300 text-rose-700'
              : 'bg-indigo-50 border-indigo-200 focus:border-indigo-400 text-indigo-700'
          }`}
          placeholder="..."
        />
        {parts[1]}
      </div>
    );
  };

  const renderOrderSentence = () => (
    <div className="mt-6 space-y-6">
      {/* Zona de Construcción */}
      <div className="min-h-[80px] bg-white rounded-3xl border-b-4 border-slate-200 p-4 flex flex-wrap gap-2 shadow-inner">
        {sentenceOrder.length === 0 && (
          <span className="text-slate-300 font-bold text-sm w-full text-center self-center">
            Toca las palabras para ordenar
          </span>
        )}
        {sentenceOrder.map((word, idx) => (
          <button
            key={`s-${idx}`}
            onClick={() => {
              if (feedbackState !== 'idle') return;
              setSentenceOrder(prev => prev.filter((_, i) => i !== idx));
              setAvailableWords(prev => [...prev, word]);
            }}
            className="bg-white border-2 border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-indigo-50 animate-in zoom-in duration-200"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Banco de Palabras */}
      <div className="flex flex-wrap justify-center gap-2">
        {availableWords.map((word, idx) => (
          <button
            key={`bank-${idx}`}
            onClick={() => {
              if (feedbackState !== 'idle') return;
              setAvailableWords(prev => prev.filter((_, i) => i !== idx));
              setSentenceOrder(prev => [...prev, word]);
            }}
            className="bg-indigo-100 border-b-4 border-indigo-200 text-indigo-700 px-4 py-2 rounded-xl font-bold active:border-b-0 active:translate-y-1 transition-all"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );

  // Render para preguntas abiertas (Open)
  const renderOpen = () => (
    <div className="mt-6 space-y-4">
      <p className="text-slate-600 font-medium">Escribe tu respuesta:</p>
      <textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        disabled={feedbackState !== 'idle'}
        className="w-full min-h-[150px] p-4 rounded-2xl border-2 border-slate-200 text-lg focus:border-indigo-500 outline-none resize-none bg-white shadow-inner"
        placeholder="Tu respuesta aquí..."
      />
      {currentQuestion.allow_audio && (
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm text-indigo-700 font-bold">Audio habilitado (opcional)</span>
        </div>
      )}
    </div>
  );

  // --- Pantalla Final ---
  if (isFinished) {
    const totalQuestions = exercise.questions.length;
    const finalScore = Math.min(score, totalQuestions);
    const passed = finalScore >= totalQuestions * 0.6;

    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center p-4">
        {showConfetti && <Confetti />}
        
        <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl border-b-8 border-slate-200 p-8 text-center animate-in zoom-in duration-500 relative z-10">
          <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg relative">
            <span className="text-6xl animate-bounce">
              {passed ? '🍌' : '🙈'}
            </span>
            {passed && (
              <div className="absolute -right-2 -top-2 bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-white rotate-12">
                ¡GENIAL!
              </div>
            )}
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-2">
            {passed ? '¡Ejercicio Completado!' : '¡Buen intento!'}
          </h2>
          
          <p className="text-slate-500 font-medium mb-8">
            Has conseguido <strong className="text-amber-500">{finalScore * (exercise.banana_reward_total / totalQuestions)}</strong> bananas.
            <br/>
            <span className="text-emerald-600 font-bold block mt-2">
              ✅ Tu tarea ha sido guardada en el servidor del profesor.
            </span>
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100">
              <p className="text-xs text-indigo-400 font-black uppercase">Aciertos</p>
              <p className="text-3xl font-black text-indigo-700">{finalScore}/{totalQuestions}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-100">
              <p className="text-xs text-emerald-400 font-black uppercase">XP Total</p>
              <p className="text-3xl font-black text-emerald-700">+{finalScore * 10}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => {
                setIsFinished(false);
                setCurrentIndex(0);
                setScore(0);
                setFeedbackState('idle');
                setAllAnswers([]);
              }}
              className="w-full h-14 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-black rounded-2xl text-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Repetir
            </Button>
            <Button 
              onClick={() => onComplete(finalScore)}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-lg border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- UI Principal del Juego ---
  const progress = ((currentIndex) / exercise.questions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      {/* Barra de Progreso */}
      <div className="w-full max-w-3xl mb-6 flex items-center gap-4">
        <button onClick={onExit} className="text-slate-400 hover:text-slate-600">
          <XCircle className="w-8 h-8" />
        </button>
        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
          <div 
            className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="w-full h-full bg-white/20 animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
          <span className="text-xl">🍌</span>
          <span className="font-black text-amber-700">
            {Math.round((score / exercise.questions.length) * exercise.banana_reward_total)}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className={`w-full max-w-3xl bg-white rounded-[3rem] shadow-xl border-b-8 p-8 md:p-12 relative overflow-hidden transition-all ${
        feedbackState === 'incorrect' ? 'border-rose-200 ring-4 ring-rose-100' : 
        feedbackState === 'correct' ? 'border-emerald-200 ring-4 ring-emerald-100' : 
        'border-slate-200'
      }`}>
        <h2 className="text-3xl font-black text-slate-800 text-center mb-8 leading-tight">
          {currentQuestion.type === 'fill_blank' ? 'Completa la frase:' : currentQuestion.question_text}
        </h2>

        {currentQuestion.type === 'choice' && renderChoice()}
        {currentQuestion.type === 'true_false' && renderTrueFalse()}
        {currentQuestion.type === 'fill_blank' && renderFillBlank()}
        {currentQuestion.type === 'order_sentence' && renderOrderSentence()}
        {currentQuestion.type === 'open' && renderOpen()}

        {/* Feedback Message */}
        {feedbackState !== 'idle' && (
          <div className={`mt-8 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2 ${
            feedbackState === 'correct' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}>
            <div className={`p-2 rounded-full ${
              feedbackState === 'correct' ? 'bg-emerald-200' : 'bg-rose-200'
            }`}>
              {feedbackState === 'correct' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <p className="font-black text-lg">
                {feedbackState === 'correct' ? '¡Correcto!' : 'Incorrecto'}
              </p>
              <p className="text-sm opacity-80">{currentQuestion.explanation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Button */}
      <div className="mt-8 w-full max-w-3xl">
        {feedbackState === 'idle' ? (
          <Button 
            onClick={handleCheckAnswer} 
            disabled={
              (currentQuestion.type === 'choice' || currentQuestion.type === 'true_false') && !selectedOption ||
              (currentQuestion.type === 'fill_blank' || currentQuestion.type === 'open') && !textInput ||
              currentQuestion.type === 'order_sentence' && sentenceOrder.length === 0
            }
            className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:active:translate-y-0"
          >
            COMPROBAR
          </Button>
        ) : (
          <Button 
            onClick={handleNext} 
            className={`w-full h-16 rounded-2xl text-white font-black text-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all ${
              feedbackState === 'correct' ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700' : 'bg-rose-500 hover:bg-rose-600 border-rose-700'
            }`}
          >
            CONTINUAR <ArrowRight className="ml-2 w-6 h-6" />
          </Button>
        )}
      </div>
    </div>
  );
};