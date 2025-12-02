import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { LEVEL_TEST_DATA } from '../lib/levelTestContent';
import { ArrowLeft, ArrowRight, Save, HelpCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner'; // Corregido import
import { submitTaskResult } from '../lib/moodle';
import { projectId } from '../utils/supabase/info'; 

interface LevelTestPlayerProps {
  studentName: string;
  studentId: string;
  studentEmail: string; 
  taskId: string;
  initialData?: any; 
  onExit: () => void;
}

export const LevelTestPlayer: React.FC<LevelTestPlayerProps> = ({ 
  studentName, studentId, studentEmail, taskId, initialData, onExit 
}) => {
  // ✅ 1. CARGA DE RESPUESTAS PREVIAS
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    if (initialData?.answers) {
      return initialData.answers.reduce((acc: any, curr: any) => {
        acc[curr.questionId] = curr.studentAnswer;
        return acc;
      }, {});
    }
    return {};
  });

  const [writingText, setWritingText] = useState(initialData?.textContent || '');

  // ✅ 2. NAVEGACIÓN: IR A LA PRIMERA SIN RESPONDER
  const [currentStep, setCurrentStep] = useState(() => {
    if (!initialData?.answers) return 0;
    const firstUnanswered = LEVEL_TEST_DATA.questions.findIndex(q => 
      !initialData.answers.find((a: any) => a.questionId === q.id)
    );
    return firstUnanswered === -1 ? LEVEL_TEST_DATA.questions.length : firstUnanswered;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalSteps = LEVEL_TEST_DATA.questions.length + 1;
  const isWritingStep = currentStep === LEVEL_TEST_DATA.questions.length;
  const currentQuestion = LEVEL_TEST_DATA.questions[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // HANDLERS
  const handleOptionSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleDontKnow = () => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: "NO_LO_SE" }));
    handleNext(); // Auto-avance opcional
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSaveDraft = async () => {
    const toastId = toast.loading("Guardando progreso...");
    try {
      await submitTaskResult(
        taskId, LEVEL_TEST_DATA.title, studentId, studentName, 
        0, 0, formatAnswersForMoodle(), writingText, 'draft'
      );
      toast.dismiss(toastId);
      toast.success("Progreso guardado");
      onExit(); 
    } catch (e) {
      toast.dismiss(toastId);
      toast.error("Error al guardar");
    }
  };

  const handleEarlySubmit = () => {
    if (!confirm("¿Quieres finalizar el test aquí? Evaluaremos tu nivel con lo completado hasta ahora.")) return;
    handleFinish(); 
  };

  const handleFinish = async () => {
    if (isWritingStep && writingText.trim().length < 20) {
      toast.warning("Por favor escribe un poco más en la redacción.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Evaluando nivel...");

    try {
      let rawScore = 0;
      LEVEL_TEST_DATA.questions.forEach(q => {
        if (answers[q.id] === q.correctAnswer) rawScore++;
      });

      await submitTaskResult(
        taskId, LEVEL_TEST_DATA.title, studentId, studentName,
        rawScore, LEVEL_TEST_DATA.questions.length,
        formatAnswersForMoodle(), writingText, 'submitted'
      );

      // Disparo silencioso a IA (Fire & Forget)
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebbb5c67/evaluate-level-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId, studentName, studentEmail, 
          answers: formatAnswersForMoodle(),
          writingText, rawScore,
          totalQuestions: LEVEL_TEST_DATA.questions.length
        })
      }).catch(e => console.warn("IA Eval Error (No crítico):", e));
      
      toast.dismiss(toastId);
      setShowConfetti(true);
      setTimeout(() => {
        toast.success("¡Test completado!");
        onExit();
      }, 3000);

    } catch (e) {
      toast.dismiss(toastId);
      toast.error("Error al enviar");
      setIsSubmitting(false);
    }
  };

  const formatAnswersForMoodle = () => {
    return LEVEL_TEST_DATA.questions.map(q => ({
      questionId: q.id,
      questionText: q.dialogue.map(l => l.text).join(' '),
      studentAnswer: answers[q.id] || "NO_RESPONDIDO",
      correctAnswer: q.correctAnswer,
      isCorrect: answers[q.id] === q.correctAnswer
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F0F4F8] flex flex-col font-sans">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute animate-bounce text-2xl" 
                 style={{ left: `${Math.random()*100}%`, top: `-5%`, animationDelay: `${Math.random()*2}s` }}>
              🎉
            </div>
          ))}
        </div>
      )}
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm shrink-0">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-800">{LEVEL_TEST_DATA.title}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Pregunta {currentStep + 1}/{totalSteps}</span>
            <span className="text-slate-300">|</span>
            <span className="text-indigo-600">{Math.round(progress)}%</span>
          </div>
        </div>
        <Button variant="ghost" onClick={handleSaveDraft} className="text-indigo-600 font-bold text-xs h-8">
          <Save className="w-4 h-4 mr-2" /> Guardar
        </Button>
      </div>

      <div className="h-1.5 bg-slate-100 w-full shrink-0">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-6 sm:p-10 border-b-8 border-indigo-50 my-4 transition-all">
          
          {!isWritingStep ? (
            <div className="flex flex-col space-y-8">
              
              {/* CONTEXTO */}
              {currentQuestion.context && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg inline-block w-fit">
                  <p className="text-amber-800 text-sm font-bold italic">
                    📍 {currentQuestion.context}
                  </p>
                </div>
              )}
              
              {/* --- ZONA DE DIÁLOGO (CORE FIX) --- */}
              <div className="space-y-6">
                {currentQuestion.dialogue.map((line, idx) => {
                  // 1. Detectar huecos (cualquier cantidad de guiones bajos)
                  const parts = line.text.split(/_{2,}/g);
                  const currentAnswer = answers[currentQuestion.id];
                  
                  // 2. Preparar partes de la respuesta
                  let answerParts: string[] = [];
                  if (currentAnswer && currentAnswer !== "NO_LO_SE") {
                    // Si la respuesta tiene "/", separar partes. Si no, usar todo.
                    answerParts = currentAnswer.includes('/') 
                      ? currentAnswer.split('/').map(s => s.trim()) 
                      : [currentAnswer];
                  }

                  return (
                    <div key={idx} className={`relative pl-4 border-l-4 ${
                        line.speaker === 'A' ? 'border-slate-300' : 
                        line.speaker === 'B' ? 'border-blue-300' : 'border-purple-300 italic'
                      }`}>
                      {/* Speaker Label */}
                      {line.speaker !== 'System' && (
                        <span className="absolute -top-3 left-4 text-[10px] font-black uppercase text-slate-400 bg-white px-1">
                          {line.speaker === 'A' ? 'Persona A' : 'Persona B'}
                        </span>
                      )}
                      
                      {/* Texto Fluido */}
                      <div className="text-lg sm:text-2xl font-medium text-slate-800 leading-loose">
                        {parts.map((part, i) => (
                          <React.Fragment key={i}>
                            {part} {/* Texto estático */}
                            
                            {/* Renderizar Hueco (si no es el último fragmento) */}
                            {i < parts.length - 1 && (
                              <span className="inline-flex mx-1.5 align-baseline relative top-0.5">
                                {answerParts[i] ? (
                                  // ✅ ESTADO LLENO: Texto Morado + Animación
                                  <span className="text-indigo-600 font-black border-b-[3px] border-indigo-500 px-1 animate-in zoom-in-95 duration-200">
                                    {answerParts[i]}
                                  </span>
                                ) : (
                                  // ⬜ ESTADO VACÍO: Línea gris base (sin ancho fijo exagerado)
                                  <span className="inline-block min-w-[50px] w-auto h-[1.2em] border-b-[3px] border-slate-200 rounded-sm bg-slate-50/50 transition-colors" />
                                )}
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* OPCIONES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    className={`p-4 rounded-xl border-2 text-left font-bold text-base transition-all active:scale-[0.98] ${
                      answers[currentQuestion.id] === opt
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-inner ring-1 ring-indigo-500'
                        : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 text-slate-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              
              <button onClick={handleDontKnow} className="text-slate-400 text-xs font-bold hover:text-slate-600 flex items-center justify-center gap-1 py-2">
                <HelpCircle className="w-3 h-3" /> No lo sé (Saltar)
              </button>
            </div>
          ) : (
            /* FASE 2: WRITING */
            <div className="flex flex-col animate-fade-in space-y-6">
              <div className="flex items-center gap-2 text-indigo-600">
                <div className="p-2 bg-indigo-100 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
                <h2 className="font-black text-xl">Parte Final: Redacción</h2>
              </div>
              
              <div className="bg-[#FFFDF5] p-5 rounded-xl border border-[#E8E0C5] shadow-sm font-serif text-slate-700 text-base leading-relaxed">
                <p className="text-xs text-amber-800/60 font-sans font-bold uppercase mb-2">Contexto:</p>
                {LEVEL_TEST_DATA.writingTask.context}
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-sm">Tu Respuesta:</p>
                <Textarea 
                  value={writingText}
                  onChange={(e) => setWritingText(e.target.value)}
                  className="w-full h-48 text-base p-4 bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-xl resize-none shadow-sm"
                  placeholder="Escribe aquí..."
                />
                <p className="text-right text-xs font-bold text-slate-400">
                  {writingText.split(/\s+/).filter(w => w).length} palabras
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-white border-t border-slate-200 p-4 shadow-up shrink-0">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="border-slate-200 text-slate-600 font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
          </Button>
          
          {!isWritingStep ? (
            <div className="flex flex-col items-center">
               <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] && answers[currentQuestion.id] !== "NO_LO_SE"}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
              >
                Siguiente <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <button onClick={handleEarlySubmit} className="mt-2 text-[10px] font-bold text-slate-300 hover:text-rose-400 underline decoration-dotted">
                Finalizar ahora (estoy cansado)
              </button>
            </div>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black px-10 py-6 rounded-xl shadow-xl text-lg"
            >
              {isSubmitting ? 'Enviando...' : 'FINALIZAR TEST 🚀'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
