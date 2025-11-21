import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { X, Save, Plus, Trash2, CheckCircle2, List, Type, AlignLeft, CheckSquare, Mic, User } from 'lucide-react';
import { cn } from '../lib/utils';
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
  onCancel: () => void;
  initialStudentId?: string;
  studentName?: string;
}

export const TaskBuilder: React.FC<TaskBuilderProps> = ({ 
  mode = 'create',
  initialData,
  onSaveTask, 
  onCancel, 
  initialStudentId, 
  studentName 
}) => {
  // ESTADOS
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'homework' | 'quiz' | 'project'>('homework');
  const [assignType, setAssignType] = useState<'individual' | 'level' | 'class'>(initialStudentId ? 'individual' : 'class');
  const [selectedLevel, setSelectedLevel] = useState('A1');
  const [maxAttempts, setMaxAttempts] = useState<number | 'unlimited'>(3);

  // PREGUNTAS (Array real)
  const [questions, setQuestions] = useState<QuestionDraft[]>([
      { id: Date.now(), type: 'choice', question_text: '', options: ['', ''], correct_answer: '', explanation: '', allow_audio: false }
  ]);

  // Inicializar con datos si estamos en modo edición
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'homework');
      setMaxAttempts(initialData.max_attempts || 'unlimited');
      
      if (initialData.content_data && initialData.content_data.questions) {
        setQuestions(initialData.content_data.questions.map((q: any, idx: number) => ({
          id: Date.now() + idx,
          type: q.type || 'choice',
          question_text: q.question_text || '',
          options: q.options || ['', ''],
          correct_answer: q.correct_answer || '',
          explanation: q.explanation || '',
          allow_audio: q.allow_audio || false
        })));
      }
    }
  }, [mode, initialData]);

  // --- HANDLERS ---
  const addQuestion = () => setQuestions([...questions, { id: Date.now(), type: 'choice', question_text: '', options: ['', ''], correct_answer: '', explanation: '', allow_audio: false }]);
  const removeQuestion = (id: number) => questions.length > 1 && setQuestions(questions.filter(q => q.id !== id));
  const updateQuestion = (id: number, field: keyof QuestionDraft, value: any) => setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  
  const addOption = (qId: number) => { const q = questions.find(x => x.id === qId); if (q) updateQuestion(qId, 'options', [...q.options, '']); };
  const removeOption = (qId: number, idx: number) => { const q = questions.find(x => x.id === qId); if (q && q.options.length > 2) updateQuestion(qId, 'options', q.options.filter((_, i) => i !== idx)); };
  const updateOptionText = (qId: number, idx: number, text: string) => { 
      const q = questions.find(x => x.id === qId); if (!q) return;
      const newOptions = [...q.options]; newOptions[idx] = text; 
      updateQuestion(qId, 'options', newOptions);
      if (q.correct_answer === q.options[idx]) updateQuestion(qId, 'correct_answer', text);
  };

  const handleSave = () => {
    if (!title.trim()) { alert("Falta el título"); return; }
    const taskData = { title, description, category, content_data: { type: 'form', questions }, ai_generated: false, color_tag: '#A8D8FF', max_attempts: maxAttempts };
    const scope = { type: assignType, targetId: assignType === 'individual' ? initialStudentId : assignType === 'level' ? selectedLevel : undefined };
    onSaveTask(taskData, scope as any);
  };

  // --- RENDER BODY ---
  const renderQuestionBody = (q: QuestionDraft, idx: number) => {
      switch (q.type) {
          case 'choice': return (
              <div className="mt-4 space-y-3 pl-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Opciones</label>
                  {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                          <button onClick={() => updateQuestion(q.id, 'correct_answer', opt)} className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0", q.correct_answer === opt && opt !== '' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white hover:border-indigo-300")}>
                              {q.correct_answer === opt && opt !== '' && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <Input value={opt} onChange={(e) => updateOptionText(q.id, i, e.target.value)} placeholder={`Opción ${i + 1}`} className={cn("flex-1 bg-white h-10", q.correct_answer === opt && opt !== '' && "border-emerald-500 ring-1 ring-emerald-500 font-bold text-emerald-900")} />
                          {q.options.length > 2 && <button onClick={() => removeOption(q.id, i)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => addOption(q.id)} className="text-indigo-600 text-xs font-bold hover:bg-indigo-50 ml-9">+ Opción</Button>
              </div>
          );
          case 'true_false': return (
              <div className="mt-4 flex gap-4">
                  {['Verdadero', 'Falso'].map((val) => (
                      <button key={val} onClick={() => updateQuestion(q.id, 'correct_answer', val)} className={cn("flex-1 py-4 rounded-xl border-2 font-bold text-center transition-all", q.correct_answer === val ? (val === 'Verdadero' ? "bg-emerald-100 border-emerald-500 text-emerald-700" : "bg-rose-100 border-rose-500 text-rose-700") : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200")}>{val}</button>
                  ))}
              </div>
          );
          case 'fill_blank': return (
              <div className="mt-4 bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-800 font-bold mb-2">Respuesta Oculta:</p>
                  <Input value={q.correct_answer} onChange={(e) => updateQuestion(q.id, 'correct_answer', e.target.value)} placeholder="Ej: comido" className="bg-white border-amber-300 text-amber-900 font-bold" />
              </div>
          );
          case 'open': return (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3 text-slate-600"><AlignLeft className="w-5 h-5" /><span className="font-bold text-sm">Respuesta Libre</span></div>
                  <button onClick={() => updateQuestion(q.id, 'allow_audio', !q.allow_audio)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border-2 flex gap-2", q.allow_audio ? "bg-indigo-100 border-indigo-500 text-indigo-700" : "bg-white border-slate-200 text-slate-400")}><Mic className="w-3 h-3" /> {q.allow_audio ? 'Audio Permitido' : 'Solo Texto'}</button>
              </div>
          );
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#F8FAFC] w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-4 border-white ring-1 ring-slate-900/10">
        {/* HEADER */}
        <div className="px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-20">
          <div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">Diseñador de Tareas</h2>
             <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-500 font-medium">Modo Editor</p>
                {assignType === 'individual' && studentName && (
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 border border-emerald-200"><User className="w-3 h-3" /> Para: {studentName}</span>
                )}
             </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-slate-100 text-slate-400"><X className="w-6 h-6" /></Button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth bg-slate-50/50">
            {/* Configuración */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Título</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Los Verbos" className="font-bold text-lg h-12 border-slate-200" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Tipo</label>
                        <div className="relative">
                            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full h-12 pl-4 pr-10 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 appearance-none cursor-pointer outline-none focus:border-indigo-500">
                                <option value="homework">Tarea</option>
                                <option value="quiz">Examen</option>
                                <option value="project">Proyecto</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Intentos Permitidos</label>
                        <div className="relative">
                            <select value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value))} className="w-full h-12 pl-4 pr-10 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 appearance-none cursor-pointer outline-none focus:border-indigo-500">
                                <option value="1">1 intento</option>
                                <option value="2">2 intentos</option>
                                <option value="3">3 intentos</option>
                                <option value="4">4 intentos</option>
                                <option value="5">5 intentos</option>
                                <option value="unlimited">Ilimitados</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instrucciones..." className="bg-slate-50 border-slate-200 resize-none h-20" />
                    </div>
                </div>
            </div>

            {/* Preguntas */}
            <div className="space-y-6">
                {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm group hover:border-indigo-300 transition-all relative">
                        <div className="absolute -left-3 top-6 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-sm shadow-lg border-2 border-white">{idx + 1}</div>
                        <div className="pl-4">
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <div className="relative min-w-[180px]">
                                    <select value={q.type} onChange={(e) => updateQuestion(q.id, 'type', e.target.value)} className="w-full h-11 pl-9 pr-8 bg-indigo-50 border-2 border-indigo-100 rounded-xl text-sm font-bold text-indigo-800 appearance-none cursor-pointer outline-none hover:border-indigo-300">
                                        <option value="choice">Test A/B/C</option>
                                        <option value="true_false">Verdadero/Falso</option>
                                        <option value="fill_blank">Rellenar Hueco</option>
                                        <option value="open">Respuesta Abierta</option>
                                    </select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                                        {q.type === 'choice' && <List className="w-4 h-4" />}
                                        {q.type === 'true_false' && <CheckSquare className="w-4 h-4" />}
                                        {q.type === 'fill_blank' && <Type className="w-4 h-4" />}
                                        {q.type === 'open' && <AlignLeft className="w-4 h-4" />}
                                    </div>
                                </div>
                                <Input value={q.question_text} onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)} placeholder="Pregunta..." className="flex-1 font-bold text-lg border-0 border-b-2 border-slate-100 rounded-none px-0 focus:ring-0 focus:border-indigo-500 bg-transparent" />
                                <button onClick={() => removeQuestion(q.id)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-5 h-5" /></button>
                            </div>
                            {renderQuestionBody(q, idx)}
                            <div className="mt-4 pt-4 border-t border-slate-50">
                                <Input value={q.explanation} onChange={(e) => updateQuestion(q.id, 'explanation', e.target.value)} placeholder="Feedback opcional..." className="text-sm text-slate-500 italic border-transparent bg-transparent placeholder:text-slate-300 focus:bg-slate-50" />
                            </div>
                        </div>
                    </div>
                ))}
                <Button onClick={addQuestion} className="w-full py-6 border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 text-slate-400 rounded-2xl font-bold text-lg h-auto gap-2"><Plus className="w-6 h-6" /> Añadir Pregunta</Button>
            </div>
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center z-20">
            <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Asignar a:</span>
                <div className="relative">
                    <select value={assignType} onChange={(e) => setAssignType(e.target.value as any)} className="h-10 pl-3 pr-8 bg-slate-100 rounded-lg text-sm font-bold text-slate-700 appearance-none cursor-pointer hover:bg-slate-200 outline-none">
                        <option value="class">Toda la Clase</option>
                        <option value="level">Por Nivel ({selectedLevel})</option>
                        {initialStudentId && <option value="individual">{studentName ? `Solo a ${studentName.split(' ')[0]}` : 'Individual'}</option>}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                </div>
            </div>
            <div className="flex gap-3">
                <Button variant="ghost" onClick={onCancel} className="text-slate-500 font-bold">Cancelar</Button>
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 rounded-xl shadow-lg border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 h-12"><Save className="w-4 h-4 mr-2" /> GUARDAR</Button>
            </div>
        </div>
      </div>
    </div>
  );
};