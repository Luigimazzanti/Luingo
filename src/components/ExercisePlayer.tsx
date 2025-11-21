import React, { useState, useEffect } from 'react';
import { Exercise, Question } from '../types';
import { Button } from './ui/button';
import { CheckCircle, XCircle, ArrowRight, RefreshCw, Trophy, Volume2 } from 'lucide-react';
import { Confetti } from './ui/Confetti';

interface ExercisePlayerProps {
  exercise: Exercise;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export const ExercisePlayer: React.FC<ExercisePlayerProps> = ({ exercise, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [sentenceOrder, setSentenceOrder] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = exercise.questions[currentIndex];

  // Safety check for empty exercises or invalid index
  if (!currentQuestion) {
    return (
        <div className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center">
            <div className="text-center p-8">
                <h2 className="text-xl font-bold text-slate-800 mb-2">¡Ups! No hay preguntas</h2>
                <p className="text-slate-500 mb-6">Este ejercicio parece estar vacío.</p>
                <Button onClick={onExit} variant="outline">Volver</Button>
            </div>
        </div>
    );
  }

  // Inicializar estado para cada pregunta
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

  const playSound = (type: 'correct' | 'incorrect' | 'finish') => {
    // Simulación de sonido - en producción usaríamos Audio()
    // const audio = new Audio(`/sounds/${type}.mp3`);
    // audio.play();
  };

  const handleCheckAnswer = () => {
    let isCorrect = false;

    if (currentQuestion.type === 'choice') {
      isCorrect = selectedOption === currentQuestion.correct_answer;
    } else if (currentQuestion.type === 'fill_blank') {
      isCorrect = textInput.trim().toLowerCase() === currentQuestion.correct_answer?.toLowerCase();
    } else if (currentQuestion.type === 'order_sentence') {
      isCorrect = JSON.stringify(sentenceOrder) === JSON.stringify(currentQuestion.correct_order);
    }

    if (isCorrect) {
      setFeedbackState('correct');
      setScore(prev => prev + 1);
      playSound('correct');
    } else {
      setFeedbackState('incorrect');
      playSound('incorrect');
      // Trigger vibration
      if (navigator.vibrate) navigator.vibrate(200);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercise.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishExercise();
    }
  };

  const finishExercise = () => {
    setIsFinished(true);
    setShowConfetti(true);
    playSound('finish');
    // Calcular bananas ganadas
    const percentage = (score + (feedbackState === 'correct' ? 0 : 0)) / exercise.questions.length; 
    // Nota: score ya se actualizó antes
    // Fix: score se actualiza en el render cycle, usar valor final
  };

  // --- Renders por Tipo de Pregunta ---

  const renderChoice = () => (
    <div className="grid grid-cols-1 gap-3 mt-6">
      {currentQuestion.options?.map((option, idx) => (
        <button
          key={idx}
          onClick={() => feedbackState === 'idle' && setSelectedOption(option)}
          disabled={feedbackState !== 'idle'}
          className={`p-4 rounded-2xl text-lg font-bold border-b-4 transition-all text-left ${
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
                <span className="text-slate-300 font-bold text-sm w-full text-center self-center">Toca las palabras para ordenar</span>
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

  // --- Pantalla Final ---
  if (isFinished) {
    const totalQuestions = exercise.questions.length;
    // Ensure score doesn't exceed total due to any glitch, though logic should be sound
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
        <div className="w-full max-w-2xl mb-6 flex items-center gap-4">
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
                <span className="font-black text-amber-700">{Math.round((score / exercise.questions.length) * exercise.banana_reward_total)}</span>
            </div>
        </div>

        {/* Tarjeta de Pregunta */}
        <div className={`w-full max-w-2xl bg-white rounded-[2.5rem] shadow-xl border-b-8 transition-all duration-300 p-6 md:p-10 relative overflow-hidden ${
            feedbackState === 'incorrect' ? 'border-rose-200 ring-4 ring-rose-100 animate-[shake_0.5s_ease-in-out]' :
            feedbackState === 'correct' ? 'border-emerald-200 ring-4 ring-emerald-100' : 'border-slate-200'
        }`}>
            {/* Header Pregunta */}
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-8 text-center leading-tight">
                {currentQuestion.question_text.replace('[...]', '_____')}
            </h2>

            {/* Cuerpo Pregunta */}
            {currentQuestion.type === 'choice' && renderChoice()}
            {currentQuestion.type === 'fill_blank' && renderFillBlank()}
            {currentQuestion.type === 'order_sentence' && renderOrderSentence()}

            {/* Feedback Box */}
            {feedbackState !== 'idle' && (
                <div className={`mt-8 p-4 rounded-2xl border-2 animate-in slide-in-from-bottom-4 ${
                    feedbackState === 'correct' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                }`}>
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full shrink-0 ${
                            feedbackState === 'correct' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                            {feedbackState === 'correct' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        </div>
                        <div>
                            <h4 className={`font-black text-lg mb-1 ${
                                feedbackState === 'correct' ? 'text-emerald-800' : 'text-rose-800'
                            }`}>
                                {feedbackState === 'correct' ? '¡Excelente!' : '¡Casi!'}
                            </h4>
                            <p className={`text-sm font-medium leading-relaxed ${
                                feedbackState === 'correct' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                                {currentQuestion.explanation}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="w-full max-w-2xl mt-8 h-20 flex items-end justify-between">
             <Button
                variant="ghost"
                onClick={onExit}
                className="text-slate-400 font-bold uppercase tracking-widest hover:bg-transparent hover:text-slate-600"
             >
                Saltar
             </Button>

             {feedbackState === 'idle' ? (
                 <Button
                    onClick={handleCheckAnswer}
                    disabled={
                        (currentQuestion.type === 'choice' && !selectedOption) ||
                        (currentQuestion.type === 'fill_blank' && !textInput) ||
                        (currentQuestion.type === 'order_sentence' && sentenceOrder.length === 0)
                    }
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-black h-14 px-10 rounded-2xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4"
                 >
                    COMPROBAR
                 </Button>
             ) : (
                 <Button
                    onClick={handleNext}
                    className={`text-white text-lg font-black h-14 px-10 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all ${
                        feedbackState === 'correct' 
                        ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700 shadow-lg shadow-emerald-200' 
                        : 'bg-rose-500 hover:bg-rose-600 border-rose-700 shadow-lg shadow-rose-200'
                    }`}
                 >
                    CONTINUAR <ArrowRight className="w-5 h-5 ml-2" />
                 </Button>
             )}
        </div>
    </div>
  );
};
