import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Sparkles, X, Save, User, Users, Layers, Plus, Trash2, CheckSquare, Type, List, FileText, Link } from 'lucide-react';
import { cn } from '../lib/utils';

interface Question {
  id: number;
  type: 'choice' | 'fill_gap';
  question_text: string;
  options?: string[];
  correct_answer: string;
}

interface TaskBuilderProps {
  onSaveTask: (taskData: any, assignmentScope: { type: 'individual' | 'level' | 'class', targetId?: string }) => void;
  onCancel: () => void;
  initialStudentId?: string; 
}

export const TaskBuilder: React.FC<TaskBuilderProps> = ({ onSaveTask, onCancel, initialStudentId }) => {
  // --- STATE ---
  const [step, setStep] = useState(1); // 1: Detalles, 2: Contenido, 3: Asignación
  
  // Step 1: Detalles
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'homework' | 'quiz' | 'project'>('homework');
  
  // Step 2: Contenido
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [contentType, setContentType] = useState<'quiz' | 'pdf'>('quiz');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resourceUrl, setResourceUrl] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  // Step 3: Asignación
  const [assignType, setAssignType] = useState<'individual' | 'level' | 'class'>(initialStudentId ? 'individual' : 'class');
  const [selectedLevel, setSelectedLevel] = useState('A1');

  // --- LOGIC ---

  const addQuestion = (type: 'choice' | 'fill_gap') => {
      const newQ: Question = {
          id: Date.now(),
          type,
          question_text: '',
          options: type === 'choice' ? ['', '', ''] : undefined,
          correct_answer: ''
      };
      setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id: number, field: keyof Question, value: any) => {
      setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };
  
  const updateOption = (qId: number, optIndex: number, value: string) => {
      setQuestions(questions.map(q => {
          if (q.id !== qId || !q.options) return q;
          const newOpts = [...q.options];
          newOpts[optIndex] = value;
          return { ...q, options: newOpts };
      }));
  };

  const deleteQuestion = (id: number) => {
      setQuestions(questions.filter(q => q.id !== id));
  };

  const generateAIContent = async () => {
      setGenerating(true);
      // Simulando delay de red
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiQuestions: Question[] = [
          {
              id: Date.now() + 1,
              type: 'choice',
              question_text: '¿Cuál es la capital de España?',
              options: ['Barcelona', 'Madrid', 'Sevilla'],
              correct_answer: 'Madrid'
          },
          {
              id: Date.now() + 2,
              type: 'fill_gap',
              question_text: 'El sol sale por el ______.',
              correct_answer: 'Este'
          },
          {
              id: Date.now() + 3,
              type: 'choice',
              question_text: '¿Cómo se dice "Apple" en español?',
              options: ['Manzana', 'Pera', 'Naranja'],
              correct_answer: 'Manzana'
          }
      ];
      
      setQuestions(aiQuestions);
      setContentType('quiz'); // Forzar vista quiz
      setDescription(prev => prev || "Completa los siguientes ejercicios para demostrar tu comprensión.");
      setTitle(prev => prev || "Ejercicio Generado con IA");
      
      setGenerating(false);
      setActiveTab('manual'); // Switch to Manual for review
  };

  const handleSave = () => {
    // Construir content_data según el tipo elegido
    let contentData;
    
    if (contentType === 'quiz') {
        contentData = { type: 'form', questions };
    } else {
        contentData = { type: 'pdf', resource_url: resourceUrl };
    }

    const taskData = {
      title,
      description,
      category,
      content_data: contentData, 
      ai_generated: questions.length > 0 && contentType === 'quiz',
      color_tag: '#A8D8FF'
    };

    const scope = {
        type: assignType,
        targetId: assignType === 'individual' ? initialStudentId : 
                  assignType === 'level' ? selectedLevel : undefined
    };

    onSaveTask(taskData, scope);
  };

  // --- UI STEPS ---

  const renderStep1_Details = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Título</label>
            <Input 
                placeholder="Ej: La Revolución Francesa" 
                className="text-lg font-bold h-14 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Instrucciones</label>
            <Textarea 
                placeholder="Instrucciones para el alumno..." 
                className="min-h-[120px] text-base rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 resize-none p-4"
                value={description}
                onChange={e => setDescription(e.target.value)}
            />
          </div>
      </div>
  );

  const renderManualEditor = () => (
      <div className="space-y-6">
          {/* Selector Tipo Contenido */}
          <div className="flex gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200 w-fit">
              <button
                  onClick={() => setContentType('quiz')}
                  className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                      contentType === 'quiz' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
              >
                  <List className="w-4 h-4" />
                  Cuestionario
              </button>
              <button
                   onClick={() => setContentType('pdf')}
                   className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                      contentType === 'pdf' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
              >
                  <FileText className="w-4 h-4" />
                  PDF / Recurso
              </button>
          </div>

          {contentType === 'quiz' ? (
              <div className="space-y-6">
                   <div className="flex flex-wrap gap-3 mb-4">
                      <Button 
                          onClick={() => addQuestion('choice')} 
                          variant="outline" 
                          size="sm"
                          className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-600"
                      >
                          <CheckSquare className="w-4 h-4 mr-2" />
                          + Opción Múltiple
                      </Button>
                      <Button 
                          onClick={() => addQuestion('fill_gap')} 
                          variant="outline" 
                          size="sm"
                          className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-600"
                      >
                          <Type className="w-4 h-4 mr-2" />
                          + Huecos
                      </Button>
                   </div>
                   
                   {/* Questions List */}
                   <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {questions.length === 0 && (
                          <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                              <p className="text-sm">Añade preguntas manualmente o usa la IA.</p>
                          </div>
                      )}
                      {questions.map((q, idx) => (
                          <div key={q.id} className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm group hover:border-indigo-200 transition-colors">
                              <div className="flex justify-between items-start gap-4 mb-3">
                                  <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-xs font-bold text-slate-500 shrink-0">
                                      {idx + 1}
                                  </span>
                                  <Input 
                                      value={q.question_text}
                                      onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)}
                                      placeholder="Pregunta..."
                                      className="font-medium border-transparent hover:border-slate-200 focus:border-indigo-400 h-8 bg-transparent px-2"
                                  />
                                  <Button variant="ghost" size="icon" onClick={() => deleteQuestion(q.id)} className="text-slate-300 hover:text-red-500">
                                      <Trash2 className="w-4 h-4" />
                                  </Button>
                              </div>
                              {/* Opciones renderizadas igual que antes */}
                              {q.type === 'choice' && q.options && (
                                  <div className="pl-10 space-y-2">
                                      {q.options.map((opt, i) => (
                                          <div key={i} className="flex items-center gap-2">
                                              <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>
                                              <Input 
                                                  value={opt} 
                                                  onChange={(e) => updateOption(q.id, i, e.target.value)}
                                                  placeholder={`Opción ${i+1}`}
                                                  className="h-8 text-sm bg-slate-50 border-slate-200"
                                              />
                                              <input 
                                                type="radio" 
                                                name={`correct-${q.id}`}
                                                checked={q.correct_answer === opt && opt !== ''}
                                                onChange={() => updateQuestion(q.id, 'correct_answer', opt)}
                                                className="ml-2 accent-emerald-500 w-4 h-4"
                                              />
                                          </div>
                                      ))}
                                  </div>
                              )}
                              {q.type === 'fill_gap' && (
                                   <div className="pl-10">
                                       <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                                           <span className="text-xs font-bold text-indigo-500 uppercase">Respuesta:</span>
                                           <Input 
                                              value={q.correct_answer} 
                                              onChange={(e) => updateQuestion(q.id, 'correct_answer', e.target.value)}
                                              className="h-8 bg-white border-indigo-200 text-indigo-700 font-bold"
                                           />
                                       </div>
                                   </div>
                              )}
                          </div>
                      ))}
                   </div>
              </div>
          ) : (
              <div className="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-200">
                      <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                      <label className="block text-sm font-bold text-slate-700">URL del Recurso (PDF)</label>
                      <div className="flex gap-2">
                          <Input 
                              placeholder="https://example.com/documento.pdf" 
                              value={resourceUrl}
                              onChange={e => setResourceUrl(e.target.value)}
                              className="bg-white"
                          />
                          <Button variant="ghost" size="icon" className="border bg-white">
                              <Link className="w-4 h-4" />
                          </Button>
                      </div>
                      <p className="text-xs text-slate-400">
                          Pega un enlace directo a un archivo PDF. Los alumnos podrán anotarlo.
                      </p>
                  </div>
              </div>
          )}
      </div>
  );

  const renderStep2_Content = () => (
      <div className="animate-in fade-in slide-in-from-right-4 h-full flex flex-col">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="manual">✏️ Editor Manual</TabsTrigger>
                  <TabsTrigger value="ai">✨ Generador IA</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="flex-1 outline-none">
                  {renderManualEditor()}
              </TabsContent>
              
              <TabsContent value="ai" className="flex-1 outline-none">
                  <div className="flex flex-col items-center justify-center h-full space-y-6 py-8 text-center">
                      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
                          <Sparkles className="w-10 h-10 text-amber-500" />
                      </div>
                      <div className="max-w-md space-y-4">
                          <h3 className="text-xl font-black text-slate-800">Asistente Mágico</h3>
                          <p className="text-slate-500">
                              Describe el tema y nivel. La IA generará preguntas que podrás editar después.
                          </p>
                          <Textarea 
                              value={aiPrompt}
                              onChange={e => setAiPrompt(e.target.value)}
                              placeholder="Ej: 5 preguntas sobre verbos irregulares en pasado para nivel B1..."
                              className="min-h-[100px] text-base p-4 border-2 focus:border-amber-400"
                          />
                          <Button 
                              onClick={generateAIContent} 
                              disabled={generating || !aiPrompt.trim()}
                              className="w-full bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold h-12 text-lg shadow-lg shadow-amber-100"
                          >
                              {generating ? 'Generando...' : 'Generar Borrador'}
                          </Button>
                      </div>
                  </div>
              </TabsContent>
          </Tabs>
      </div>
  );

  const renderStep3_Assignment = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Opción A: Individual */}
            <button
                onClick={() => setAssignType('individual')}
                disabled={!initialStudentId}
                className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2",
                    assignType === 'individual' 
                        ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500" 
                        : "bg-white border-slate-200 hover:border-slate-300",
                    !initialStudentId && "opacity-50 cursor-not-allowed bg-slate-50"
                )}
            >
                <div className="p-2 bg-indigo-100 w-fit rounded-lg text-indigo-600">
                    <User className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-bold text-slate-800">Individual</p>
                    <p className="text-xs text-slate-500">
                        {initialStudentId ? 'Estudiante pre-seleccionado' : 'Requiere seleccionar desde el perfil'}
                    </p>
                </div>
            </button>

            {/* Opción B: Por Nivel */}
            <button
                onClick={() => setAssignType('level')}
                className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2",
                    assignType === 'level' 
                        ? "bg-purple-50 border-purple-500 ring-1 ring-purple-500" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                )}
            >
                <div className="p-2 bg-purple-100 w-fit rounded-lg text-purple-600">
                    <Layers className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-bold text-slate-800">Por Nivel</p>
                    <p className="text-xs text-slate-500">Todos los alumnos de un nivel</p>
                </div>
            </button>

            {/* Opción C: Clase */}
            <button
                onClick={() => setAssignType('class')}
                className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2",
                    assignType === 'class' 
                        ? "bg-amber-50 border-amber-500 ring-1 ring-amber-500" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                )}
            >
                <div className="p-2 bg-amber-100 w-fit rounded-lg text-amber-600">
                    <Users className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-bold text-slate-800">Toda la Clase</p>
                    <p className="text-xs text-slate-500">Asignación masiva</p>
                </div>
            </button>
        </div>

        {assignType === 'level' && (
            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <label className="text-xs font-bold text-purple-600 uppercase mb-3 block">Selecciona el Nivel Objetivo</label>
                <div className="flex gap-2 flex-wrap">
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => setSelectedLevel(lvl)}
                            className={cn(
                                "px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all",
                                selectedLevel === lvl 
                                    ? "bg-purple-600 text-white border-purple-600 shadow-md transform scale-105" 
                                    : "bg-white text-purple-400 border-purple-200 hover:border-purple-400"
                            )}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with Steps */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/80 backdrop-blur flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`w-2.5 h-2.5 rounded-full transition-all ${step >= s ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    ))}
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-800 leading-tight">
                        {step === 1 && '1. Detalles'}
                        {step === 2 && '2. Contenido'}
                        {step === 3 && '3. Asignación'}
                    </h2>
                 </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-slate-200">
                 <X className="w-6 h-6 text-slate-400" />
            </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
            {step === 1 && renderStep1_Details()}
            {step === 2 && renderStep2_Content()}
            {step === 3 && renderStep3_Assignment()}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between">
            {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(s => s - 1)} className="font-bold text-slate-500">
                    Atrás
                </Button>
            ) : (
                <div></div> // Spacer
            )}

            <div className="flex gap-3">
                {step < 3 ? (
                    <Button 
                        onClick={() => setStep(s => s + 1)} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 rounded-xl"
                        disabled={step === 1 && !title} // Validación simple
                    >
                        Siguiente
                    </Button>
                ) : (
                    <Button 
                        onClick={handleSave} 
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 rounded-xl shadow-lg shadow-emerald-200"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Finalizar y Asignar
                    </Button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
