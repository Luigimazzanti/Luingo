import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { LEVEL_TEST_DATA } from "../lib/levelTestContent";
import {
  ArrowLeft,
  ArrowRight,
  Flag,
  CheckCircle2,
  Loader2,
  X,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { saveUserPreferences } from "../lib/moodle";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info"; // ✅ IMPORTAR publicAnonKey
import { Confetti } from "./ui/Confetti";

interface LevelTestPlayerProps {
  studentName: string;
  studentId: string;
  studentEmail: string;
  teacherEmail?: string; // 👈 [NUEVO] Añadir esto
  taskId: string;
  initialData?: any;
  onExit: () => void;
}

export const LevelTestPlayer: React.FC<
  LevelTestPlayerProps
> = ({ studentName, studentId, studentEmail, teacherEmail, onExit }) => { // 👈 [NUEVO] Añadir teacherEmail aquí
  const [answers, setAnswers] = useState<
    Record<number, string>
  >({});
  const [writingText, setWritingText] = useState("");
  const [status, setStatus] = useState<
    "playing" | "submitting" | "success"
  >("playing");
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = LEVEL_TEST_DATA.questions.length + 1;
  const isWritingStep =
    currentStep === LEVEL_TEST_DATA.questions.length;
  const currentQuestion =
    LEVEL_TEST_DATA.questions[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // --- HANDLERS ---

  const handleNext = () => {
    if (currentStep < totalSteps - 1)
      setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleOptionSelect = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleDontKnow = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: "NO_LO_SE",
    }));
    handleNext();
  };

  const handleExitWithoutSaving = () => {
    if (
      confirm(
        "⚠️ ¿Salir del test?\n\nEl progreso NO se guardará. Tendrás que empezar de cero.",
      )
    ) {
      onExit();
    }
  };

  const handleEarlySubmit = () => {
    if (
      !confirm(
        "¿Sientes que el nivel ya es alto para ti?\n\nNo te preocupes, evaluaremos tu nivel con lo que has completado hasta aquí.",
      )
    )
      return;
    handleFinish();
  };

  const handleFinish = async () => {
    if (isWritingStep && writingText.trim().length < 10) {
      toast.warning(
        "Escribe al menos una frase para poder evaluar tu escritura.",
      );
      return;
    }

    setStatus("submitting");

    let rawScore = 0;
    LEVEL_TEST_DATA.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) rawScore++;
    });

    try {
      // 1. Enviar a IA + Emails (Incluyendo al profesor)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebbb5c67/evaluate-level-test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            studentId,
            studentName,
            studentEmail,
            teacherEmail, // ✅ AHORA SÍ LLEGA EL EMAIL DEL PROFE
            answers: LEVEL_TEST_DATA.questions.map((q) => ({
              questionId: q.id,
              questionText: q.dialogue
                .map((l) => l.text)
                .join(" "),
              studentAnswer: answers[q.id] || "NO_RESPONDIDO",
              correctAnswer: q.correctAnswer,
              isCorrect: answers[q.id] === q.correctAnswer,
            })),
            writingText,
            rawScore,
            totalQuestions: LEVEL_TEST_DATA.questions.length,
          }),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Error respuesta IA:", errText);
        throw new Error("Error conectando con el evaluador IA");
      }

      const data = await response.json();
      const determinedLevel = data.result?.level || "A1";

      // 2. Apagar la bandera para que desaparezca del dashboard
      await saveUserPreferences(studentId, {
        level_code: determinedLevel,
        pending_level_test: false, // 🚩 ESTO HACE QUE DESAPAREZCA
        level_test_completed: true,
        level_test_date: new Date().toISOString(),
      });

      setStatus("success");
    } catch (e) {
      console.error(e);
      toast.error(
        "Hubo un problema al enviar. Inténtalo de nuevo.",
      );
      setStatus("playing");
    }
  };

  // --- HELPERS DE RENDERIZADO ---

  const countGaps = (text: string) =>
    (text.match(/_{2,}/g) || []).length;

  if (status === "success") {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
        <Confetti />
        <div className="text-center max-w-md space-y-6 relative z-10">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-800">
            ¡Test Completado!
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 text-slate-600 text-sm leading-relaxed">
            <p>
              Hemos actualizado tu perfil con tu nuevo nivel.
            </p>
            <p className="mt-2 font-bold text-indigo-600">
              Revisa tu correo ({studentEmail}), te hemos
              enviado el informe detallado. 📩
            </p>
          </div>
          <Button
            onClick={onExit}
            className="w-full h-14 text-lg font-black bg-slate-900 text-white rounded-xl hover:scale-105 transition-transform shadow-xl"
          >
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }

  if (status === "submitting") {
    return (
      <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-black text-slate-800 animate-pulse">
          Analizando Resultados...
        </h2>
        <p className="text-slate-500 text-sm mt-2">
          Nuestra IA está calculando tu nivel exacto
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#F0F4F8] flex flex-col font-sans">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleExitWithoutSaving}
            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold gap-2 px-3"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
          <h1 className="text-sm sm:text-base font-black text-slate-800 leading-tight hidden sm:block">
            {LEVEL_TEST_DATA.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Pregunta
          </span>
          <span className="text-lg font-black text-indigo-600 tabular-nums">
            {currentStep + 1}{" "}
            <span className="text-slate-300 text-sm">/</span>{" "}
            {totalSteps}
          </span>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="h-1.5 bg-slate-100 w-full shrink-0">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-6 sm:p-10 border-b-8 border-indigo-50 my-4 transition-all">
          {!isWritingStep ? (
            <div
              key={currentQuestion.id}
              className="flex flex-col space-y-8 animate-in fade-in slide-in-from-right-4 duration-300"
            >
              {currentQuestion.context && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg inline-block w-fit">
                  <p className="text-amber-800 text-sm font-bold italic">
                    📍 {currentQuestion.context}
                  </p>
                </div>
              )}

              {/* --- ZONA DE DIÁLOGO CON ÍNDICE GLOBAL --- */}
              <div className="space-y-6">
                {currentQuestion.dialogue.map(
                  (line, lineIdx) => {
                    const parts = line.text
                      .replace(/_{2,}/g, "[GAP]")
                      .split("[GAP]");
                    const currentAnswer =
                      answers[currentQuestion.id];

                    let answerParts: string[] = [];
                    if (
                      currentAnswer &&
                      currentAnswer !== "NO_LO_SE"
                    ) {
                      answerParts = currentAnswer.includes("/")
                        ? currentAnswer
                            .split("/")
                            .map((s) => s.trim())
                        : [currentAnswer];
                    }

                    // Calcular índice global
                    const gapsBeforeThisLine =
                      currentQuestion.dialogue
                        .slice(0, lineIdx)
                        .reduce(
                          (acc, l) => acc + countGaps(l.text),
                          0,
                        );

                    return (
                      <div
                        key={lineIdx}
                        className={`relative pl-4 border-l-4 ${
                          line.speaker === "A"
                            ? "border-slate-300"
                            : line.speaker === "B"
                              ? "border-blue-300"
                              : "border-purple-300 italic"
                        }`}
                      >
                        {line.speaker !== "System" && (
                          <span className="absolute -top-3 left-4 text-[10px] font-black uppercase text-slate-400 bg-white px-1">
                            {line.speaker === "A"
                              ? "Persona A"
                              : "Persona B"}
                          </span>
                        )}

                        <div className="text-lg sm:text-2xl font-medium text-slate-800 leading-loose">
                          {parts.map((part, partIdx) => {
                            const textElement = (
                              <React.Fragment
                                key={`text-${partIdx}`}
                              >
                                {part}
                              </React.Fragment>
                            );
                            if (partIdx === parts.length - 1)
                              return textElement;

                            const globalGapIndex =
                              gapsBeforeThisLine + partIdx;
                            const textToRender =
                              answerParts[globalGapIndex];

                            return (
                              <React.Fragment key={partIdx}>
                                {part}
                                <span className="inline-flex mx-1.5 align-baseline relative top-0.5">
                                  {textToRender ? (
                                    <span className="text-indigo-600 font-black border-b-[3px] border-indigo-500 px-1 animate-in zoom-in-95 duration-200">
                                      {textToRender}
                                    </span>
                                  ) : (
                                    <span className="inline-block min-w-[60px] h-[1.2em] border-b-[3px] border-slate-200 rounded-sm bg-slate-50/50 transition-colors" />
                                  )}
                                </span>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* OPCIONES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    className={`p-4 rounded-xl border-2 text-left font-bold text-base transition-all active:scale-[0.98] ${
                      answers[currentQuestion.id] === opt
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-inner ring-1 ring-indigo-500"
                        : "border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 text-slate-600"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={handleDontKnow}
                  className="text-slate-400 text-xs font-bold hover:text-slate-600 underline decoration-dotted flex items-center justify-center gap-1 mx-auto"
                >
                  <HelpCircle className="w-3 h-3" /> No estoy
                  seguro (Saltar)
                </button>
              </div>
            </div>
          ) : (
            /* FASE 2: WRITING */
            <div className="flex flex-col animate-fade-in space-y-6">
              <div className="bg-[#FFFDF5] p-6 rounded-xl border border-[#E8E0C5] shadow-sm font-serif text-slate-700 text-base leading-relaxed relative">
                <span className="absolute -top-3 left-4 bg-[#E8E0C5] text-[#8A7E5C] text-[10px] font-sans font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Contexto
                </span>
                {LEVEL_TEST_DATA.writingTask.context}
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Tu Respuesta:
                </p>
                <Textarea
                  value={writingText}
                  onChange={(e) =>
                    setWritingText(e.target.value)
                  }
                  className="w-full h-56 text-base p-4 bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-xl resize-none shadow-inner"
                  placeholder="Escribe aquí..."
                />
                <div className="flex justify-between text-xs font-bold text-slate-400 px-1">
                  <span>Mínimo recomendado: 80 palabras</span>
                  <span
                    className={
                      writingText.split(/\s+/).filter((w) => w)
                        .length < 80
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }
                  >
                    {
                      writingText.split(/\s+/).filter((w) => w)
                        .length
                    }{" "}
                    palabras
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-white border-t border-slate-200 p-4 shadow-up shrink-0 safe-area-bottom">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-4">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 ${currentStep === 0 ? "invisible" : ""}`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
          </Button>

          {!isWritingStep ? (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleEarlySubmit}
                className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs h-12 px-4 rounded-xl"
              >
                <Flag className="w-4 h-4 mr-2" />
                Terminar aquí
              </Button>

              <Button
                onClick={handleNext}
                disabled={
                  !answers[currentQuestion.id] &&
                  answers[currentQuestion.id] !== "NO_LO_SE"
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95"
              >
                Siguiente{" "}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleFinish}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black px-8 h-14 w-full sm:w-auto rounded-xl shadow-xl text-lg transition-transform hover:scale-105 active:scale-95"
            >
              FINALIZAR TEST 🚀
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};