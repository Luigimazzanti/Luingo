import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { X, Save, Plus, Trash2, CheckCircle2, AlignLeft, Mic, User, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

// TIPOS
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
  onSaveTask: (taskData: any) => void;
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
  // ESTADOS GENERALES
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<'homework' | 'quiz' | 'project'>(initialData?.category || 'homework');
  const [assignType, setAssignType] = useState<'individual' | 'level' | 'class'>(
    initialData?.content_data?.assignment_scope?.type || (initialStudentId ? 'individual' : 'class')
  );
  const [selectedLevel, setSelectedLevel] = useState(
    initialData?.content_data?.assignment_scope?.targetId || 'A1'
  );
  const [maxAttempts, setMaxAttempts] = useState(initialData?.content_data?.max_attempts || 3);
  
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialData?.content_data?.questions || [{
      id: Date.now(),
      type: 'choice',
      question_text: '',
      options: ['', ''],
      correct_answer: '',
      explanation: '',
      allow_audio: false
    }]
  );

  // ESTADOS DE IA
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [aiLevel, setAiLevel] = useState('A1');
  const [aiDifficulty, setAiDifficulty] = useState('Básico');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (autoOpenAI && !initialData) setShowAiModal(true);
  }, [autoOpenAI, initialData]);

  // --- HANDLERS CRUD PREGUNTAS ---
  const addQuestion = () => setQuestions([...questions, {
    id: Date.now(),
    type: 'choice',
    question_text: '',
    options: ['', ''],
    correct_answer: '',
    explanation: '',
    allow_audio: false
  }]);

  const removeQuestion = (id: number) => questions.length > 1 && setQuestions(questions.filter(q => q.id !== id));

  const updateQuestion = (id: number, field: keyof QuestionDraft, value: any) => 
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));

  const addOption = (qId: number) => {
    const q = questions.find(x => x.id === qId);
    if (q) updateQuestion(qId, 'options', [...q.options, '']);
  };

  const removeOption = (qId: number, idx: number) => {
    const q = questions.find(x => x.id === qId);
    if (q && q.options.length > 2) updateQuestion(qId, 'options', q.options.filter((_, i) => i !== idx));
  };

  const updateOptionText = (qId: number, idx: number, text: string) => {
    const q = questions.find(x => x.id === qId);
    if (!q) return;
    const newOptions = [...q.options];
    newOptions[idx] = text;
    updateQuestion(qId, 'options', newOptions);
    if (q.correct_answer === q.options[idx]) updateQuestion(qId, 'correct_answer', text);
  };

  // --- GUARDADO ---
  const handleSave = () => {
    if (!title.trim()) {
      alert("Falta título");
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

  // --- GENERACIÓN IA (MEJORADA) ---
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);

    const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    
    // FALLBACK: Si no hay API Key configurada, usar el simulador inteligente
    if (!OPENAI_KEY || OPENAI_KEY.includes('TU_CLAVE')) {
      console.warn("⚠️ Usando IA Simulada (Falta API Key)");
      setTimeout(() => {
        const topic = aiPrompt.toLowerCase();
        let newQuestions: QuestionDraft[] = [];
        // Lógica simulada mejorada
        for (let i = 0; i < aiNumQuestions; i++) {
          newQuestions.push({
            id: Date.now() + i,
            type: i % 2 === 0 ? 'choice' : 'true_false',
            question_text: `Pregunta simulada ${i + 1} sobre ${aiPrompt} (${aiLevel})`,
            options: i % 2 === 0 ? ['Opción A', 'Opción B', 'Opción C'] : [],
            correct_answer: i % 2 === 0 ? 'Opción A' : 'Verdadero',
            explanation: `Explicación pedagógica para nivel ${aiLevel} sobre el tema.`,
            allow_audio: false
          });
        }
        setTitle(`Lección: ${aiPrompt} (${aiLevel})`);
        setDescription(`Ejercicios de dificultad ${aiDifficulty} sobre ${aiPrompt}.`);
        setQuestions(newQuestions);
        setIsGenerating(false);
        setShowAiModal(false);
      }, 2000);
      return;
    }

    // LLAMADA REAL A OPENAI (GPT-3.5 Turbo)
    try {
      const systemPrompt = `
Actúa como un experto profesor de Español como Lengua Extranjera (ELE). 
Crea una actividad educativa JSON estricta.

CONFIGURACIÓN:
- Tema: ${aiPrompt}
- Nivel MCER: ${aiLevel}
- Dificultad: ${aiDifficulty}
- Cantidad de preguntas: ${aiNumQuestions}

REQUISITOS:
- Las preguntas deben ser variadas (choice, true_false, fill_blank, open).
- El campo "explanation" debe dar un feedback gramatical útil para un estudiante de nivel ${aiLevel}.
- Adapta el vocabulario y la gramática al nivel solicitado.
- Para preguntas de tipo "choice", incluye 3-4 opciones plausibles.
- Para "fill_blank", usa ___ para marcar el hueco en question_text.

FORMATO JSON ESPERADO:
{
  "title": "Título creativo en español",
  "description": "Instrucciones para el alumno",
  "questions": [
    {
      "type": "choice" | "true_false" | "fill_blank" | "open",
      "question_text": "Texto de la pregunta",
      "options": ["A", "B", "C"] (solo para choice),
      "correct_answer": "Respuesta exacta",
      "explanation": "Por qué es correcta (feedback pedagógico)"
    }
  ]
}
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generar ahora" }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const content = data.choices[0].message.content;
      const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
      const result = JSON.parse(jsonStr);

      setTitle(result.title);
      setDescription(result.description);
      setQuestions(result.questions.map((q: any, i: number) => ({
        ...q,
        id: Date.now() + i,
        options: q.options || [],
        allow_audio: q.type === 'open'
      })));
      
      setShowAiModal(false);
      setAiPrompt('');
    } catch (error) {
      console.error("AI Error:", error);
      alert("Error al generar con IA. Verifica tu API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  // RENDERERS VISUALES (Estables y Bonitos)
  const renderQuestionBody = (q: QuestionDraft, idx: number) => {
    if (q.type === 'choice') return (
      <div className="mt-4 space-y-2 pl-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase">Opciones</label>
        {q.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => updateQuestion(q.id, 'correct_answer', opt)}
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0",
                q.correct_answer === opt && opt !== '' ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300"
              )}
            >
              {q.correct_answer === opt && opt !== '' && <CheckCircle2 className="w-4 h-4" />}
            </button>
            <Input
              value={opt}
              onChange={(e) => updateOptionText(q.id, i, e.target.value)}
              className="flex-1 bg-white h-10 text-sm"
              placeholder={`Opción ${i + 1}`}
            />
            {q.options.length > 2 && (
              <button onClick={() => removeOption(q.id, i)}>
                <Trash2 className="w-4 h-4 text-slate-300" />
              </button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => addOption(q.id)} className="text-indigo-600 text-xs font-bold">
          + Añadir Opción
        </Button>
      </div>
    );

    if (q.type === 'true_false') return (
      <div className="mt-4 space-y-2 pl-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase">Respuesta Correcta</label>
        <div className="flex gap-3">
          {['Verdadero', 'Falso'].map((option) => (
            <button
              key={option}
              onClick={() => updateQuestion(q.id, 'correct_answer', option)}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                q.correct_answer === option
                  ? "bg-emerald-500 text-white"
                  : "bg-white border-2 border-slate-200 text-slate-600"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );

    if (q.type === 'fill_blank') return (
      <div className="mt-4 space-y-2 pl-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase">Respuesta Correcta</label>
        <Input
          value={q.correct_answer}
          onChange={(e) => updateQuestion(q.id, 'correct_answer', e.target.value)}
          className="bg-white h-10 text-sm"
          placeholder="Escribe la respuesta correcta..."
        />
        <p className="text-xs text-slate-400">💡 Usa ___ en la pregunta para marcar el hueco</p>
      </div>
    );

    if (q.type === 'open') return (
      <div className="mt-4 space-y-2 pl-1 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
        <div className="flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-amber-600" />
          <label className="text-[10px] font-black text-amber-600 uppercase">Respuesta Abierta</label>
        </div>
        <p className="text-xs text-slate-500">El alumno podrá escribir o grabar audio. Requiere corrección manual.</p>
        <div className="flex items-center gap-2 mt-3">
          <input
            type="checkbox"
            checked={q.allow_audio || false}
            onChange={(e) => updateQuestion(q.id, 'allow_audio', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
            <Mic className="w-3 h-3" /> Permitir respuesta por voz
          </label>
        </div>
      </div>
    );

    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-[#F8FAFC] w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-white overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-20">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {initialData ? '✏️ Editar Tarea' : '🎨 Diseñador'}
            </h2>
            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => setShowAiModal(true)} 
                className="bg-amber-400 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-md hover:bg-amber-500 transition-all"
              >
                <Sparkles className="w-3 h-3"/> ASISTENTE IA
              </button>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-6 sm:w-8 h-6 sm:h-8 text-slate-400" />
          </Button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 scroll-smooth bg-slate-50/50">
          {/* CONFIGURACIÓN */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm mb-6 sm:mb-10">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Configuración</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">Título</label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Ej: Verbos en presente" 
                  className="font-bold text-lg sm:text-xl h-12 sm:h-14 border-2 border-slate-200 rounded-xl" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">Intentos Permitidos</label>
                <div className="relative">
                  <select 
                    value={maxAttempts} 
                    onChange={(e) => setMaxAttempts(Number(e.target.value))} 
                    className="w-full h-12 sm:h-14 pl-5 pr-12 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-base sm:text-lg appearance-none cursor-pointer"
                  >
                    <option value={1}>1 Intento</option>
                    <option value={2}>2 Intentos</option>
                    <option value={3}>3 Intentos</option>
                    <option value={5}>5 Intentos</option>
                    <option value={99}>Ilimitados</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-3">
                <label className="text-sm font-bold text-slate-700">Instrucciones</label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Describe qué deben hacer los estudiantes..." 
                  className="bg-slate-50 border-2 border-slate-200 resize-none h-20 sm:h-24 rounded-xl p-4" 
                />
              </div>
            </div>
          </div>

          {/* PREGUNTAS */}
          <div className="space-y-6 sm:space-y-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Preguntas</h3>
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white p-6 sm:p-8 rounded-[2rem] border-2 border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute -left-4 top-0 bottom-0 w-12 sm:w-16 bg-indigo-500 flex items-start justify-center pt-6 sm:pt-8 font-black text-white text-xl sm:text-2xl">
                  {idx+1}
                </div>
                <div className="pl-8 sm:pl-12">
                  <div className="flex flex-col md:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div className="relative min-w-[180px]">
                      <select 
                        value={q.type} 
                        onChange={(e) => updateQuestion(q.id, 'type', e.target.value)} 
                        className="w-full h-12 sm:h-14 pl-4 pr-8 bg-indigo-50 border-2 border-indigo-100 rounded-xl font-bold text-indigo-900 appearance-none cursor-pointer text-sm sm:text-base"
                      >
                        <option value="choice">📝 Test</option>
                        <option value="true_false">✓/✗ V/F</option>
                        <option value="fill_blank">📝 Huecos</option>
                        <option value="open">💬 Abierta</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">▼</div>
                    </div>
                    <Input 
                      value={q.question_text} 
                      onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)} 
                      placeholder="Escribe la pregunta..." 
                      className="flex-1 font-bold text-base sm:text-xl h-12 sm:h-14 border-0 border-b-4 border-slate-100 rounded-none px-0 focus:ring-0" 
                    />
                    <button 
                      onClick={() => removeQuestion(q.id)} 
                      className="p-3 sm:p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all shrink-0"
                    >
                      <Trash2 className="w-5 sm:w-6 h-5 sm:h-6" />
                    </button>
                  </div>
                  {renderQuestionBody(q, idx)}
                  
                  {/* Campo de Explicación */}
                  <div className="mt-4 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Explicación (Feedback)</label>
                    <Input
                      value={q.explanation}
                      onChange={(e) => updateQuestion(q.id, 'explanation', e.target.value)}
                      placeholder="Feedback pedagógico para el alumno..."
                      className="bg-slate-50 border border-slate-200 h-10 text-sm italic"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button 
              onClick={addQuestion} 
              className="w-full py-6 sm:py-8 border-4 border-dashed border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-400 font-black text-lg sm:text-xl h-auto gap-3 rounded-[2rem]"
            >
              <Plus className="w-6 sm:w-8 h-6 sm:h-8"/> Nueva Pregunta
            </Button>
          </div>
        </div>

        {/* FOOTER (LÓGICA DE ASIGNACIÓN) */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-white flex flex-col md:flex-row justify-between items-center z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] gap-4">
          
          {/* ZONA DE ASIGNACIÓN */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 w-full md:w-auto">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 hidden lg:block">Asignar a:</span>
            
            {/* SELECTOR 1: TIPO DE ASIGNACIÓN */}
            <div className="relative min-w-[140px] flex-1 sm:flex-none">
              <select 
                value={assignType} 
                onChange={(e) => setAssignType(e.target.value as any)} 
                className="h-12 pl-4 pr-8 w-full bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none cursor-pointer hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              >
                <option value="class">🏫 Toda la Clase</option>
                <option value="level">📊 Por Nivel</option>
                {initialStudentId && <option value="individual">👤 Individual</option>}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

            {/* SELECTOR 2: NIVEL (SOLO SI ES 'LEVEL') */}
            {assignType === 'level' && (
              <div className="relative min-w-[100px] animate-in slide-in-from-left-2 flex-1 sm:flex-none">
                <select 
                  value={selectedLevel} 
                  onChange={(e) => setSelectedLevel(e.target.value)} 
                  className="h-12 pl-4 pr-8 w-full bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-700 appearance-none cursor-pointer hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                >
                  <option value="A1">A1 - Principiante</option>
                  <option value="A2">A2 - Elemental</option>
                  <option value="B1">B1 - Intermedio</option>
                  <option value="B2">B2 - Intermedio Alto</option>
                  <option value="C1">C1 - Avanzado</option>
                  <option value="C2">C2 - Maestría</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 text-xs">▼</div>
              </div>
            )}

            {/* BADGE: INDIVIDUAL (SOLO SI ES 'INDIVIDUAL') */}
            {assignType === 'individual' && studentName && (
              <div className="bg-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200 animate-in slide-in-from-left-2 shadow-sm whitespace-nowrap">
                <User className="w-4 h-4" /> {studentName}
              </div>
            )}
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-3 sm:gap-4 w-full md:w-auto">
            <Button 
              variant="ghost" 
              onClick={onCancel} 
              className="text-slate-500 font-bold hover:bg-slate-100 rounded-xl h-12 sm:h-14 px-4 sm:px-6 flex-1 md:flex-none"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 sm:px-10 rounded-xl shadow-xl shadow-indigo-200 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 h-12 sm:h-14 text-base sm:text-lg transition-all flex items-center gap-2 flex-1 md:flex-none justify-center"
            >
              <Save className="w-5 sm:w-6 h-5 sm:h-6" /> 
              {initialData ? 'ACTUALIZAR' : 'GUARDAR'}
            </Button>
          </div>
        </div>

        {/* MODAL IA FLOTANTE CON CONTROLES */}
        <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
          <DialogContent className="w-[90%] max-w-lg rounded-3xl p-6 border-4 border-amber-200 bg-[#FFFBF0]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-amber-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 fill-amber-500 text-amber-600" /> Asistente Creativo
              </DialogTitle>
              <DialogDescription className="text-amber-800/60">
                Genera ejercicios personalizados en segundos.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-5 mt-2">
              <div className="space-y-2">
                <label className="text-xs font-black text-amber-800 uppercase tracking-wider">Tema</label>
                <Textarea 
                  value={aiPrompt} 
                  onChange={e => setAiPrompt(e.target.value)} 
                  placeholder="Ej: Vocabulario de Navidad, Verbos en Futuro..." 
                  className="h-20 text-lg bg-white border-amber-200 rounded-xl focus:border-amber-400" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-800 uppercase">Nivel</label>
                  <select 
                    value={aiLevel} 
                    onChange={e => setAiLevel(e.target.value)} 
                    className="w-full h-10 bg-white border-2 border-amber-200 rounded-lg font-bold text-amber-900 px-2"
                  >
                    <option>A1</option>
                    <option>A2</option>
                    <option>B1</option>
                    <option>B2</option>
                    <option>C1</option>
                    <option>C2</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-800 uppercase">Dificultad</label>
                  <select 
                    value={aiDifficulty} 
                    onChange={e => setAiDifficulty(e.target.value)} 
                    className="w-full h-10 bg-white border-2 border-amber-200 rounded-lg font-bold text-amber-900 px-2"
                  >
                    <option>Básico</option>
                    <option>Medio</option>
                    <option>Reto</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-[10px] font-black text-amber-800 uppercase">Cantidad de Preguntas</label>
                  <span className="text-xs font-black text-amber-600">{aiNumQuestions}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={aiNumQuestions} 
                  onChange={e => setAiNumQuestions(Number(e.target.value))} 
                  className="w-full accent-amber-500" 
                />
              </div>

              <Button 
                onClick={handleAiGenerate} 
                disabled={isGenerating || !aiPrompt.trim()} 
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black h-12 rounded-xl shadow-lg border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <Loader2 className="animate-spin"/> : '✨ GENERAR ACTIVIDAD'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
