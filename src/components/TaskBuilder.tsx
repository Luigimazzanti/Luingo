import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Sparkles, X, Save, User, Users, Layers, Plus, Trash2, FileText, ListChecks } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface TaskBuilderProps {
  onSaveTask: (taskData: any, assignmentScope: { type: 'individual' | 'level' | 'class', targetId?: string }) => void;
  onCancel: () => void;
  initialStudentId?: string;
}

export const TaskBuilder: React.FC<TaskBuilderProps> = ({ onSaveTask, onCancel, initialStudentId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'homework' | 'quiz' | 'project'>('homework');
  
  // Assignment State
  const [assignType, setAssignType] = useState<'individual' | 'level' | 'class'>(initialStudentId ? 'individual' : 'class');
  const [selectedLevel, setSelectedLevel] = useState('A1');

  // Content State (Manual Editor)
  const [contentType, setContentType] = useState<'form' | 'pdf'>('form');
  const [pdfUrl, setPdfUrl] = useState('');
  const [questions, setQuestions] = useState<any[]>([
      { id: 1, type: 'choice', question_text: '', options: ['', ''], correct_answer: '' }
  ]);

  // AI State
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");

  const handleAddQuestion = () => {
      setQuestions([...questions, { 
          id: Date.now(), 
          type: 'choice', 
          question_text: '', 
          options: ['', ''], 
          correct_answer: '' 
      }]);
  };

  const handleAiGenerate = () => {
      setIsGenerating(true);
      // Simulación de llamada a API
      setTimeout(() => {
          setTitle(`Explorando: ${aiTopic}`);
          setDescription(`Una actividad divertida sobre ${aiTopic} generada por LuinGo.`);
          setQuestions([
              { id: 1, type: 'choice', question_text: `¿Qué es lo más importante de ${aiTopic}?`, options: ['Opción A', 'Opción B', 'Opción C'], correct_answer: 'Opción A', explanation: 'Porque es fundamental.' },
              { id: 2, type: 'fill_blank', question_text: `El [...] es clave en este tema.`, correct_answer: 'concepto', explanation: 'Sin esto no funciona.' }
          ]);
          setIsGenerating(false);
          // Cambiar a la pestaña de edición para revisar
          setActiveTab("manual");
      }, 1500);
  };

  const handleSave = () => {
    const content_data = contentType === 'pdf' 
        ? { type: 'pdf', resource_url: pdfUrl }
        : { type: 'form', questions: questions };

    const taskData = {
      title,
      description,
      category,
      content_data,
      ai_generated: false, // Ya no es "magia pura", ha sido revisado
      color_tag: '#A8D8FF'
    };

    const scope = {
        type: assignType,
        targetId: assignType === 'individual' ? initialStudentId : 
                  assignType === 'level' ? selectedLevel : undefined
    };

    onSaveTask(taskData, scope);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
             <h2 className="text-2xl font-black text-slate-800">Diseñador de Tareas</h2>
             <p className="text-sm text-slate-500 font-medium">Crea manualmente o usa la IA</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-slate-200">
            <X className="w-6 h-6 text-slate-400" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-8 pt-6">
                    <TabsList className="w-full justify-start bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger id="tab-manual" value="manual" className="flex-1 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                            <ListChecks className="w-4 h-4 mr-2" /> Editor Manual
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="flex-1 font-bold data-[state=active]:bg-white data-[state=active]:text-amber-600">
                            <Sparkles className="w-4 h-4 mr-2" /> Generador IA
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- PESTAÑA MANUAL --- */}
                <TabsContent value="manual" className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="space-y-4">
                        <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="Título de la Tarea" 
                            className="text-xl font-bold h-14 border-2" 
                        />
                        <Textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Instrucciones para el alumno..." 
                            className="min-h-[80px] border-2"
                        />
                    </div>

                    <div className="bg-slate-50 p-1 rounded-xl flex gap-2 w-fit border border-slate-200">
                        <button 
                            onClick={() => setContentType('form')} 
                            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-colors", contentType === 'form' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700")}
                        >
                            Cuestionario
                        </button>
                        <button 
                            onClick={() => setContentType('pdf')}
                            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-colors", contentType === 'pdf' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700")}
                        >
                            PDF / Recurso
                        </button>
                    </div>

                    {contentType === 'pdf' ? (
                        <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50">
                            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <Input 
                                value={pdfUrl} 
                                onChange={(e) => setPdfUrl(e.target.value)} 
                                placeholder="Pega aquí el link del PDF o Google Drive..." 
                                className="bg-white" 
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm relative group">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-black text-slate-400 uppercase">Pregunta {idx + 1}</span>
                                        <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="text-slate-300 hover:text-rose-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <Input 
                                        value={q.question_text}
                                        onChange={(e) => {
                                            const newQ = [...questions];
                                            newQ[idx].question_text = e.target.value;
                                            setQuestions(newQ);
                                        }}
                                        placeholder="Escribe la pregunta..." 
                                        className="font-bold mb-2 border-slate-200"
                                    />
                                    {/* Aquí irían inputs para opciones, simplificado para el ejemplo */}
                                </div>
                            ))}
                            <Button variant="outline" onClick={handleAddQuestion} className="w-full border-dashed border-2 h-12 text-slate-500 hover:text-indigo-600 hover:border-indigo-200">
                                <Plus className="w-4 h-4 mr-2" /> Añadir Pregunta
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* --- PESTAÑA IA --- */}
                <TabsContent value="ai" className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Sparkles className="w-12 h-12 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Asistente LuinGo</h3>
                    <p className="text-slate-500 mb-8 max-w-md">Dime el tema y crearé un borrador con preguntas, título y descripción para que tú solo revises.</p>
                    
                    <div className="w-full max-w-md space-y-4">
                        <Textarea 
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="Ej: Los verbos irregulares en pasado, nivel A2, tono divertido..." 
                            className="text-lg p-4 min-h-[100px]"
                        />
                        <Button 
                            onClick={handleAiGenerate} 
                            disabled={!aiTopic || isGenerating}
                            className="w-full bg-amber-400 hover:bg-amber-500 text-amber-900 h-14 rounded-xl font-black text-lg shadow-lg shadow-amber-100"
                        >
                            {isGenerating ? 'Pensando...' : '✨ Generar Borrador'}
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>

        {/* Footer: Asignación y Guardado */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Asignar a:</span>
                <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                    <button 
                        onClick={() => setAssignType('class')}
                        className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", assignType === 'class' ? "bg-indigo-100 text-indigo-700" : "text-slate-500")}
                    >
                        Clase
                    </button>
                    <button 
                        onClick={() => setAssignType('level')}
                        className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", assignType === 'level' ? "bg-purple-100 text-purple-700" : "text-slate-500")}
                    >
                        Nivel ({selectedLevel})
                    </button>
                    {initialStudentId && (
                        <button 
                            onClick={() => setAssignType('individual')}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", assignType === 'individual' ? "bg-emerald-100 text-emerald-700" : "text-slate-500")}
                        >
                            Individual
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 rounded-xl shadow-lg shadow-indigo-200">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Tarea
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};
