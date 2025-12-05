import React, { useState, useEffect } from 'react';
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

  // ESTADO LOCAL (Fuente de la verdad visual)
  const [corrections, setCorrections] = useState<Annotation[]>(submission.corrections || []);

  // Sincronizar si cambian las props
  useEffect(() => {
    if (submission.corrections) {
      setCorrections(submission.corrections);
    }
  }, [submission.corrections]);

  const handleAddAnnotation = (ann: Annotation) => {
    const newCorrections = [...corrections, ann];
    setCorrections(newCorrections);
    toast.success("Anotación agregada");
  };

  const handleUpdateAnnotation = (updatedAnn: Annotation) => {
    // Reemplazar la anotación vieja por la nueva
    const newCorrections = corrections.map(c => c.id === updatedAnn.id ? updatedAnn : c);
    setCorrections(newCorrections);
    toast.success("Actualizado correctamente");
  };

  const handleRemoveAnnotation = (id: string) => {
    const newCorrections = corrections.filter(c => c.id !== id);
    setCorrections(newCorrections);
    toast.success("Borrado");
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
    <div className="min-h-screen bg-white flex flex-col pb-20">
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

      <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* SECCIÓN 1: TEXTO DEL ALUMNO */}
        <div className="flex-1 lg:order-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              📄 Redacción
            </h3>
            <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded">
              {submission.textContent?.split(/\s+/).length || 0} palabras
            </span>
          </div>

          {/* Si es una tarea de audio, mostrar el link como reproductor o enlace */}
          {submission.textContent && submission.textContent.includes('http') && (
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 mb-4">
              <p className="text-xs font-black text-rose-800 uppercase mb-2">🎙️ Grabación del Alumno</p>
              <a href={submission.textContent} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline break-all text-sm hover:text-indigo-800">
                {submission.textContent}
              </a>
            </div>
          )}

          {isWriting ? (
            <TextAnnotator 
              // 🔥 LA CLAVE MÁGICA: Forzar renderizado si cambian los datos
              key={JSON.stringify(corrections)}
              
              text={submission.textContent || ''} 
              annotations={corrections}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onRemoveAnnotation={handleRemoveAnnotation}
            />
          ) : (
            <div className="space-y-4">
                {submission.answers?.map((ans:any, i:number) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="font-bold mb-2">{ans.questionText}</p>
                        <p className={`text-sm ${ans.isCorrect ? 'text-emerald-600':'text-rose-600'}`}>Respuesta: {ans.studentAnswer}</p>
                    </div>
                ))}
            </div>
          )}
        </div>

        {/* SECCIÓN 2: EVALUACIÓN */}
        <div className="w-full lg:w-80 shrink-0 lg:order-2 space-y-6">
          <div className="bg-indigo-50 p-5 rounded-2xl border-2 border-indigo-100 space-y-4 sticky top-20">
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
                className="bg-white border-indigo-200 min-h-[150px] text-sm"
                placeholder="Comentario general..."
              />
            </div>

            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl shadow-md">
              <Save className="w-4 h-4 mr-2" /> Guardar Todo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};