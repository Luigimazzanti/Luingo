import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Sparkles, X, Save, Plus, Trash2, CheckCircle2, List, Type, AlignLeft, CheckSquare, Mic, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Definición de Tipos
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
  onSaveTask: (taskData: any, assignmentScope: { type: 'individual' | 'level' | 'class', targetId?: string }) => void;
  onCancel: () => void;
  initialStudentId?: string;
  studentName?: string;
}

export const TaskBuilder: React.FC<TaskBuilderProps> = ({ onSaveTask, onCancel, initialStudentId, studentName }) => {
  // Estado General
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'homework' | 'quiz' | 'project'>('homework');
  const [assignType, setAssignType] = useState<'individual' | 'level' | 'class'>(initialStudentId ? 'individual' : 'class');
  const [selectedLevel, setSelectedLevel] = useState('A1');

  // Estado de Preguntas
  const [questions, setQuestions] = useState<QuestionDraft[]>([
      { id: Date.now(), type: 'choice', question_text: '', options: ['', ''], correct_answer: '', explanation: '', allow_audio: false }
  ]);

  // Estado IA
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  // --- ACCIONES MANUALES ---
  const addQuestion = () => {
      setQuestions([...questions, { id: Date.now(), type: 'choice', question_text: '', options: ['', ''], correct_answer: '', explanation: '', allow_audio: false }]);
  };

  const removeQuestion = (id: number) => {
      if (questions.length > 1) setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: number, field: keyof QuestionDraft, value: any) => {
      setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  // Gestión de Opciones (Choice)
  const updateOption = (qId: number, idx: number, text: string) => {
      const q = questions.find(x => x.id === qId);
      if (!q) return;
      const newOptions = [...q.options];
      newOptions[idx] = text;
      if (q.correct_answer === q.options[idx]) updateQuestion(qId, 'correct_answer', text);
      updateQuestion(qId, 'options', newOptions);
  };

  const addOption = (qId: number) => {
      const q = questions.find(x => x.id === qId);
      if (q) updateQuestion(qId, 'options', [...q.options, '']);
  };

  const removeOption = (qId: number, idx: number) => {
      const q = questions.find(x => x.id === qId);
      if (q && q.options.length > 2) {
          const newOptions = q.options.filter((_, i) => i !== idx);
          updateQuestion(qId, 'options', newOptions);
      }
  };

  // --- MAGIA IA ---
  const handleAiGenerate = () => {
      if (!aiTopic) return;
      setIsGenerating(true);
      
      // Simulación de respuesta inteligente
      setTimeout(() => {
          setTitle(`Lección sobre: ${aiTopic}`);
          setDescription(`Ejercicios prácticos generados automáticamente para aprender ${aiTopic}.`);
          setQuestions([
              { 
                  id: Date.now(), 
                  type: 'choice', 
                  question_text: `¿Cuál es la definición correcta de ${aiTopic}?`, 
                  options: ['Opción A (Correcta)', 'Opción B (Distractor)', 'Opción C'], 
                  correct_answer: 'Opción A (Correcta)', 
                  explanation: 'Esta es la definición más aceptada.',
                  allow_audio: false
              },
              { 
                  id: Date.now() + 1, 
                  type: 'fill_blank', 
                  question_text: `El concepto de [...] es fundamental aquí.`, 
                  options: [], 
                  correct_answer: aiTopic.split(' ')[0] || 'clave', 
                  explanation: 'Es la palabra base del tema.',
                  allow_audio: false
              }
          ]);
          setIsGenerating(false);
          setActiveTab('manual'); // Volver al editor para revisar
      }, 1500);
  };

  // --- GUARDAR ---
  const handleSave = () => {
    if (!title.trim()) { alert("Falta el título"); return; }
    const taskData = {
      title, description, category,
      content_data: { type: 'form', questions },
      ai_generated: false, color_tag: '#A8D8FF'
    };
    const scope = { type: assignType, targetId: assignType === 'individual' ? initialStudentId : assignType === 'level' ? selectedLevel : undefined };
    onSaveTask(taskData, scope as any);
  };

  // --- RENDERIZADO DEL CUERPO DE PREGUNTA ---
  const renderQuestionBody = (q: QuestionDraft) => {
      switch (q.type) {
          case 'choice': return (
              <div className="mt-4 space-y-3 pl-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Opciones (Marca la correcta)</label>
                  {q.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                          <button onClick={() => updateQuestion(q.id, 'correct_answer', opt)} className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0", q.correct_answer === opt && opt !== '' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white hover:border-indigo-300")}>
                              {q.correct_answer === opt && opt !== '' && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <Input value={opt} onChange={(e) => updateOption(q.id, idx, e.target.value)} placeholder={`Opción ${idx + 1}`} className={cn("flex-1 bg-white h-10", q.correct_answer === opt && opt !== '' && "border-emerald-500 ring-1 ring-emerald-500 font-bold text-emerald-900")} />
                          {q.options.length > 2 && <button onClick={() => removeOption(q.id, idx)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => addOption(q.id)} className="text-indigo-600 text-xs font-bold hover:bg-indigo-50 ml-9">+ Añadir opción</Button>
              </div>
          );
          case 'true_false': return (
              <div className="mt-4 flex gap-4">
                  {['Verdadero', 'Falso'].map((val) => (
                      <button key={val} onClick={() => updateQuestion(q.id, 'correct_answer', val)} className={cn("flex-1 py-4 rounded-xl border-2 font-bold text-center transition-all", q.correct_answer === val ? (val === 'Verdadero' ? "bg-emerald-100 border-emerald-500 text-emerald-700" : "bg-rose-100 border-rose-500 text-rose-700") : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200")}>
                          {val}
                      </button>
                  ))}
              </div>
          );
          case 'fill_blank': return (
              <div className="mt-4 bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-800 font-bold mb-2">Palabra Oculta:</p>
                  <Input value={q.correct_answer} onChange={(e) => updateQuestion(q.id, 'correct_answer', e.target.value)} placeholder="Ej: comido" className="bg-white border-amber-300 text-amber-900 font-bold" />
                  <p className="text-[10px] text-amber-600 mt-2">Tip: Usa <strong>[...]</strong> en el título donde va el hueco.</p>
              </div>
          );
          case 'open': return (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3 text-slate-600"><AlignLeft className="w-5 h-5" /><span className="font-bold text-sm">Respuesta Libre</span></div>
                  <button onClick={() => updateQuestion(q.id, 'allow_audio', !q.allow_audio)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border-2 flex gap-2", q.allow_audio ? "bg-indigo-100 border-indigo-500 text-indigo-700" : "bg-white border-slate-200 text-slate-400")}>
                      <Mic className="w-3 h-3" /> {q.allow_audio ? 'Audio Permitido' : 'Solo Texto'}
                  </button>
              </div>
          );
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#F8FAFC] w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-4 border-white ring-1 ring-slate-900/10">
        
        {/* HEADER */}
        <div className="px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-20">
          <div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">Diseñador de Tareas</h2>
             <div className="flex items-center gap-2 mt-1">
                {assignType === 'individual' && studentName ? (
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 border border-emerald-200">
                        <User className="w-3 h-3" />
                        Para: {studentName}
                    </span>
                ) : (
                    <p className="text-sm text-slate-500 font-medium">Crea manualmente o usa la IA</p>
                )}
             </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-slate-100 text-slate-400"><X className="w-6 h-6" /></Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* SIDEBAR: CONFIG & TABS */}
            <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col z-10">
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full bg-slate-100 p-1 rounded-xl mb-6">
                            <TabsTrigger value="manual" className="flex-1 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">✍️ Manual</TabsTrigger>
                            <TabsTrigger value="ai" className="flex-1 font-bold data-[state=active]:bg-white data-[state=active]:text-amber-600">✨ IA</TabsTrigger>
                        </TabsList>

                        <TabsContent value="manual" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Título</label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Verbos" className="font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Instrucciones</label>
                                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe la tarea..." className="resize-none h-24 bg-slate-50" />
                            </div>
                        </TabsContent>

                        <TabsContent value="ai" className="space-y-4 mt-0">
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
                                <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-700"><Sparkles className="w-6 h-6" /></div>
                                <h4 className="font-black text-amber-900 mb-1">Asistente LuinGo</h4>
                                <p className="text-xs text-amber-700/80 mb-4">Dime el tema y crearé las preguntas por ti.</p>
                                <Textarea value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Ej: Comida española, nivel A1..." className="bg-white border-amber-200 mb-3" />
                                <Button onClick={handleAiGenerate} disabled={isGenerating || !aiTopic} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl border-b-4 border-amber-700 active:border-b-0 active:translate-y-1">
                                    {isGenerating ? 'Creando...' : 'Generar Preguntas'}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* MAIN: PREGUNTAS (Visible solo en Tab Manual o tras generar) */}
            <div className="flex-1 bg-slate-50/50 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm group hover:border-indigo-300 transition-all relative">
                            <div className="absolute -left-3 top-6 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-sm shadow-lg border-2 border-white">{idx + 1}</div>
                            
                            <div className="pl-4">
                                <div className="flex flex-col md:flex-row gap-4 mb-4">
                                    <div className="relative min-w-[180px]">
                                        <select value={q.type} onChange={(e) => updateQuestion(q.id, 'type', e.target.value)} className="w-full h-11 pl-9 pr-8 bg-indigo-50 border-2 border-indigo-100 rounded-xl text-sm font-bold text-indigo-800 appearance-none cursor-pointer hover:border-indigo-300 outline-none">
                                            <option value="choice">Test A/B/C</option>
                                            <option value="true_false">Verdadero/Falso</option>
                                            <option value="fill_blank">Rellenar Hueco</option>
                                            <option value="open">Respuesta Abierta</option>
                                        </select>
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none">
                                            {q.type === 'choice' && <List className="w-4 h-4" />}
                                            {q.type === 'true_false' && <CheckSquare className="w-4 h-4" />}
                                            {q.type === 'fill_blank' && <Type className="w-4 h-4" />}
                                            {q.type === 'open' && <AlignLeft className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    <Input value={q.question_text} onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)} placeholder="Escribe la pregunta..." className="flex-1 font-bold text-lg border-0 border-b-2 border-slate-100 rounded-none px-0 focus:ring-0 focus:border-indigo-500 bg-transparent" />
                                    <button onClick={() => removeQuestion(q.id)} className="text-slate-300 hover:text-rose-500 p-2"><Trash2 className="w-5 h-5" /></button>
                                </div>
                                {renderQuestionBody(q)}
                                <div className="mt-4 pt-4 border-t border-slate-50">
                                    <Input value={q.explanation} onChange={(e) => updateQuestion(q.id, 'explanation', e.target.value)} placeholder="Feedback opcional (si falla)..." className="text-sm text-slate-500 italic border-transparent bg-transparent placeholder:text-slate-300 focus:bg-slate-50" />
                                </div>
                            </div>
                        </div>
                    ))}
                    <Button onClick={addQuestion} className="w-full py-8 border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 text-slate-400 rounded-2xl font-bold text-lg h-auto flex gap-2"><Plus className="w-6 h-6" /> Añadir Pregunta</Button>
                </div>

                {/* FOOTER */}
                <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center z-20">
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setAssignType('class')} className={cn("px-4 py-2 rounded-md text-xs font-bold", assignType === 'class' ? "bg-white shadow-sm text-slate-800" : "text-slate-500")}>Clase</button>
                        <button onClick={() => setAssignType('level')} className={cn("px-4 py-2 rounded-md text-xs font-bold", assignType === 'level' ? "bg-white shadow-sm text-slate-800" : "text-slate-500")}>Nivel ({selectedLevel})</button>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 rounded-xl shadow-lg border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"><Save className="w-4 h-4 mr-2" /> GUARDAR</Button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};