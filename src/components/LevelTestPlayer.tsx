import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { LEVEL_TEST_DATA } from '../lib/levelTestContent';
import { ArrowLeft, ArrowRight, Save, Send, HelpCircle, CheckCircle2, Loader2, Trophy } from 'lucide-react'; // ✅ AGREGADO Loader2, Trophy
import { toast } from 'sonner@2.0.3';
import { submitTaskResult } from '../lib/moodle';
import { Confetti } from './ui/Confetti'; // ✅ AGREGADO Confetti
import { projectId, publicAnonKey } from '../utils/supabase/info'; // ✅ AGREGADO publicAnonKey

interface LevelTestPlayerProps {
  studentName: string;
  studentId: string;
  studentEmail: string; // ✅ NUEVO
  taskId: string;
  initialData?: any; // ✅ NUEVO: Submission previa
  teacherEmail?: string; // ✅ NUEVO: Email del profesor (opcional)
  onExit: () => void;
}

export const LevelTestPlayer: React.FC<LevelTestPlayerProps> = ({ 
  studentName, studentId, studentEmail, taskId, initialData, teacherEmail, onExit 
}) => {
  // ✅ INICIALIZACIÓN INTELIGENTE: Cargar respuestas previas si existen
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    if (initialData?.answers) {
      // Convertir array de Moodle a objeto Record
      return initialData.answers.reduce((acc: any, curr: any) => {
        acc[curr.questionId] = curr.studentAnswer;
        return acc;
      }, {});
    }
    return {};
  });

  const [writingText, setWritingText] = useState(initialData?.textContent || '');

  // ✅ CALCULAR PRIMER PASO VACÍO: Ir a la primera pregunta sin responder
  const [currentStep, setCurrentStep] = useState(() => {
    if (!initialData?.answers) return 0;
    // Buscar el índice de la primera pregunta que NO está en las respuestas
    const firstUnanswered = LEVEL_TEST_DATA.questions.findIndex(q => 
      !initialData.answers.find((a: any) => a.questionId === q.id)
    );
    return firstUnanswered === -1 ? LEVEL_TEST_DATA.questions.length : firstUnanswered;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalSteps = LEVEL_TEST_DATA.questions.length + 1;
  const isWritingStep = currentStep === LEVEL_TEST_DATA.questions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleOptionSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [LEVEL_TEST_DATA.questions[currentStep].id]: option }));
  };

  const handleDontKnow = () => {
    setAnswers(prev => ({ ...prev, [LEVEL_TEST_DATA.questions[currentStep].id]: "NO_LO_SE" }));
    if (currentStep < totalSteps - 1) setCurrentStep(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    const toastId = toast.loading("Guardando progreso...");
    try {
      await submitTaskResult(
        taskId, 
        LEVEL_TEST_DATA.title, 
        studentId, 
        studentName, 
        0, 0, // Score temporal
        formatAnswersForMoodle(), // Guardar JSON crudo
        writingText,
        'draft'
      );
      toast.dismiss(toastId);
      toast.success("Progreso guardado");
      onExit(); // ✅ CERRAR EL PLAYER
    } catch (e) {
      toast.dismiss(toastId);
      toast.error("Error al guardar");
    }
  };

  // ✅ NUEVO: Función "Finalizar Aquí" (Early Submit)
  const handleEarlySubmit = () => {
    if (!confirm("¿Sientes que el nivel ya es muy difícil?\n\nNo te preocupes, evaluaremos tu nivel con lo que has hecho hasta ahora. ¿Quieres enviar el test ya?")) {
      return;
    }
    handleFinish(); // Reutiliza la función de envío final
  };

  const handleFinish = async () => {
    // ✅ VALIDACIÓN FLEXIBLE: Solo requerido si estás EN la fase de writing
    if (isWritingStep && writingText.trim().length < 20) {
      toast.warning("Por favor escribe un poco más en la redacción final.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Analizando resultados con IA...");

    try {
      // 1. Preparar datos para la IA
      let rawScore = 0;
      LEVEL_TEST_DATA.questions.forEach(q => {
        if (answers[q.id] === q.correctAnswer) rawScore++;
      });
      
      const payload = {
        studentId, 
        studentName, 
        studentEmail, // ✅ YA VIENE COMO PROP
        teacherEmail, // ✅ NUEVO: Email del profesor (opcional)
        answers: formatAnswersForMoodle(),
        writingText, 
        rawScore
      };

      // 2. ✅ ENVIAR A LA IA (El cerebro real)
      const endpointUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ebbb5c67/evaluate-level-test`;
      
      try {
        const aiResponse = await fetch(endpointUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}` // ✅ LLAVE PARA EVITAR ERROR 401
          },
          body: JSON.stringify(payload)
        });

        if (!aiResponse.ok) {
          // Si sigue fallando (ej. 401 o 500), lanzamos error para verlo en consola
          const errText = await aiResponse.text();
          throw new Error(`Error ${aiResponse.status}: ${errText}`);
        }
        
        console.log('✅ Evaluación IA enviada correctamente');

      } catch (aiError) {
        console.warn('⚠️ Falló la conexión con la IA, pero el test se marcó como completado.', aiError);
        // No bloqueamos el flujo, dejamos que el usuario termine
      }
      
      // 3. ✅ GUARDADO "FANTASMA" EN MOODLE
      // Guardamos la tarea como 'submitted' para que desaparezca de la lista de pendientes,
      // PERO no guardamos las respuestas ni la nota real. Solo un placeholder.
      await submitTaskResult(
        taskId,
        LEVEL_TEST_DATA.title,
        studentId,
        studentName,
        0, // Nota 0 o nula para no afectar estadísticas
        0, // Total 0
        [], // ¡Array vacío! No guardamos las respuestas en la BD
        "Evaluación realizada por IA. Resultados enviados por email.", // Texto placeholder
        'submitted'
      );
      
      toast.dismiss(toastId);
      setShowConfetti(true);
      
      setTimeout(() => {
        toast.success("¡Evaluación enviada! Revisa tu correo.");
        onExit();
      }, 3000);

    } catch (e) {
      console.error(e);
      toast.error("Error al procesar el test. Inténtalo de nuevo.");
      setIsSubmitting(false);
    }
  };

  const formatAnswersForMoodle = () => {
    return LEVEL_TEST_DATA.questions.map(q => {
      // Reconstruir el texto de la pregunta desde el diálogo
      const questionText = q.dialogue.map(line => line.text).join(' ');
      
      return {
        questionId: q.id,
        questionText,
        studentAnswer: answers[q.id] || "NO_RESPONDIDO",
        correctAnswer: q.correctAnswer,
        isCorrect: answers[q.id] === q.correctAnswer
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F0F4F8] flex flex-col">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              🎉
            </div>
          ))}
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm shrink-0">
        <div>
          <h1 className="text-base sm:text-xl font-black text-slate-800">{LEVEL_TEST_DATA.title}</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
            Pregunta {currentStep + 1} de {totalSteps}
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="ghost" onClick={handleSaveDraft} className="text-indigo-600 font-bold text-xs sm:text-sm px-2 sm:px-4">
            <Save className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" /> 
            <span className="hidden sm:inline">Guardar y Salir</span>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-200 w-full shrink-0">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Content - MEJORADO CON SCROLL INTERNO */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex justify-center items-start">
        <div className="w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 md:p-12 border-b-4 sm:border-b-8 border-indigo-100 my-2 sm:my-4">
          
          {/* FASE 1: PREGUNTAS TIPO TEST */}
          {!isWritingStep ? (
            <div className="flex flex-col animate-fade-in space-y-6 sm:space-y-8">
              <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black w-fit">
                GRAMÁTICA & VOCABULARIO
              </span>
              
              {/* CONTEXTO SITUACIONAL (si existe) */}
              {LEVEL_TEST_DATA.questions[currentStep].context && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 sm:p-4 rounded-r-xl">
                  <p className="text-amber-800 text-sm sm:text-base italic font-medium">
                    📍 {LEVEL_TEST_DATA.questions[currentStep].context}
                  </p>
                </div>
              )}
              
              {/* DIÁLOGO CON SPEAKERS Y RESPUESTAS INTEGRADAS */}
              <div className="space-y-3 sm:space-y-4">
                {LEVEL_TEST_DATA.questions[currentStep].dialogue.map((line, idx) => {
                  const textWithBlanks = line.text.split('___');
                  const currentAnswer = answers[LEVEL_TEST_DATA.questions[currentStep].id];
                  
                  // 🎯 LÓGICA ESPECIAL: Si la respuesta tiene "/" y hay múltiples blanks, dividir
                  let answerParts: string[] = [];
                  if (currentAnswer && currentAnswer !== "NO_LO_SE" && currentAnswer.includes('/')) {
                    answerParts = currentAnswer.split('/');
                  } else if (currentAnswer && currentAnswer !== "NO_LO_SE") {
                    // Si NO tiene "/", usar la misma respuesta para todos los blanks
                    answerParts = Array(textWithBlanks.length - 1).fill(currentAnswer);
                  }
                  
                  return (
                    <div 
                      key={idx}
                      className={`${
                        line.speaker === 'A' 
                          ? 'bg-slate-50 border-l-4 border-slate-400 pl-4 pr-3 py-3 rounded-r-xl' 
                          : line.speaker === 'B'
                          ? 'bg-blue-50 border-l-4 border-blue-400 pl-4 pr-3 py-3 rounded-r-xl'
                          : 'bg-purple-50 border-l-4 border-purple-400 pl-4 pr-3 py-3 rounded-r-xl italic'
                      }`}
                    >
                      {line.speaker !== 'System' && (
                        <span className="text-xs font-black uppercase tracking-wider opacity-60 block mb-2">
                          {line.speaker === 'A' ? '👤 Persona A' : '💬 Persona B'}
                        </span>
                      )}
                      <p className="text-base sm:text-xl md:text-2xl font-medium text-slate-800 leading-relaxed">
                        {textWithBlanks.map((part, i, arr) => (
                          <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <span className="inline-flex items-baseline mx-1 sm:mx-2">
                                {answerParts[i] ? (
                                  // ✅ ESTADO: RESPONDIDO - Texto integrado con subrayado
                                  <span className="text-indigo-600 font-black border-b-[6px] border-indigo-400 px-1 sm:px-2 leading-tight animate-in zoom-in-95 duration-200 text-base sm:text-xl md:text-2xl">
                                    {answerParts[i]}
                                  </span>
                                ) : (
                                  // ❌ ESTADO: VACÍO - Línea esperando respuesta
                                  <span className="inline-block w-20 sm:w-28 h-6 sm:h-8 border-b-[6px] border-slate-300 rounded-sm bg-slate-50/50" />
                                )}
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* OPCIONES DE RESPUESTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {LEVEL_TEST_DATA.questions[currentStep].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 text-left font-bold text-base sm:text-lg transition-all ${
                      answers[LEVEL_TEST_DATA.questions[currentStep].id] === opt
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              
              {/* Botón "No lo sé" - SEPARADO Y VISIBLE */}
              <button
                onClick={handleDontKnow}
                className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 font-bold hover:bg-slate-50 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 mt-4"
              >
                <HelpCircle className="w-5 h-5" />
                No lo sé (Saltar)
              </button>
            </div>
          ) : (
            
            /* FASE 2: WRITING */
            <div className="flex flex-col animate-fade-in space-y-6">
              <span className="inline-block bg-pink-50 text-pink-700 px-3 py-1 rounded-full text-xs font-black w-fit">
                EXPRESIÓN ESCRITA
              </span>
              
              <div className="bg-[#FFFDF5] p-4 sm:p-6 rounded-xl border-2 border-[#F2E8C9] shadow-sm rotate-1 transform font-serif text-sm sm:text-lg leading-relaxed text-slate-700 max-h-[40vh] overflow-y-auto">
                <p className="text-xs text-[#C2B59B] font-sans font-bold uppercase mb-2">Carta recibida:</p>
                <div className="whitespace-pre-line">
                  {LEVEL_TEST_DATA.writingTask.context}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-2 text-lg sm:text-xl">Tu Turno:</h3>
                <p className="text-slate-500 mb-4 text-sm sm:text-base">{LEVEL_TEST_DATA.writingTask.prompt}</p>
              </div>
              
              <Textarea 
                value={writingText}
                onChange={(e) => setWritingText(e.target.value)}
                className="w-full h-40 sm:h-48 text-sm sm:text-lg p-3 sm:p-4 bg-slate-50 border-2 border-indigo-100 focus:border-indigo-400 rounded-2xl resize-none"
                placeholder="Hola Fuencisla..."
              />
              <p className="text-right text-xs font-bold text-slate-400">
                {writingText.split(/\s+/).filter(w => w).length} palabras
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation - SIEMPRE VISIBLE */}
      <div className="bg-white border-t border-slate-200 p-4 sm:p-6 shadow-lg shrink-0">
        {/* ✅ BOTÓN DE PÁNICO: Solo visible en preguntas, NO en writing */}
        {!isWritingStep && (
          <div className="flex justify-center mb-3">
            <button 
              onClick={handleEarlySubmit}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 underline decoration-dotted transition-colors"
            >
              Es muy difícil, quiero terminar aquí 😓
            </button>
          </div>
        )}

        {/* NAVEGACIÓN PRINCIPAL */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="font-bold border-2 hover:bg-slate-50 disabled:opacity-30 px-4 sm:px-6 h-10 sm:h-12 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          
          {!isWritingStep ? (
            <Button
              onClick={handleNext}
              disabled={!answers[LEVEL_TEST_DATA.questions[currentStep].id]}
              className="bg-slate-700 hover:bg-slate-800 text-white font-black px-6 sm:px-10 h-10 sm:h-12 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">Sig.</span>
              <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black px-6 sm:px-12 h-10 sm:h-14 rounded-xl shadow-2xl text-sm sm:text-lg"
            >
              {isSubmitting ? '⏳ Evaluando...' : '✨ FINALIZAR TEST'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};