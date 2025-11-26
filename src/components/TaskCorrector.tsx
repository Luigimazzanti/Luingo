import React, { useState } from 'react';
import { Submission } from '../types';
import { Button } from './ui/button';
import { ArrowLeft, Save, GraduationCap } from 'lucide-react';
import { TextAnnotator, Annotation } from './TextAnnotator';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';

interface TaskCorrectorProps {
  submission: Submission;
  onBack: () => void;
  onSaveCorrection: (grade: number, feedback: string, corrections?: any[]) => void;
}

export const TaskCorrector: React.FC<TaskCorrectorProps> = ({ submission, onBack, onSaveCorrection }) => {
  const isWriting = !!submission.textContent;
  const [grade, setGrade] = useState(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState(submission.teacher_feedback || '');
  // Estado de correcciones (annotations)
  const [corrections, setCorrections] = useState<Annotation[]>(submission.corrections || []);

  const handleAddAnnotation = (ann: Annotation) => {
    setCorrections([...corrections, ann]);
    toast.success("Anotación añadida");
  };

  // ✅ EL FIX: Función para actualizar al instante
  const handleUpdateAnnotation = (updatedAnn: Annotation) => {
    setCorrections(corrections.map(c => c.id === updatedAnn.id ? updatedAnn : c));
    toast.success("Anotación actualizada");
  };

  const handleRemoveAnnotation = (id: string) => {
    setCorrections(corrections.filter(c => c.id !== id));
    toast.success("Anotación borrada");
  };

  const handleSave = () => {
    const numGrade = parseFloat(grade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 10) {
      toast.error("Nota inválida (0-10)");
      return;
    }
    onSaveCorrection(numGrade, feedback, corrections);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20"> {/* Padding bottom para scrolling */}
      {/* HEADER COMPACTO */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500 -ml-2">
          <ArrowLeft className="mr-2 w-4 h-4"/> Volver
        </Button>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alumno</p>
          <h2 className="font-black text-sm text-slate-800 truncate max-w-[150px]">{submission.student_name}</h2>
        </div>
      </div>

      <div className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-8">
        
        {/* SECCIÓN 1: EL TRABAJO DEL ALUMNO */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              📄 Redacción
            </h3>
            <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded">
              {submission.textContent?.split(/\s+/).length || 0} palabras
            </span>
          </div>

          {isWriting ? (
            <TextAnnotator 
              text={submission.textContent || ''} 
              annotations={corrections}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onRemoveAnnotation={handleRemoveAnnotation}
            />
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400">
              Esta tarea no es de redacción.
            </div>
          )}
        </div>

        {/* SECCIÓN 2: EVALUACIÓN FINAL (Al final en móvil) */}
        <div className="bg-indigo-50 p-5 rounded-2xl border-2 border-indigo-100 space-y-4">
          <h3 className="font-black text-indigo-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5"/> Evaluación
          </h3>
          
          <div>
            <label className="text-xs font-bold text-indigo-700 uppercase block mb-2">Nota (0-10)</label>
            <Input 
              type="number" 
              value={grade} 
              onChange={e => setGrade(e.target.value)} 
              className="bg-white border-indigo-200 text-2xl font-black text-indigo-600 h-14"
              placeholder="0.0"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-indigo-700 uppercase block mb-2">Feedback Global</label>
            <Textarea 
              value={feedback} 
              onChange={e => setFeedback(e.target.value)} 
              className="bg-white border-indigo-200 min-h-[100px] text-sm"
              placeholder="Escribe un comentario general..."
            />
          </div>

          <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl shadow-md">
            <Save className="w-4 h-4 mr-2" /> Guardar Todo
          </Button>
        </div>
      </div>
    </div>
  );
};