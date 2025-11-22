import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { X, Save, Plus, Trash2, CheckCircle2, List, Type, AlignLeft, CheckSquare, Mic, User, GripVertical, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Task } from '../types';

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
  mode?: 'create' | 'edit';
  initialData?: Task;
  onSaveTask: (taskData: any, assignmentScope: { type: 'individual' | 'level' | 'class', targetId?: string }) => void;
  onUpdateTask?: (taskData: any, assignmentScope: { type: 'individual' | 'level' | 'class', targetId?: string }) => void;
  onCancel: () => void;
  initialStudentId?: string;
  studentName?: string;
  taskToEdit?: Task | null;
}

export const TaskBuilder: React.FC<TaskBuilderProps> = ({ 
  mode = 'create',
  initialData,
  onSaveTask, 
  onUpdateTask,
  onCancel, 
  initialStudentId, 
  studentName,
  taskToEdit
}) => {
  // Estados principales
  const [title, setTitle] = useState(taskToEdit?.title || initialData?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || initialData?.description || '');
  const [category, setCategory] = useState<'homework' | 'quiz' | 'project'>(
    (taskToEdit?.category as 'homework' | 'quiz' | 'project') || 
    (initialData?.category as 'homework' | 'quiz' | 'project') || 
    'homework'
  );
  const [assignType, setAssignType] = useState<'individual' | 'level' | 'class'>(
    initialStudentId ? 'individual' : 'class'
  );
  const [selectedLevel, setSelectedLevel] = useState('A1');
  const [maxAttempts, setMaxAttempts] = useState<number>(
    taskToEdit?.content_data?.max_attempts || 
    initialData?.content_data?.max_attempts || 
    1
  );
  
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    taskToEdit?.content_data?.questions?.map((q: any, i: number) => ({
      id: Date.now() + i,
      type: q.type,
      question_text: q.question_text,
      options: q.options || ['', ''],
      correct_answer: q.correct_answer || '',
      explanation: q.explanation || '',
      allow_audio: q.allow_audio || false
    })) || 
    initialData?.content_data?.questions?.map((q: any, i: number) => ({
      id: Date.now() + i,
      type: q.type,
      question_text: q.question_text,
      options: q.options || ['', ''],
      correct_answer: q.correct_answer || '',
      explanation: q.explanation || '',
      allow_audio: q.allow_audio || false
    })) || 
    [{ 
      id: Date.now(), 
      type: 'choice', 
      question_text: '', 
      options: ['', ''], 
      correct_answer: '', 
      explanation: '', 
      allow_audio: false 
    }]
  );
  
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // HANDLERS
  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now(), 
      type: 'choice', 
      question_text: '', 
      options: ['', ''], 
      correct_answer: '', 
      explanation: '', 
      allow_audio: false 
    }]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: number, field: keyof QuestionDraft, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const addOption = (qId: number) => {
    const q = questions.find(x => x.id === qId);
    if (q) updateQuestion(qId, 'options', [...q.options, '']);
  };

  const removeOption = (qId: number, idx: number) => {
    const q = questions.find(x => x.id === qId);
    if (q && q.options.length > 2) {
      updateQuestion(qId, 'options', q.options.filter((_, i) => i !== idx));
    }
  };

  const updateOptionText = (qId: number, idx: number, text: string) => {
    const q = questions.find(x => x.id === qId);
    if (!q) return;
    const newOptions = [...q.options];
    newOptions[idx] = text;
    updateQuestion(qId, 'options', newOptions);
    if (q.correct_answer === q.options[idx]) {
      updateQuestion(qId, 'correct_answer', text);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Por favor añade un título a la tarea");
      return;
    }

    const taskData = {
      title,
      description,
      category,
      content_data: {
        type: 'form',
        questions,
        max_attempts: maxAttempts
      },
      max_attempts: maxAttempts,
      ai_generated: false,
      color_tag: '#A8D8FF'
    };

    const scope = {
      type: assignType,
      targetId: assignType === 'individual' ? initialStudentId : assignType === 'level' ? selectedLevel : undefined
    };

    if (mode === 'edit' && onUpdateTask) {
      onUpdateTask(taskData, scope);
    } else {
      onSaveTask(taskData, scope);
    }
  };

  // IA GENERATOR (Simplificado para demo)
  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setTitle(`Actividad: ${aiPrompt}`);
      setDescription(`Ejercicios sobre ${aiPrompt}`);
      setQuestions([{
        id: Date.now(),
        type: 'choice',
        question_text: `Pregunta sobre ${aiPrompt}`,
        options: ['Opción A', 'Opción B'],
        correct_answer: 'Opción A',
        explanation: '',
        allow_audio: false
      }]);
      setIsGenerating(false);
      setShowAiModal(false);
      setAiPrompt('');
    }, 1500);
  };

  // RENDER BODY (Responsive)
  const renderQuestionBody = (q: QuestionDraft, idx: number) => {
    if (q.type === 'choice') {
      return (
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
    }

    if (q.type === 'true_false') {
      return (
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
    }

    if (q.type === 'fill_blank') {
      return (
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
    }

    if (q.type === 'open') {
      return (
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
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-[#F8FAFC] w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-white overflow-hidden">
        
        {/* Header */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800">
              {mode === 'edit' ? '✏️ Editar Tarea' : '🎨 Diseñador de Tareas'}
            </h2>
            {initialStudentId && studentName && (
              <p className="text-xs text-slate-400 mt-0.5">Para: {studentName}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAiModal(true)}
              className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="w-3 h-3" /> IA
            </button>
            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full w-8 h-8 sm:w-10 sm:h-10">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Configuración básica */}
          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la Tarea"
              className="font-bold text-base sm:text-lg h-10 sm:h-12"
            />
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-10 sm:h-12 pl-3 sm:pl-4 pr-8 bg-slate-50 border-2 border-slate-200 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base appearance-none"
                >
                  <option value="homework">📝 Tarea</option>
                  <option value="quiz">📊 Examen</option>
                  <option value="project">🎯 Proyecto</option>
                </select>
              </div>
              
              <div className="relative">
                <select
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full h-10 sm:h-12 pl-3 sm:pl-4 pr-8 bg-slate-50 border-2 border-slate-200 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base appearance-none"
                >
                  <option value={1}>1 Intento</option>
                  <option value={2}>2 Intentos</option>
                  <option value={3}>3 Intentos</option>
                  <option value={5}>5 Intentos</option>
                  <option value={999}>Ilimitado</option>
                </select>
              </div>
            </div>

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instrucciones para los estudiantes..."
              className="h-16 sm:h-20 resize-none text-sm sm:text-base"
            />
          </div>

          {/* Preguntas */}
          <div className="space-y-3 sm:space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 relative shadow-sm">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold">
                      {idx + 1}
                    </span>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(q.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                  
                  <div className="relative">
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, 'type', e.target.value as QuestionType)}
                      className="w-full h-9 sm:h-10 pl-2 sm:pl-3 pr-8 bg-indigo-50 border border-indigo-100 rounded-lg text-xs sm:text-sm font-bold appearance-none"
                    >
                      <option value="choice">✓ Test (Opción Múltiple)</option>
                      <option value="true_false">⚖️ Verdadero/Falso</option>
                      <option value="fill_blank">📝 Rellenar Huecos</option>
                      <option value="open">💬 Respuesta Abierta</option>
                    </select>
                  </div>
                  
                  <Input
                    value={q.question_text}
                    onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)}
                    placeholder="Escribe la pregunta..."
                    className="font-bold border-0 border-b-2 border-slate-100 rounded-none px-0 text-sm sm:text-base"
                  />
                </div>
                
                {renderQuestionBody(q, idx)}
              </div>
            ))}
            
            <Button
              onClick={addQuestion}
              className="w-full py-3 sm:py-4 border-2 border-dashed border-slate-300 text-slate-400 font-bold bg-transparent hover:bg-slate-50 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 mr-2" /> Añadir Pregunta
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <select
              value={assignType}
              onChange={(e) => setAssignType(e.target.value as any)}
              className="w-full h-11 sm:h-12 pl-3 pr-8 bg-slate-100 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base appearance-none"
            >
              <option value="class">🏫 Toda la Clase</option>
              <option value="level">📊 Por Nivel</option>
              {initialStudentId && <option value="individual">👤 Individual</option>}
            </select>
          </div>
          
          <Button
            onClick={handleSave}
            className="flex-1 sm:flex-none sm:px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg sm:rounded-xl h-11 sm:h-12 text-sm sm:text-base shadow-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {mode === 'edit' ? 'ACTUALIZAR' : 'GUARDAR TAREA'}
          </Button>
        </div>

        {/* Modal IA anidado */}
        <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
          <DialogContent className="w-[90%] sm:w-full max-w-md rounded-2xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">✨ Generador con IA</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Describe el tema y la IA creará preguntas automáticamente
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Ej: Verbos irregulares en presente, números del 1 al 100..."
              className="h-20 sm:h-24 text-sm sm:text-base"
            />
            <Button
              onClick={handleAiGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 font-black h-11 sm:h-12 text-sm sm:text-base"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generar con IA
                </>
              )}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
