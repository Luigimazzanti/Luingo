import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Sparkles, X, Save, Plus, Trash2, CheckCircle2, GripVertical, List, Type, MoveHorizontal, Link as LinkIcon, Mic, CheckSquare, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch'; // Asegúrate de tener este componente o usa un checkbox simple

interface TaskBuilderProps {
  onSaveTask: (taskData: any, assignmentScope: { type: 'individual' | 'level' | 'class', targetId?: string }) => void;
  onCancel: () => void;
  initialStudentId?: string;
}

// 🚀 TIPOS AMPLIADOS
type QuestionType = 'choice' | 'fill_blank' | 'order_sentence' | 'matching' | 'true_false' | 'open';

interface QuestionDraft {
  id: number;
  type: QuestionType;
  question_text: string;
  options: string[]; 
  correct_answer: string; 
  pairs: { left: string; right: string }[]; // Para Matching
  allow_audio: boolean; // Para Open
  explanation: string;
}

export const TaskBuilder: React.FC<TaskBuilderProps> = ({ onSaveTask, onCancel, initialStudentId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'homework' | 'quiz' | 'project'>('homework');
  const [assignType, setAssignType] = useState<'individual' | 'level' | 'class'>(initialStudentId ? 'individual' : 'class');
  const [selectedLevel, setSelectedLevel] = useState('A1');

  // --- ESTADO INICIAL CON PREGUNTA DE EJEMPLO ---
  const [questions, setQuestions] = useState<QuestionDraft[]>([
      { 
        id: Date.now(), 
        type: 'choice', 
        question_text: '', 
        options: ['', '', ''], 
        correct_answer: '', 
        pairs: [{ left: '', right: '' }, { left: '', right: '' }],
        allow_audio: false,
        explanation: '' 
      }
  ]);

  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- MANEJADORES DE LÓGICA COMPLEJA ---

  const addQuestion = () => {
      setQuestions([...questions, {
          id: Date.now(),
          type: 'choice',
          question_text: '',
          options: ['', '', ''],
          correct_answer: '',
          pairs: [{ left: '', right: '' }, { left: '', right: '' }],
          allow_audio: false,
          explanation: ''
      }]);
  };

  const updateQuestion = (id: number, field: keyof QuestionDraft, value: any) => {
      setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  // Manejo de Parejas (Matching)
  const updatePair = (qId: number, pairIndex: number, side: 'left' | 'right', value: string) => {
      const q = questions.find(q => q.id === qId);
      if (!q) return;
      const newPairs = [...q.pairs];
      newPairs[pairIndex] = { ...newPairs[pairIndex], [side]: value };
      updateQuestion(qId, 'pairs', newPairs);
  };

  const addPair = (qId: number) => {
      const q = questions.find(q => q.id === qId);
      if (!q) return;
      updateQuestion(qId, 'pairs', [...q.pairs, { left: '', right: '' }]);
  };

  const handleSave = () => {
    const taskData = {
      title: title || 'Nueva Tarea',
      description: description || 'Sin descripción',
      category,
      content_data: { type: 'form', questions },
      ai_generated: false,
      color_tag: '#A8D8FF'
    };
    const scope = { type: assignType, targetId: assignType === 'individual' ? initialStudentId : assignType === 'level' ? selectedLevel : undefined };
    onSaveTask(taskData, scope as any);
  };

  // --- RENDERIZADO DE CONTENIDO POR TIPO ---
  const renderQuestionContent = (q: QuestionDraft, idx: number) => {
      switch (q.type) {
          case 'choice':
              return (
                  <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase">Opciones (Marca la correcta)</label>
                      {q.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-3">
                              <button 
                                  onClick={() => {
                                      const newOpts = [...q.options];
                                      updateQuestion(q.id, 'correct_answer', newOpts[i]);
                                  }}
                                  className={cn("shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center", q.correct_answer === opt && opt !== '' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400")}
                              >
                                  <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <Input 
                                  value={opt} 
                                  onChange={(e) => {
                                      const newOpts = [...q.options];
                                      newOpts[i] = e.target.value;
                                      updateQuestion(q.id, 'options', newOpts);
                                      // Si era la correcta, actualizamos también el valor de correct_answer
                                      if (q.correct_answer === opt) updateQuestion(q.id, 'correct_answer', e.target.value);
                                  }}
                                  placeholder={`Opción ${i + 1}`}
                                  className={cn("bg-white", q.correct_answer === opt && opt !== '' && "border-emerald-500")}
                              />
                          </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => updateQuestion(q.id, 'options', [...q.options, ''])} className="text-indigo-600 text-xs font-bold">+ Añadir Opción</Button>
                  </div>
              );

          case 'matching':
              return (
                  <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase px-1">
                          <span>Columna A (Concepto)</span>
                          <span>Columna B (Definición/Imagen)</span>
                      </div>
                      {q.pairs.map((pair, i) => (
                          <div key={i} className="flex items-center gap-4">
                              <Input 
                                  value={pair.left} 
                                  onChange={(e) => updatePair(q.id, i, 'left', e.target.value)}
                                  placeholder="Ej: Manzana"
                                  className="bg-white border-indigo-100 focus:border-indigo-400"
                              />
                              <LinkIcon className="w-4 h-4 text-slate-300 shrink-0" />
                              <Input 
                                  value={pair.right} 
                                  onChange={(e) => updatePair(q.id, i, 'right', e.target.value)}
                                  placeholder="Ej: Fruta roja..."
                                  className="bg-white border-emerald-100 focus:border-emerald-400"
                              />
                              <button onClick={() => updateQuestion(q.id, 'pairs', q.pairs.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>
                          </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => addPair(q.id)} className="text-indigo-600 text-xs font-bold">+ Añadir Pareja</Button>
                  </div>
              );

          case 'true_false':
              return (
                  <div className="flex gap-4 mt-2">
                      {['Verdadero', 'Falso'].map((val) => (
                          <button
                              key={val}
                              onClick={() => updateQuestion(q.id, 'correct_answer', val)}
                              className={cn(
                                  "flex-1 py-3 rounded-xl border-2 font-bold transition-all",
                                  q.correct_answer === val 
                                      ? (val === 'Verdadero' ? "bg-emerald-100 border-emerald-500 text-emerald-700" : "bg-rose-100 border-rose-500 text-rose-700")
                                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                              )}
                          >
                              {val}
                          </button>
                      ))}
                  </div>
              );

          case 'fill_blank':
              return (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-sm">
                      <p className="font-bold text-amber-800 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Instrucciones:</p>
                      <p className="text-amber-700 mb-3">Escribe la frase en el título y usa <strong>[...]</strong> donde va el hueco.</p>
                      <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-900">Respuesta Oculta:</span>
                          <Input 
                              value={q.correct_answer} 
                              onChange={(e) => updateQuestion(q.id, 'correct_answer', e.target.value)}
                              placeholder="Palabra exacta"
                              className="bg-white max-w-xs"
                          />
                      </div>
                  </div>
              );

          case 'open':
              return (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-lg", q.allow_audio ? "bg-rose-100 text-rose-600" : "bg-slate-200 text-slate-400")}>
                                  <Mic className="w-5 h-5" />
                              </div>
                              <div>
                                  <p className="font-bold text-slate-700">Permitir Audio</p>
                                  <p className="text-xs text-slate-500">El alumno puede grabar su voz</p>
                              </div>
                          </div>
                          <Switch 
                              checked={q.allow_audio}
                              onCheckedChange={(checked) => updateQuestion(q.id, 'allow_audio', checked)}
                          />
                      </div>
                      <div className="h-px bg-slate-200 w-full"></div>
                      <p className="text-xs text-slate-400 italic">Esta pregunta requiere corrección manual por parte del profesor.</p>
                  </div>
              );
          
          default: // order_sentence
              return (
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-700 text-sm font-medium border border-indigo-100">
                      Escribe la frase correcta arriba. El sistema la desordenará automáticamente palabra por palabra.
                  </div>
              );
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#F8FAFC] w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-4 border-white">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center">
          <div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">LuinGo Builder Pro</h2>
             <p className="text-sm text-slate-500 font-medium">Diseñador de Actividades Avanzado</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* SIDEBAR (Igual que antes, resumido) */}
            <div className="w-full md:w-72 bg-white border-r border-slate-200 p-6 overflow-y-auto space-y-6 z-10 hidden md:block">
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase">Detalles</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="font-bold" />
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instrucciones..." className="resize-none h-24" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase">Categoría</label>
                    <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="homework">Tarea</SelectItem>
                            <SelectItem value="quiz">Examen</SelectItem>
                            <SelectItem value="project">Proyecto</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* MAIN EDITOR */}
            <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-all relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 rounded-l-2xl group-hover:bg-indigo-400 transition-colors"></div>
                            
                            {/* Top Bar del Item */}
                            <div className="flex items-start gap-4 mb-6 pl-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-black text-sm shrink-0">{idx + 1}</span>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Selector de Tipo MEJORADO */}
                                    <div className="md:col-span-1">
                                        <Select value={q.type} onValueChange={(val: any) => updateQuestion(q.id, 'type', val)}>
                                            <SelectTrigger className="font-bold bg-slate-50 border-slate-200 h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="choice"><span className="flex items-center gap-2"><List className="w-4 h-4" /> Test</span></SelectItem>
                                                <SelectItem value="true_false"><span className="flex items-center gap-2"><CheckSquare className="w-4 h-4" /> V / F</span></SelectItem>
                                                <SelectItem value="fill_blank"><span className="flex items-center gap-2"><Type className="w-4 h-4" /> Huecos</span></SelectItem>
                                                <SelectItem value="matching"><span className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Parejas</span></SelectItem>
                                                <SelectItem value="order_sentence"><span className="flex items-center gap-2"><MoveHorizontal className="w-4 h-4" /> Ordenar</span></SelectItem>
                                                <SelectItem value="open"><span className="flex items-center gap-2"><Mic className="w-4 h-4" /> Abierta/Voz</span></SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {/* Pregunta Input */}
                                    <div className="md:col-span-3">
                                        <Input 
                                            value={q.question_text}
                                            onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)}
                                            placeholder="Escribe la pregunta o instrucción..." 
                                            className="text-lg font-medium border-0 border-b-2 border-slate-100 rounded-none px-0 focus-visible:ring-0 focus-visible:border-indigo-500 bg-transparent"
                                        />
                                    </div>
                                </div>
                                <button onClick={() => setQuestions(questions.filter(qi => qi.id !== q.id))} className="text-slate-300 hover:text-rose-500 p-2"><Trash2 className="w-5 h-5" /></button>
                            </div>

                            {/* Contenido Específico */}
                            <div className="pl-12 pr-2">
                                {renderQuestionContent(q, idx)}
                            </div>

                            {/* Feedback Opcional */}
                            <div className="mt-6 pl-12 pr-2 pt-4 border-t border-slate-100">
                                <Input 
                                    value={q.explanation}
                                    onChange={(e) => updateQuestion(q.id, 'explanation', e.target.value)}
                                    placeholder="Explicación o pista para el alumno (opcional)..." 
                                    className="text-sm text-slate-500 bg-transparent border-transparent placeholder:italic focus:bg-slate-50 focus:border-slate-200 transition-colors"
                                />
                            </div>
                        </div>
                    ))}

                    <Button 
                        onClick={addQuestion}
                        variant="outline" 
                        className="w-full h-20 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex flex-col gap-1"
                    >
                        <Plus className="w-8 h-8" />
                        <span className="font-bold text-lg">Añadir Elemento</span>
                    </Button>
                </div>
            </div>
        </div>

        {/* Footer Global */}
        <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center z-20">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:block">
                {questions.length} preguntas configuradas
            </div>
            <div className="flex gap-3">
                <Button variant="ghost" onClick={onCancel} className="text-slate-500 font-bold">Cancelar</Button>
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 rounded-xl shadow-lg shadow-indigo-200 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Tarea
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};
