import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Sparkles, X, Save, User, Users, Layers } from 'lucide-react'; // New icons
import { cn } from '../lib/utils';

interface TaskBuilderProps {
  onSaveTask: (taskData: any, assignmentScope: { type: 'individual' | 'level' | 'class', targetId?: string }) => void;
  onCancel: () => void;
  initialStudentId?: string; // Escenario A: Pre-seleccionado
}

export const TaskBuilder: React.FC<TaskBuilderProps> = ({ onSaveTask, onCancel, initialStudentId }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'homework' | 'quiz' | 'project'>('homework');
  
  // Assignment State
  const [assignType, setAssignType] = useState<'individual' | 'level' | 'class'>(initialStudentId ? 'individual' : 'class');
  const [selectedLevel, setSelectedLevel] = useState('A1');

  const handleSave = () => {
    const taskData = {
      title,
      description,
      category,
      content_data: { type: 'form', questions: [] }, // Placeholder for builder logic
      ai_generated: true,
      color_tag: '#A8D8FF'
    };

    // Definir el alcance de la asignación
    const scope = {
        type: assignType,
        targetId: assignType === 'individual' ? initialStudentId : 
                  assignType === 'level' ? selectedLevel : undefined
    };

    onSaveTask(taskData, scope);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
             <h2 className="text-2xl font-black text-slate-800">Nueva Tarea</h2>
             <p className="text-sm text-slate-500 font-medium">Diseñando experiencia de aprendizaje</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-slate-200">
            <X className="w-6 h-6 text-slate-400" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
            
            {/* Paso 1: Contenido */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">1. Detalles de la Actividad</label>
                <Input 
                    placeholder="Título (ej: La Revolución Francesa)" 
                    className="text-lg font-bold h-14 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                <Textarea 
                    placeholder="Instrucciones para el alumno..." 
                    className="min-h-[120px] text-base rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 resize-none p-4"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
            </div>

            {/* Paso 2: Asignación (La lógica clave) */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">2. Asignación (Distribution)</label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Opción A: Individual (Solo si hay ID o genérico) */}
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
                                {initialStudentId ? 'Solo al estudiante seleccionado' : 'Requiere seleccionar alumno'}
                            </p>
                        </div>
                    </button>

                    {/* Opción B: Por Nivel (Smart Filtering) */}
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
                            <p className="text-xs text-slate-500">Todos los alumnos de un nivel (A1-C2)</p>
                        </div>
                    </button>

                    {/* Opción C: Toda la Clase */}
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
                            <p className="text-xs text-slate-500">Asignación masiva a todos</p>
                        </div>
                    </button>
                </div>

                {/* Selector de Nivel si elige "Por Nivel" */}
                {assignType === 'level' && (
                    <div className="mt-4 animate-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Selecciona el Nivel</label>
                        <div className="flex gap-2 flex-wrap">
                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setSelectedLevel(lvl)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all",
                                        selectedLevel === lvl 
                                            ? "bg-purple-600 text-white border-purple-600" 
                                            : "bg-white text-slate-500 border-slate-200 hover:border-purple-300"
                                    )}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <Button variant="ghost" onClick={onCancel} className="text-slate-500 hover:text-slate-800">Cancelar</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 rounded-xl h-12 shadow-lg shadow-indigo-200">
                <Save className="w-4 h-4 mr-2" />
                Crear y Asignar
            </Button>
        </div>
      </div>
    </div>
  );
};
