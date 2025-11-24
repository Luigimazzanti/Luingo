import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { X, Save, Plus, Trash2, CheckCircle2, List, Type, AlignLeft, CheckSquare, Mic, Sparkles, Loader2, Settings2, KeyRound } from 'lucide-react';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner@2.0.3';

// ========== TIPOS ==========
type QuestionType = 'choice' | 'true_false' | 'fill_blank' | 'open';

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
}

export const TaskBuilder: React.FC<TaskBuilderProps> = ({
  onSaveTask,
  onCancel,
  initialData,
  initialStudentId,
  studentName,
  autoOpenAI
}) => {
  // ========== ESTADOS BÁSICOS ==========
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<'homework' | 'quiz' | 'project'>(initialData?.category || 'homework');
  const [assignType, setAssignType] = useState(
    initialData?.content_data?.assignment_scope?.type || (initialStudentId ? 'individual' : 'class')
  );
  const [selectedLevel, setSelectedLevel] = useState(initialData?.content_data?.assignment_scope?.targetId || 'A1');
  const [maxAttempts, setMaxAttempts] = useState(initialData?.content_data?.max_attempts || 3);

  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialData?.content_data?.questions || [
      {
        id: Date.now(),
        type: 'choice',
        question_text: '',
        options: ['', ''],
        correct_answer: '',
        explanation: '',
        allow_audio: false
      }
    ]
  );

  // ========== 🔒 ESTADOS IA & SEGURIDAD ==========
  const [showAiModal, setShowAiModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState(3);
  const [aiLevel, setAiLevel] = useState('A1');
  const [aiDifficulty, setAiDifficulty] = useState('Básico');
  const [isGenerating, setIsGenerating] = useState(false);

  // ✅ RECUPERAR CLAVE DEL NAVEGADOR (NO HARDCODEADA)
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_key') || '');

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
    localStorage.setItem('groq_key', cleanKey);
    setApiKey(cleanKey);
    setShowKeyModal(false);
    toast.success("🔒 Clave guardada de forma segura en tu navegador");
  };

  // ========== HANDLERS DE PREGUNTAS ==========
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        type: 'choice',
        question_text: '',
        options: ['', ''],
        correct_answer: '',
        explanation: '',
        allow_audio: false
      }
    ]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: number, field: keyof QuestionDraft, value: any) => {
    setQuestions(questions.map(q => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const addOption = (qId: number) => {
    const q = questions.find(x => x.id === qId);
    if (q) {
      updateQuestion(qId, 'options', [...q.options, '']);
    }
  };

  const removeOption = (qId: number, idx: number) => {
    const q = questions.find(x => x.id === qId);
    if (q && q.options.length > 2) {
      updateQuestion(qId, 'options', q.options.filter((_, i) => i !== idx));
    }
  };

  const updateOptionText = (qId: number, idx: number, val: string) => {
    const q = questions.find(x => x.id === qId);
    if (!q) return;
    
    const opts = [...q.options];
    opts[idx] = val;
    updateQuestion(qId, 'options', opts);
    
    // Si la respuesta correcta era la opción modificada, actualizarla
    if (q.correct_answer === q.options[idx]) {
      updateQuestion(qId, 'correct_answer', val);
    }
  };

  // ========== GUARDAR TAREA ==========
  const handleSave = () => {
    if (!title.trim()) {
      toast.error("❌ El título es obligatorio");
      return;
    }

    const taskData = {
      ...initialData,
      title,
      description,
      category,
      content_data: {
        type: 'form',
        questions,
        max_attempts: maxAttempts,
        assignment_scope: {
          type: assignType,
          targetId: assignType === 'individual' ? initialStudentId : assignType === 'level' ? selectedLevel : undefined,
          targetName: assignType === 'individual' ? studentName : undefined
        }
      },
      color_tag: '#A8D8FF'
    };

    onSaveTask(taskData);
  };

  // ========== ✅ GENERACIÓN IA (GROQ SECURE) ==========
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Escribe un tema para generar");
      return;
    }

    // ✅ 1. VERIFICAR SI HAY CLAVE
    if (!apiKey) {
      toast.error("⚠️ Necesitas configurar tu API Key de Groq primero");
      setShowKeyModal(true);
      return;
    }

    setIsGenerating(true);
    
    try {
      const systemPrompt = `
        Actúa como un experto profesor de Español (ELE).
        Crea una actividad educativa en formato JSON estricto.
        
        Tema: "${aiPrompt}"
        Nivel: ${aiLevel}
        Dificultad: ${aiDifficulty}
        Cantidad de preguntas: ${aiNumQuestions}
        
        REGLAS ESTRICTAS:
        1. Genera preguntas variadas: choice (opción múltiple), true_false (verdadero/falso), fill_blank (completar), open (abierta).
        2. Para "choice": mínimo 2 opciones, máximo 4.
        3. Para "true_false": opciones fijas ["Verdadero", "Falso"].
        4. Para "fill_blank" y "open": correct_answer puede ser texto libre.
        5. TODAS las preguntas DEBEN tener un campo "explanation" educativo.
        6. Responde ÚNICAMENTE el JSON, sin texto adicional.
        
        FORMATO JSON EXACTO:
        {
          "title": "Título de la actividad",
          "description": "Instrucciones claras para el alumno",
          "questions": [
            {
              "type": "choice",
              "question_text": "¿Pregunta aquí?",
              "options": ["Opción A", "Opción B", "Opción C"],
              "correct_answer": "Opción A",
              "explanation": "Explicación educativa de por qué es correcta"
            }
          ]
        }
      `;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.5,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Error de API Groq");
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
          allow_audio: q.type === 'open'
        }))
      );

      toast.success("✨ ¡Contenido generado con éxito!");
      setShowAiModal(false);
      setAiPrompt('');
      
    } catch (error) {
      console.error("Groq Error:", error);
      toast.error(`❌ Error: ${error instanceof Error ? error.message : "Fallo de conexión"}`);
      
      // Si el error es de autenticación, abrir modal para corregir
      if (String(error).includes("401") || String(error).includes("key") || String(error).includes("Invalid API")) {
        toast.error("⚠️ API Key inválida o revocada");
        setShowKeyModal(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // ========== RENDERIZADO DE PREGUNTAS ==========
  const renderQuestionBody = (q: QuestionDraft, idx: number) => {
    if (q.type === 'choice') {
      return (
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <button
                onClick={() => updateQuestion(q.id, 'correct_answer', opt)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 bg-white",
                  q.correct_answer === opt ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                )}
              >
                {q.correct_answer === opt && <CheckCircle2 className="w-5 h-5" />}
              </button>
              <Input
                value={opt}
                onChange={e => updateOptionText(q.id, i, e.target.value)}
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
          <Button variant="ghost" size="sm" onClick={() => addOption(q.id)} className="text-indigo-600 font-bold ml-10">
            <Plus className="w-4 h-4 mr-1" /> Añadir opción
          </Button>
        </div>
      );
    }

    if (q.type === 'true_false') {
      return (
        <div className="flex gap-3">
          {['Verdadero', 'Falso'].map(val => (
            <button
              key={val}
              onClick={() => updateQuestion(q.id, 'correct_answer', val)}
              className={cn(
                "flex-1 py-4 rounded-xl border-2 font-bold bg-white",
                q.correct_answer === val ? "bg-emerald-100 border-emerald-500 text-emerald-700" : "border-slate-200"
              )}
            >
              {val}
            </button>
          ))}
        </div>
      );
    }

    if (q.type === 'fill_blank') {
      return (
        <div className="space-y-2">
          <label className="text-xs font-bold text-amber-700 uppercase">Respuesta Oculta:</label>
          <Input
            value={q.correct_answer}
            onChange={e => updateQuestion(q.id, 'correct_answer', e.target.value)}
            className="bg-white border-2 border-amber-200 text-amber-900 font-bold h-12"
            placeholder="Respuesta correcta"
          />
        </div>
      );
    }

    if (q.type === 'open') {
      return (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 italic">Respuesta Libre (Sin calificación automática)</p>
          <button
            onClick={() => updateQuestion(q.id, 'allow_audio', !q.allow_audio)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold border-2 flex gap-2 items-center",
              q.allow_audio ? "bg-indigo-100 border-indigo-500 text-indigo-700" : "bg-white border-slate-200"
            )}
          >
            <Mic className="w-4 h-4" />
            {q.allow_audio ? '🎤 Audio Activado' : 'Solo Texto'}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-white">
        
        {/* ========== HEADER ========== */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Save className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {initialData ? 'Editar Tarea' : 'Nueva Tarea'}
              </h2>
              <p className="text-indigo-100 text-sm">Construye tu actividad paso a paso</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* ✅ BOTÓN DE CONFIGURACIÓN DE API KEY */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center transition-all"
              title="Configurar API Key"
            >
              <Settings2 className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* ========== BODY (SCROLLABLE) ========== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* META INFO */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
              <label className="text-xs font-black text-slate-600 uppercase mb-2 block">Título</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-slate-50 border-2 border-slate-200 h-12 font-bold text-lg"
                placeholder="Ej: Verbos en Presente"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-600 uppercase mb-2 block">Descripción</label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="bg-slate-50 border-2 border-slate-200 h-20 resize-none"
                placeholder="Instrucciones claras para el alumno..."
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-black text-slate-600 uppercase mb-2 block">Intentos Máx.</label>
                <Input
                  type="number"
                  value={maxAttempts}
                  onChange={e => setMaxAttempts(Number(e.target.value))}
                  className="bg-slate-50 border-2 border-slate-200 h-10"
                  min={1}
                  max={10}
                />
              </div>
              <Button
                onClick={() => setShowAiModal(true)}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black px-6 rounded-xl h-10 mt-6 shadow-lg hover:shadow-xl transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generar con IA
              </Button>
            </div>
          </div>

          {/* PREGUNTAS */}
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-200 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <select
                      value={q.type}
                      onChange={e => updateQuestion(q.id, 'type', e.target.value as QuestionType)}
                      className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg font-bold text-sm"
                    >
                      <option value="choice">Opción Múltiple</option>
                      <option value="true_false">Verdadero/Falso</option>
                      <option value="fill_blank">Completar</option>
                      <option value="open">Abierta</option>
                    </select>
                  </div>
                  <button onClick={() => removeQuestion(q.id)} className="text-rose-400 hover:text-rose-600">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-600 uppercase mb-2 block">Pregunta</label>
                  <Textarea
                    value={q.question_text}
                    onChange={e => updateQuestion(q.id, 'question_text', e.target.value)}
                    className="bg-slate-50 border-2 border-slate-200 h-16 resize-none"
                    placeholder="Escribe tu pregunta aquí..."
                  />
                </div>

                {renderQuestionBody(q, idx)}

                <div>
                  <label className="text-xs font-black text-slate-600 uppercase mb-2 block">Explicación</label>
                  <Textarea
                    value={q.explanation}
                    onChange={e => updateQuestion(q.id, 'explanation', e.target.value)}
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
        </div>

        {/* ========== FOOTER ========== */}
        <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex gap-4 items-center">
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 flex-1">
            <span className="text-xs font-black text-slate-400 uppercase ml-2 hidden md:block">Asignar:</span>
            <div className="relative flex-1">
              <select
                value={assignType}
                onChange={e => setAssignType(e.target.value as any)}
                className="h-10 pl-3 pr-8 bg-white border rounded-lg font-bold text-sm w-full"
              >
                <option value="class">Toda la Clase</option>
                <option value="level">Por Nivel</option>
                {initialStudentId && <option value="individual">Individual</option>}
              </select>
            </div>
            {assignType === 'level' && (
              <div className="relative w-24">
                <select
                  value={selectedLevel}
                  onChange={e => setSelectedLevel(e.target.value)}
                  className="h-10 pl-3 bg-indigo-50 border-indigo-200 text-indigo-700 rounded-lg font-bold text-sm w-full"
                >
                  <option>A1</option>
                  <option>A2</option>
                  <option>B1</option>
                  <option>B2</option>
                  <option>C1</option>
                </select>
              </div>
            )}
          </div>
          <Button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 rounded-xl h-12 text-lg shadow-lg"
          >
            {initialData ? 'ACTUALIZAR' : 'GUARDAR'}
          </Button>
        </div>

        {/* ========== MODAL IA ========== */}
        <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
          <DialogContent className="w-[90%] max-w-lg rounded-2xl p-6 border-4 border-orange-200">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-orange-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Generador Groq AI
              </DialogTitle>
              <DialogDescription>
                Describe el tema y deja que la IA cree las preguntas por ti.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Ej: Verbos irregulares en pasado, Vocabulario de la familia, etc."
              className="h-24 text-lg bg-orange-50 border-orange-200 rounded-xl mb-4"
            />
            <div className="flex gap-4 mb-4">
              <div className="space-y-1 flex-1">
                <label className="text-[10px] font-black text-orange-800 uppercase">
                  Cantidad: {aiNumQuestions}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={aiNumQuestions}
                  onChange={e => setAiNumQuestions(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div className="space-y-1 w-24">
                <label className="text-[10px] font-black text-orange-800 uppercase">Nivel</label>
                <select
                  value={aiLevel}
                  onChange={e => setAiLevel(e.target.value)}
                  className="w-full h-8 bg-white border border-orange-200 rounded font-bold text-xs"
                >
                  <option>A1</option>
                  <option>A2</option>
                  <option>B1</option>
                  <option>B2</option>
                  <option>C1</option>
                </select>
              </div>
              <div className="space-y-1 w-24">
                <label className="text-[10px] font-black text-orange-800 uppercase">Dificultad</label>
                <select
                  value={aiDifficulty}
                  onChange={e => setAiDifficulty(e.target.value)}
                  className="w-full h-8 bg-white border border-orange-200 rounded font-bold text-xs"
                >
                  <option>Básico</option>
                  <option>Medio</option>
                  <option>Reto</option>
                </select>
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
        <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
          <DialogContent className="w-[90%] max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-black">
                <KeyRound className="w-6 h-6 text-indigo-600" />
                Configurar Groq API
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 mt-2">
                Pega tu clave de API de Groq aquí. Se guardará de forma segura en tu navegador.
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
                onChange={e => setApiKey(e.target.value)}
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
