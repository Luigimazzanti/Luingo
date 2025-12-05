import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  X,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  List,
  Type,
  AlignLeft,
  CheckSquare,
  Mic,
  Sparkles,
  Loader2,
  Settings2,
  KeyRound,
  FileText,
  ImageIcon,
  Video,
  FileIcon,
  Upload,
  File,
  Users,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { toast } from "sonner@2.0.3";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { createClient } from "@supabase/supabase-js";
import { Student } from "../types"; // ✅ NUEVO: Import de Student
import {
  sendNotification,
  emailTemplates,
} from "../lib/notifications"; // ✅ AGREGADO: Sistema de notificaciones

// ✅ CONFIGURACIÓN DE ETIQUETAS (Colores y Iconos)
const TASK_TAGS = [
  {
    id: "grammar",
    label: "Gramática",
    icon: "🧩",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  {
    id: "vocabulary",
    label: "Vocabulario",
    icon: "🗣️",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  {
    id: "listening",
    label: "Comprensión Oral",
    icon: "🎧",
    color: "bg-rose-100 text-rose-700 border-rose-200",
  },
  {
    id: "reading",
    label: "Comprensión Lectora",
    icon: "📖",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  {
    id: "speaking",
    label: "Expresión Oral",
    icon: "🎙️",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    id: "culture",
    label: "Cultura",
    icon: "🌍",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
];

// ========== TIPOS ==========
type QuestionType =
  | "choice"
  | "true_false"
  | "fill_blank"
  | "open";

interface QuestionDraft {
  id: number;
  type: QuestionType;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  allow_audio?: boolean;
}

interface TaskBuilderProps {
  onSaveTask: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  initialStudentId?: string;
  studentName?: string;
  autoOpenAI?: boolean;
  students: Student[]; // ✅ NUEVO: Recibir lista de estudiantes
}

export const TaskBuilder: React.FC<TaskBuilderProps> = ({
  onSaveTask,
  onCancel,
  initialData,
  initialStudentId,
  studentName,
  autoOpenAI,
  students, // ✅ NUEVO: Desestructurar students
}) => {
  // ========== ESTADOS BÁSICOS ==========
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [category, setCategory] = useState<
    "homework" | "quiz" | "project"
  >(initialData?.category || "homework");
  const [assignType, setAssignType] = useState(
    initialData?.content_data?.assignment_scope?.type ||
      (initialStudentId ? "individual" : "class"),
  );
  const [selectedLevel, setSelectedLevel] = useState(
    initialData?.content_data?.assignment_scope?.targetId ||
      "A1",
  );
  const [maxAttempts, setMaxAttempts] = useState(
    initialData?.content_data?.max_attempts || 1,
  );

  // ✅ NUEVO: Estado para asignación de estudiantes (Default: 'all')
  const [assignedTo, setAssignedTo] = useState<string[]>(
    initialData?.content_data?.assignees || ["all"],
  );

  // ✅ NUEVO: Modo de asignación ('level' = todos del nivel, 'individual' = estudiante específico)
  const [assignMode, setAssignMode] = useState<
    "level" | "individual"
  >(
    initialData?.content_data?.assignment_scope?.type ===
      "individual"
      ? "individual"
      : "level",
  );

  // ✅ NUEVO: Tipo de tarea (Quiz vs Writing vs Document)
  const [taskType, setTaskType] = useState<
    "quiz" | "writing" | "document" | "audio"
  >(
    initialData?.content_data?.type === "writing"
      ? "writing"
      : initialData?.content_data?.type === "document"
        ? "document"
        : initialData?.content_data?.type === "audio"
          ? "audio"
          : "quiz",
  );

  // ✅ NUEVO: Estados para Writing
  const [writingPrompt, setWritingPrompt] = useState(
    initialData?.content_data?.writing_prompt || "",
  );
  const [minWords, setMinWords] = useState(
    initialData?.content_data?.min_words || 100,
  );
  const [maxWords, setMaxWords] = useState(
    initialData?.content_data?.max_words || 500,
  );
  const [resourceUrl, setResourceUrl] = useState(
    initialData?.content_data?.resource_url || "",
  );
  const [resourceType, setResourceType] = useState<
    "image" | "video" | "pdf" | "none"
  >(initialData?.content_data?.resource_type || "none");

  // ✅ FECHA LÍMITE CON PARSEO ROBUSTO (Fix para input type="date")
  const [dueDate, setDueDate] = useState(() => {
    const rawDate =
      initialData?.due_date ||
      initialData?.content_data?.due_date;
    if (!rawDate) return "";
    // Convertir a formato YYYY-MM-DD compatible con <input type="date">
    try {
      return new Date(rawDate).toISOString().split("T")[0];
    } catch {
      return "";
    }
  });

  // ✅ NUEVO: Estados para Document PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState(
    initialData?.content_data?.pdf_url || "",
  );
  const [pdfInstructions, setPdfInstructions] = useState(
    initialData?.content_data?.pdf_instructions || "",
  );

  // ✅ NUEVO: Estados para Audio Task
  const [teacherAudioUrl, setTeacherAudioUrl] = useState(initialData?.content_data?.audio_url || '');
  const [studentAudioRequired, setStudentAudioRequired] = useState(initialData?.content_data?.student_audio_required || false);

  // Estado para upload de PDF
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // ✅ NUEVO ESTADO PARA ETIQUETAS (Array de strings)
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.content_data?.tags || [],
  );

  // Función para manejar la selección (Máximo 3)
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId))
        return prev.filter((t) => t !== tagId); // Desmarcar
      if (prev.length >= 3) return prev; // Límite alcanzado
      return [...prev, tagId]; // Marcar
    });
  };

  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialData?.content_data?.questions || [
      {
        id: Date.now(),
        type: "choice",
        question_text: "",
        options: ["", ""],
        correct_answer: "",
        explanation: "",
        allow_audio: false,
      },
    ],
  );

  // ========== 🔒 ESTADOS IA & SEGURIDAD ==========
  const [showAiModal, setShowAiModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiNumQuestions, setAiNumQuestions] = useState(3);
  const [aiLevel, setAiLevel] = useState("A1");
  const [aiDifficulty, setAiDifficulty] = useState("Básico");
  const [isGenerating, setIsGenerating] = useState(false);

  // ✅ RECUPERAR CLAVE DEL NAVEGADOR (NO HARDCODEADA)
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("groq_key") || "",
  );

  useEffect(() => {
    if (autoOpenAI && !initialData) {
      setShowAiModal(true);
    }
  }, [autoOpenAI, initialData]);

  // ========== HANDLERS DE CLAVE API ==========
  const handleSaveKey = (key: string) => {
    const cleanKey = key.trim();
    if (!cleanKey) {
      toast.error("La clave no puede estar vacía");
      return;
    }
    localStorage.setItem("groq_key", cleanKey);
    setApiKey(cleanKey);
    setShowKeyModal(false);
    toast.success(
      "🔒 Clave guardada de forma segura en tu navegador",
    );
  };

  // ========== HANDLERS DE PREGUNTAS ==========
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        type: "choice",
        question_text: "",
        options: ["", ""],
        correct_answer: "",
        explanation: "",
        allow_audio: false,
      },
    ]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const updateQuestion = (
    id: number,
    field: keyof QuestionDraft,
    value: any,
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q,
      ),
    );
  };

  const addOption = (qId: number) => {
    const q = questions.find((x) => x.id === qId);
    if (q) {
      updateQuestion(qId, "options", [...q.options, ""]);
    }
  };

  const removeOption = (qId: number, idx: number) => {
    const q = questions.find((x) => x.id === qId);
    if (q && q.options.length > 2) {
      updateQuestion(
        qId,
        "options",
        q.options.filter((_, i) => i !== idx),
      );
    }
  };

  const updateOptionText = (
    qId: number,
    idx: number,
    val: string,
  ) => {
    const q = questions.find((x) => x.id === qId);
    if (!q) return;

    const opts = [...q.options];
    opts[idx] = val;
    updateQuestion(qId, "options", opts);

    // Si la respuesta correcta era la opción modificada, actualizarla
    if (q.correct_answer === q.options[idx]) {
      updateQuestion(qId, "correct_answer", val);
    }
  };

  // ========== MANEJO DE PDF ==========
  const handlePdfUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("❌ Solo se permiten archivos PDF");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB límite
      toast.error("❌ El PDF no debe exceder 10MB");
      return;
    }

    setIsUploadingPdf(true);
    try {
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey,
      );

      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { data, error } = await supabase.storage
        .from("assignments")
        .upload(`pdfs/${fileName}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("assignments")
        .getPublicUrl(`pdfs/${fileName}`);

      setPdfUrl(publicUrl);
      setPdfFile(file);
      toast.success("✅ PDF subido correctamente");
    } catch (error) {
      console.error("Error subiendo PDF:", error);
      toast.error("❌ Error al subir el PDF");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // ========== GUARDAR TAREA ==========
  const handleSave = () => {
    if (!title.trim()) {
      toast.error("❌ El título es obligatorio");
      return;
    }

    // ✅ AUTO-GENERAR DESCRIPCIÓN PARA MOODLE (Ya que borramos el input)
    // Esto es lo que Moodle guardará como "mensaje" del post.
    const autoDescription =
      selectedTags.length > 0
        ? `Etiquetas: ${selectedTags.map((t) => TASK_TAGS.find((x) => x.id === t)?.label).join(", ")}`
        : "Actividad General";

    // 1. Lógica de Destinatarios
    let finalAssignees = ["all"];
    let finalScopeType = "level";
    let finalTargetId = selectedLevel;
    let recipientEmails: string[] = [];

    if (assignMode === "individual") {
      finalScopeType = "individual";
      finalTargetId = assignedTo[0];
      finalAssignees = assignedTo;

      const targetStudent = students.find(
        (s) => s.id === assignedTo[0],
      );
      if (targetStudent?.email)
        recipientEmails.push(targetStudent.email);
    } else {
      finalScopeType = "level";
      finalTargetId = selectedLevel;
      finalAssignees = ["all"];

      recipientEmails = students
        .filter((s) => s.current_level_code === selectedLevel)
        .map((s) => s.email)
        .filter(Boolean) as string[];
    }

    // 2. Construcción del Objeto (CON FIX DE NIVEL)
    const taskData = {
      ...initialData,
      title,
      description: autoDescription, // 👈 Enviamos el texto generado
      level_tag: selectedLevel, // Nivel externo
      category:
        taskType === "writing"
          ? "writing"
          : taskType === "document"
            ? "document"
            : taskType === "audio"
              ? "audio"
              : category,
      content_data: {
        // ✅ FIX: Guardamos 'level' explícitamente dentro de content_data para que el lector no falle
        level: selectedLevel,

        type:
          taskType === "writing"
            ? "writing"
            : taskType === "document"
              ? "document"
              : taskType === "audio"
                ? "audio"
                : "form",
        writing_prompt: writingPrompt,
        min_words: minWords,
        max_words: maxWords,
        resource_url: resourceUrl,
        resource_type: resourceType,
        pdf_url: pdfUrl,
        instructions: pdfInstructions,
        questions: questions,
        max_attempts: maxAttempts,

        // Scope de asignación correcto
        assignment_scope: {
          type: finalScopeType,
          targetId: finalTargetId,
        },
        assignees: finalAssignees,
        tags: selectedTags,
        audio_url: teacherAudioUrl,
        student_audio_required: studentAudioRequired,
      },
      color_tag: "#A8D8FF",
      due_date: dueDate,
    };

    // 3. Guardar
    onSaveTask(taskData);

    // 4. Notificar
    if (recipientEmails.length > 0) {
      // Import dinámico para no romper cabeceras si falta el import arriba
      import("../lib/notifications").then(
        ({ sendNotification, emailTemplates }) => {
          recipientEmails.forEach((email) => {
            sendNotification({
              to: email,
              subject: `Nueva Tarea: ${title}`,
              html: emailTemplates.newTask(
                title,
                assignMode === "individual"
                  ? "TI"
                  : selectedLevel,
              ),
            });
          });
        },
      );
      toast.success(
        `📧 Notificando a ${recipientEmails.length} alumnos...`,
      );
    }
  };

  // ========== ✅ GENERACIÓN IA (GROQ SECURE - POLÍGLOTA) ==========
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Escribe un tema para generar");
      return;
    }

    // ✅ 1. VERIFICAR SI HAY CLAVE
    if (!apiKey) {
      toast.error(
        "⚠️ Necesitas configurar tu API Key de Groq primero",
      );
      setShowKeyModal(true);
      return;
    }

    setIsGenerating(true);

    try {
      // MODIFICACIÓN: Prompt Políglota Inteligente
      const systemPrompt = `
        Actúa como un experto profesor de idiomas políglota.
        
        TU MISIÓN:
        Analiza el "Tema" que te dará el usuario y DETECTA EL IDIOMA OBJETIVO.
        Genera una actividad educativa JSON completa EN ESE IDIOMA DETECTADO.
        
        EJEMPLOS DE COMPORTAMIENTO:
        - Si el tema es "Past Simple" -> Genera TODO (Título, Preguntas, Explicaciones) en INGLÉS.
        - Si el tema es "I Verbi" -> Genera TODO en ITALIANO.
        - Si el tema es "Subjuntivo" -> Genera TODO en ESPAÑOL.
        - Si el tema es "Les Couleurs" -> Genera TODO en FRANCÉS.
        
        REGLAS ESTRICTAS:
        1. El Título, Descripción, Preguntas, Opciones y Explicaciones deben estar en el idioma que se está enseñando.
        2. Genera preguntas variadas: choice, true_false, fill_blank, open.
        3. Para "choice": mínimo 2 opciones, máximo 4.
        4. Para "true_false": opciones fijas traducidas al idioma destino (ej: "True/False" o "Vero/Falso").
        5. Responde ÚNICAMENTE el JSON.
        
        Tema del usuario: "${aiPrompt}"
        Nivel: ${aiLevel}
        Dificultad: ${aiDifficulty}
        Cantidad de preguntas: ${aiNumQuestions}
        
        FORMATO JSON EXACTO:
        {
          "title": "Título en el idioma detectado",
          "description": "Instrucciones en el idioma detectado",
          "questions": [
            {
              "type": "choice",
              "question_text": "¿Pregunta en el idioma detectado?",
              "options": ["Opción A", "Opción B"],
              "correct_answer": "Opción A",
              "explanation": "Explicación breve en el idioma detectado"
            }
          ]
        }
      `;

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            response_format: { type: "json_object" },
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error?.message || "Error de API Groq",
        );
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "{}";
      const result = JSON.parse(content);

      // Aplicar resultados
      setTitle(result.title);
      setDescription(result.description);
      setQuestions(
        result.questions.map((q: any, i: number) => ({
          ...q,
          id: Date.now() + i,
          allow_audio: q.type === "open",
        })),
      );

      toast.success(
        "✨ ¡Contenido generado en el idioma detectado!",
      );
      setShowAiModal(false);
      setAiPrompt("");
    } catch (error) {
      console.error("Groq Error:", error);
      toast.error(
        `❌ Error: ${error instanceof Error ? error.message : "Fallo de conexión"}`,
      );

      if (
        String(error).includes("401") ||
        String(error).includes("key") ||
        String(error).includes("Invalid API")
      ) {
        toast.error("⚠️ API Key inválida o revocada");
        setShowKeyModal(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // ========== RENDERIZADO DE PREGUNTAS ==========
  const renderQuestionBody = (
    q: QuestionDraft,
    idx: number,
  ) => {
    if (q.type === "choice") {
      return (
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <button
                onClick={() =>
                  updateQuestion(q.id, "correct_answer", opt)
                }
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 bg-white",
                  q.correct_answer === opt
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-300",
                )}
              >
                {q.correct_answer === opt && (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </button>
              <Input
                value={opt}
                onChange={(e) =>
                  updateOptionText(q.id, i, e.target.value)
                }
                className="flex-1 bg-white border-2"
                placeholder={`Opción ${i + 1}`}
              />
              {q.options.length > 2 && (
                <button onClick={() => removeOption(q.id, i)}>
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </button>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addOption(q.id)}
            className="text-indigo-600 font-bold ml-10"
          >
            <Plus className="w-4 h-4 mr-1" /> Añadir opción
          </Button>
        </div>
      );
    }

    if (q.type === "true_false") {
      return (
        <div className="flex gap-3">
          {["Verdadero", "Falso"].map((val) => (
            <button
              key={val}
              onClick={() =>
                updateQuestion(q.id, "correct_answer", val)
              }
              className={cn(
                "flex-1 py-4 rounded-xl border-2 font-bold bg-white",
                q.correct_answer === val
                  ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                  : "border-slate-200",
              )}
            >
              {val}
            </button>
          ))}
        </div>
      );
    }

    if (q.type === "fill_blank") {
      return (
        <div className="space-y-2">
          <label className="text-xs font-bold text-amber-700 uppercase">
            Respuesta Oculta:
          </label>
          <Input
            value={q.correct_answer}
            onChange={(e) =>
              updateQuestion(
                q.id,
                "correct_answer",
                e.target.value,
              )
            }
            className="bg-white border-2 border-amber-200 text-amber-900 font-bold h-12"
            placeholder="Respuesta correcta"
          />
        </div>
      );
    }

    if (q.type === "open") {
      return (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 italic">
            Respuesta Libre (Sin calificación automática)
          </p>
          <button
            onClick={() =>
              updateQuestion(
                q.id,
                "allow_audio",
                !q.allow_audio,
              )
            }
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold border-2 flex gap-2 items-center",
              q.allow_audio
                ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                : "bg-white border-slate-200",
            )}
          >
            <Mic className="w-4 h-4" />
            {q.allow_audio ? "🎤 Audio Activado" : "Solo Texto"}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 w-full max-w-4xl h-[95vh] sm:h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 sm:border-4 border-white">
        {/* ========== HEADER ========== */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 sm:p-6 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center">
              <Save className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {initialData ? "Editar Tarea" : "Nueva Tarea"}
              </h2>
              <p className="text-indigo-100 text-xs sm:text-sm hidden sm:block">
                Construye tu actividad paso a paso
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* ✅ BOTÓN DE CONFIGURACIÓN DE API KEY */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center transition-all"
              title="Configurar API Key"
            >
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <button
              onClick={onCancel}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>

        {/* ========== BODY (SCROLLABLE) ========== */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* META INFO */}
          <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 space-y-3 sm:space-y-4">
            {/* ✅ SELECTOR DE TIPO: QUIZ VS WRITING VS DOCUMENT */}
            <div>
              <label className="text-xs font-black text-slate-600 uppercase mb-2 sm:mb-3 block">
                Tipo de Tarea
              </label>
              <div className="grid grid-cols-4 gap-2 sm:gap-2">
                <button
                  onClick={() => setTaskType("quiz")}
                  className={cn(
                    "py-2.5 sm:py-4 px-1 sm:px-3 rounded-lg sm:rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-0.5 sm:gap-2",
                    taskType === "quiz"
                      ? "bg-indigo-100 border-indigo-500 text-indigo-700 shadow-lg"
                      : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300",
                  )}
                >
                  <CheckSquare className="w-5 h-5 sm:w-5 sm:h-5" />
                  <span className="hidden sm:block text-sm leading-tight">
                    Cuestionario
                  </span>
                </button>
                <button
                  onClick={() => setTaskType("writing")}
                  className={cn(
                    "py-2.5 sm:py-4 px-1 sm:px-3 rounded-lg sm:rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-0.5 sm:gap-2",
                    taskType === "writing"
                      ? "bg-emerald-100 border-emerald-500 text-emerald-700 shadow-lg"
                      : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300",
                  )}
                >
                  <FileText className="w-5 h-5 sm:w-5 sm:h-5" />
                  <span className="hidden sm:block text-sm leading-tight">
                    Redacción
                  </span>
                </button>
                <button
                  onClick={() => setTaskType("document")}
                  className={cn(
                    "py-2.5 sm:py-4 px-1 sm:px-3 rounded-lg sm:rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-0.5 sm:gap-2",
                    taskType === "document"
                      ? "bg-amber-100 border-amber-500 text-amber-700 shadow-lg"
                      : "bg-white border-slate-200 text-slate-600 hover:border-amber-300",
                  )}
                >
                  <File className="w-5 h-5 sm:w-5 sm:h-5" />
                  <span className="hidden sm:block text-sm leading-tight">
                    Doc. PDF
                  </span>
                </button>
                <button
                  onClick={() => {
                    setTaskType("audio");
                    setMaxAttempts(2); // 👈 Lógica de intentos: Max 2 para audio
                  }}
                  className={cn(
                    "py-2.5 sm:py-4 px-1 sm:px-3 rounded-lg sm:rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-0.5 sm:gap-2",
                    taskType === "audio"
                      ? "bg-rose-100 border-rose-500 text-rose-700 shadow-lg"
                      : "bg-white border-slate-200 text-slate-600 hover:border-rose-300",
                  )}
                >
                  <Mic className="w-5 h-5 sm:w-5 sm:h-5" />
                  <span className="hidden sm:block text-sm leading-tight">
                    Audio / Oral
                  </span>
                </button>
              </div>
            </div>

            {/* ✅ NUEVO BLOQUE DE ASIGNACIÓN (Movido desde el footer) */}
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
                  Asignación
                </label>

                <div className="flex bg-white rounded-lg p-1 border border-slate-200 w-full sm:w-auto">
                  <button
                    onClick={() => setAssignMode("level")}
                    className={cn(
                      "px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all flex-1 sm:flex-none",
                      assignMode === "level"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    Por Nivel
                  </button>
                  <button
                    onClick={() => setAssignMode("individual")}
                    className={cn(
                      "px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all flex-1 sm:flex-none",
                      assignMode === "individual"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    Individual
                  </button>
                </div>
              </div>

              {assignMode === "level" ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                    Selecciona el Nivel
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map(
                      (lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setSelectedLevel(lvl)}
                          className={cn(
                            "h-8 sm:h-9 rounded-lg font-black text-xs border-b-4 active:border-b-0 active:translate-y-[2px] transition-all",
                            selectedLevel === lvl
                              ? "bg-indigo-500 border-indigo-700 text-white shadow-indigo-200"
                              : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50",
                          )}
                        >
                          {lvl}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                    Selecciona el Estudiante
                  </label>
                  <select
                    value={
                      assignedTo[0] === "all"
                        ? ""
                        : assignedTo[0]
                    }
                    onChange={(e) =>
                      setAssignedTo([e.target.value])
                    }
                    className="w-full h-9 sm:h-10 pl-2 sm:pl-3 bg-white border-2 border-slate-200 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-slate-700 focus:border-indigo-500 focus:ring-0"
                  >
                    <option value="" disabled>
                      Buscar estudiante...
                    </option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.current_level_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-black text-slate-600 uppercase mb-2 block">
                Título de la Misión
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-50 border-2 border-slate-200 h-10 sm:h-12 font-bold text-base sm:text-lg"
                placeholder="Ej: Verbos en Presente"
              />
            </div>

            {/* ✅ NUEVO SELECTOR DE ETIQUETAS (Reemplaza a Descripción) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-slate-500 uppercase">
                  Tipo de Actividad
                </label>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {selectedTags.length}/3 Seleccionados
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TASK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(
                    tag.id,
                  );
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl border-2 transition-all text-left",
                        isSelected
                          ? `${tag.color} border-current shadow-sm scale-[1.02]`
                          : "bg-white border-slate-100 text-slate-400 hover:border-indigo-100 grayscale hover:grayscale-0",
                      )}
                    >
                      <span className="text-xl">
                        {tag.icon}
                      </span>
                      <span className="text-[11px] font-bold leading-tight">
                        {tag.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ✅ LAYOUT RESPONSIVE: Columna en mobile, fila en desktop */}
            <div className="flex flex-col sm:flex-row gap-4">
              {taskType === "quiz" && (
                <div className="flex-1">
                  <label className="text-xs font-black text-slate-600 uppercase mb-2 block">
                    Intentos Máx.
                  </label>
                  <Input
                    type="number"
                    value={maxAttempts}
                    onChange={(e) =>
                      setMaxAttempts(Number(e.target.value))
                    }
                    className="bg-slate-50 border-2 border-slate-200 h-10"
                    min={1}
                    max={10}
                  />
                </div>
              )}
              {taskType === "quiz" && (
                <Button
                  onClick={() => setShowAiModal(true)}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black px-6 rounded-xl h-10 shadow-lg hover:shadow-xl transition-all sm:mt-6 w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generar con IA
                </Button>
              )}
            </div>
          </div>

          {/* ✅ CONFIGURACIÓN ESPECÍFICA PARA WRITING */}
          {taskType === "writing" && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl shadow-sm border-2 border-emerald-200 space-y-4">
              <h3 className="font-black text-emerald-900 flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                Configuración de Redacción
              </h3>

              <div>
                <label className="text-xs font-black text-emerald-800 uppercase mb-2 block">
                  Instrucción de Redacción *
                </label>
                <Textarea
                  value={writingPrompt}
                  onChange={(e) =>
                    setWritingPrompt(e.target.value)
                  }
                  className="bg-white border-2 border-emerald-300 h-24 resize-none"
                  placeholder="Ej: Escribe una carta formal a tu profesor explicando por qué no pudiste asistir a clase..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-emerald-800 uppercase mb-2 block">
                    Mínimo de Palabras
                  </label>
                  <Input
                    type="number"
                    value={minWords}
                    onChange={(e) =>
                      setMinWords(Number(e.target.value))
                    }
                    className="bg-white border-2 border-emerald-300 h-10"
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-emerald-800 uppercase mb-2 block">
                    Máximo de Palabras
                  </label>
                  <Input
                    type="number"
                    value={maxWords}
                    onChange={(e) =>
                      setMaxWords(Number(e.target.value))
                    }
                    className="bg-white border-2 border-emerald-300 h-10"
                    min={minWords}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-emerald-800 uppercase mb-2 block">
                  Recurso Multimedia (Opcional)
                </label>
                <div className="space-y-3">
                  <select
                    value={resourceType}
                    onChange={(e) =>
                      setResourceType(e.target.value as any)
                    }
                    className="w-full h-10 px-3 bg-white border-2 border-emerald-300 rounded-lg font-bold text-sm"
                  >
                    <option value="none">Sin recurso</option>
                    <option value="image">Imagen</option>
                    <option value="video">
                      Video (YouTube)
                    </option>
                    <option value="pdf">PDF</option>
                  </select>

                  {resourceType !== "none" && (
                    <div className="flex items-center gap-2">
                      {resourceType === "image" && (
                        <ImageIcon className="w-5 h-5 text-emerald-600" />
                      )}
                      {resourceType === "video" && (
                        <Video className="w-5 h-5 text-emerald-600" />
                      )}
                      {resourceType === "pdf" && (
                        <FileIcon className="w-5 h-5 text-emerald-600" />
                      )}
                      <Input
                        value={resourceUrl}
                        onChange={(e) =>
                          setResourceUrl(e.target.value)
                        }
                        className="flex-1 bg-white border-2 border-emerald-300 h-10"
                        placeholder={
                          resourceType === "image"
                            ? "URL de la imagen"
                            : resourceType === "video"
                              ? "URL de YouTube"
                              : "URL del PDF"
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-emerald-800 uppercase mb-2 block">
                  Fecha Límite (Opcional)
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white border-2 border-emerald-300 h-10"
                />
              </div>
            </div>
          )}

          {/* ✅ CONFIGURACIÓN ESPECÍFICA PARA DOCUMENT PDF */}
          {taskType === "document" && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl shadow-sm border-2 border-amber-200 space-y-4">
              <h3 className="font-black text-amber-900 flex items-center gap-2 text-lg">
                <File className="w-5 h-5" />
                Documento PDF
              </h3>

              <div>
                <label className="text-xs font-black text-amber-800 uppercase mb-2 block">
                  Archivo PDF
                </label>
                <div className="space-y-3">
                  {!pdfUrl ? (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        disabled={isUploadingPdf}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="pdf-upload"
                      />
                      <label
                        htmlFor="pdf-upload"
                        className={cn(
                          "flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                          isUploadingPdf
                            ? "bg-amber-100 border-amber-400 cursor-not-allowed"
                            : "bg-white border-amber-300 hover:border-amber-500 hover:bg-amber-50",
                        )}
                      >
                        {isUploadingPdf ? (
                          <>
                            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                            <span className="text-sm font-bold text-amber-700">
                              Subiendo PDF...
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-amber-600" />
                            <div className="text-center">
                              <span className="block text-sm font-bold text-amber-900">
                                Haz clic para subir un PDF
                              </span>
                              <span className="block text-xs text-amber-600 mt-1">
                                Máximo 10MB
                              </span>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-white border-2 border-amber-300 rounded-xl">
                      <File className="w-8 h-8 text-amber-600" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-900">
                          PDF Cargado
                        </p>
                        <p className="text-xs text-amber-600 truncate">
                          {pdfFile?.name || "Archivo.pdf"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPdfUrl("");
                          setPdfFile(null);
                        }}
                        className="text-rose-600 border-rose-300 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-amber-800 uppercase mb-2 block">
                  Instrucciones para el alumno
                </label>
                <Textarea
                  value={pdfInstructions}
                  onChange={(e) =>
                    setPdfInstructions(e.target.value)
                  }
                  className="bg-white border-2 border-amber-300 h-24 resize-none"
                  placeholder="Ej: Lee el documento y completa las anotaciones según las instrucciones..."
                />
              </div>

              <div>
                <label className="text-xs font-black text-amber-800 uppercase mb-2 block">
                  Fecha Límite (Opcional)
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white border-2 border-amber-300 h-10"
                />
              </div>
            </div>
          )}

          {/* ✅ CONFIGURACIÓN ESPECÍFICA PARA AUDIO */}
          {taskType === "audio" && (
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-2xl shadow-sm border-2 border-rose-200 space-y-6">
              <h3 className="font-black text-rose-900 flex items-center gap-2 text-lg">
                <Mic className="w-5 h-5" />
                Configuración de Audio
              </h3>

              {/* 1. Audio del Profesor */}
              <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                <label className="text-xs font-black text-rose-800 uppercase mb-2 block">
                  Audio/Video de referencia (Profesor)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={teacherAudioUrl}
                    onChange={e => setTeacherAudioUrl(e.target.value)}
                    className="border-rose-200 focus:border-rose-500"
                    placeholder="Link de MP3 o YouTube (Opcional)"
                  />
                </div>
                <p className="text-[10px] text-rose-400 mt-1 font-bold">
                  * Si lo dejas vacío, será solo una tarea de Speaking (Grabar).
                </p>
              </div>

              {/* 2. Instrucciones */}
              <div>
                <label className="text-xs font-black text-rose-800 uppercase mb-2 block">
                  Instrucciones
                </label>
                <Textarea
                  value={pdfInstructions}
                  onChange={e => setPdfInstructions(e.target.value)}
                  className="bg-white border-rose-200 min-h-[80px]"
                  placeholder="Ej: Escucha el audio y responde las preguntas, o graba tu opinión sobre..."
                />
              </div>

              {/* 3. Respuesta del Alumno */}
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-rose-100">
                <div 
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${studentAudioRequired ? 'bg-rose-500' : 'bg-slate-200'}`}
                  onClick={() => setStudentAudioRequired(!studentAudioRequired)}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${studentAudioRequired ? 'translate-x-4' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-900">Solicitar Grabación al Alumno</p>
                  <p className="text-xs text-rose-500">El alumno deberá adjuntar un link de audio (Vocaroo).</p>
                </div>
              </div>

              {/* 4. Intentos */}
              <div>
                <label className="text-xs font-black text-rose-800 uppercase mb-2 block">Intentos Permitidos</label>
                <Input
                  type="number"
                  value={maxAttempts}
                  onChange={e => setMaxAttempts(Number(e.target.value))}
                  className="bg-white border-rose-200 h-10 w-24"
                  min={1}
                  max={2}
                />
              </div>

              {/* 5. Fecha Límite */}
              <div>
                <label className="text-xs font-black text-rose-800 uppercase mb-2 block">
                  Fecha Límite (Opcional)
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white border-2 border-rose-300 h-10"
                />
              </div>
            </div>
          )}

          {/* PREGUNTAS (PARA QUIZ Y AUDIO) */}
          {(taskType === "quiz" || taskType === "audio") && (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-200 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <select
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(
                            q.id,
                            "type",
                            e.target.value as QuestionType,
                          )
                        }
                        className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg font-bold text-sm"
                      >
                        <option value="choice">
                          Opción Múltiple
                        </option>
                        <option value="true_false">
                          Verdadero/Falso
                        </option>
                        <option value="fill_blank">
                          Completar
                        </option>
                        <option value="open">Abierta</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="text-rose-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-600 uppercase mb-2 block">
                      Pregunta
                    </label>
                    <Textarea
                      value={q.question_text}
                      onChange={(e) =>
                        updateQuestion(
                          q.id,
                          "question_text",
                          e.target.value,
                        )
                      }
                      className="bg-slate-50 border-2 border-slate-200 h-16 resize-none"
                      placeholder="Escribe tu pregunta aquí..."
                    />
                  </div>

                  {renderQuestionBody(q, idx)}

                  <div>
                    <label className="text-xs font-black text-slate-600 uppercase mb-2 block">
                      Explicación
                    </label>
                    <Textarea
                      value={q.explanation}
                      onChange={(e) =>
                        updateQuestion(
                          q.id,
                          "explanation",
                          e.target.value,
                        )
                      }
                      className="bg-amber-50 border-2 border-amber-200 h-16 resize-none text-amber-900"
                      placeholder="Explica por qué es correcta..."
                    />
                  </div>
                </div>
              ))}

              <Button
                onClick={addQuestion}
                variant="outline"
                className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 h-12 font-bold rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Añadir Pregunta
              </Button>
            </div>
          )}
        </div>

        {/* ========== FOOTER LIMPIO ========== */}
        <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 rounded-xl h-12 text-lg shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            {initialData ? "Guardar Cambios" : "Crear Tarea"}
          </Button>
        </div>

        {/* ========== MODAL IA ========== */}
        <Dialog
          open={showAiModal}
          onOpenChange={setShowAiModal}
        >
          <DialogContent className="w-[95%] sm:w-[90%] max-w-lg rounded-2xl p-4 sm:p-6 border-4 border-orange-200 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-black text-orange-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                Generador Groq AI
              </DialogTitle>
              <DialogDescription className="text-sm">
                Describe el tema y deja que la IA cree las
                preguntas por ti.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ej: Verbos irregulares en pasado, Vocabulario de la familia, etc."
              className="h-20 sm:h-24 text-base sm:text-lg bg-orange-50 border-orange-200 rounded-xl mb-4"
            />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
              <div className="space-y-1 flex-1">
                <label className="text-[10px] font-black text-orange-800 uppercase">
                  Cantidad: {aiNumQuestions}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={aiNumQuestions}
                  onChange={(e) =>
                    setAiNumQuestions(Number(e.target.value))
                  }
                  className="w-full accent-orange-500"
                />
              </div>
              <div className="flex gap-3 sm:gap-4">
                <div className="space-y-1 flex-1 sm:w-24">
                  <label className="text-[10px] font-black text-orange-800 uppercase">
                    Nivel
                  </label>
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value)}
                    className="w-full h-8 bg-white border border-orange-200 rounded font-bold text-xs"
                  >
                    <option>A1</option>
                    <option>A2</option>
                    <option>B1</option>
                    <option>B2</option>
                    <option>C1</option>
                  </select>
                </div>
                <div className="space-y-1 flex-1 sm:w-24">
                  <label className="text-[10px] font-black text-orange-800 uppercase">
                    Dificultad
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) =>
                      setAiDifficulty(e.target.value)
                    }
                    className="w-full h-8 bg-white border border-orange-200 rounded font-bold text-xs"
                  >
                    <option>Básico</option>
                    <option>Medio</option>
                    <option>Reto</option>
                  </select>
                </div>
              </div>
            </div>
            <Button
              onClick={handleAiGenerate}
              disabled={isGenerating}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black h-12 rounded-xl shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  GENERAR
                </>
              )}
            </Button>
          </DialogContent>
        </Dialog>

        {/* ========== ✅ MODAL CONFIGURACIÓN DE API KEY ========== */}
        <Dialog
          open={showKeyModal}
          onOpenChange={setShowKeyModal}
        >
          <DialogContent className="w-[90%] max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-black">
                <KeyRound className="w-6 h-6 text-indigo-600" />
                Configurar Groq API
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 mt-2">
                Pega tu clave de API de Groq aquí. Se guardará
                de forma segura en tu navegador.
                <br />
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-bold hover:underline mt-2 inline-block"
                >
                  → Obtener clave en console.groq.com
                </a>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                type="password"
                className="bg-slate-50 border-2 h-12 font-mono"
              />
              <Button
                onClick={() => handleSaveKey(apiKey)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 rounded-xl"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Guardar Clave
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};