import React, { useState } from 'react';
import { Submission } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Save, Highlighter, MessageSquare, Check, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { cn } from '../lib/utils';
import { TextAnnotator, Annotation } from './TextAnnotator';

interface TaskCorrectorProps {
  submission: Submission;
  onBack: () => void;
  onSaveCorrection: (grade: number, feedback: string, corrections?: any[]) => void;
}

export const TaskCorrector: React.FC<TaskCorrectorProps> = ({
  submission,
  onBack,
  onSaveCorrection
}) => {
  const isWriting = !!submission.textContent || !!submission.text_content;
  
  const [grade, setGrade] = useState(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState(submission.teacher_feedback || '');
  
  // ✅ ESTADO WRITING CON ANNOTATIONS COMPATIBLES
  const [corrections, setCorrections] = useState<Annotation[]>(submission.corrections || []);

  // ✅ HANDLERS PARA TEXT ANNOTATOR
  const handleAddAnnotation = (ann: Annotation) => {
    setCorrections([...corrections, ann]);
    toast.success('✅ Corrección añadida');
  };

  const handleRemoveAnnotation = (id: string) => {
    setCorrections(corrections.filter(c => c.id !== id));
    toast.info('🗑️ Corrección eliminada');
  };

  const handleSave = () => {
    const gradeNum = parseFloat(grade);
    
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
      toast.error('La nota debe estar entre 0 y 10');
      return;
    }
    
    onSaveCorrection(gradeNum, feedback, isWriting ? corrections : undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-800">{submission.task_title}</h1>
                <p className="text-sm text-slate-500">Estudiante: {submission.student_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Save className="w-4 h-4" />
                Guardar Evaluación
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PANEL IZQUIERDO: CONTENIDO */}
          <div className="lg:col-span-2 space-y-6">
            {isWriting ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-700 text-sm uppercase tracking-wide">
                    Texto del Alumno con Correcciones
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {(submission.textContent || submission.text_content || '').split(/\s+/).filter((w: string) => w.length > 0).length} palabras
                  </span>
                </div>
                
                {/* ✅ USAR TEXT ANNOTATOR CON POSITION-BASED RENDERING */}
                <TextAnnotator 
                  text={submission.textContent || submission.text_content || ''}
                  annotations={corrections}
                  onAddAnnotation={handleAddAnnotation}
                  onRemoveAnnotation={handleRemoveAnnotation}
                  readOnly={false}
                />
              </div>
            ) : (
              // ✅ RENDERIZADO DE QUIZ (Respuestas)
              <div className="space-y-4">
                {submission.answers?.map((ans: any, i: number) => (
                  <div key={i} className="bg-white p-6 rounded-xl border-2 border-slate-100 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        ans.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      )}>
                        {ans.isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 mb-2">{ans.questionText}</p>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-semibold text-slate-500">Respuesta: </span>
                            <span className={cn(
                              "font-bold",
                              ans.isCorrect ? 'text-emerald-600' : 'text-rose-600'
                            )}>
                              {ans.studentAnswer}
                            </span>
                          </p>
                          {!ans.isCorrect && ans.correctAnswer && (
                            <p className="text-sm">
                              <span className="font-semibold text-slate-500">Correcta: </span>
                              <span className="font-bold text-emerald-600">{ans.correctAnswer}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* PANEL DERECHO: EVALUACIÓN */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-lg sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-indigo-900">Evaluación Final</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase mb-2 block">
                    Nota (0-10)
                  </label>
                  <Input
                    type="number"
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="text-3xl font-black text-indigo-600 h-16 text-center"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase mb-2 block">
                    Comentario Global
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    className="h-40 resize-none"
                    placeholder="Escribe tu feedback para el estudiante..."
                  />
                </div>
                
                {isWriting && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-semibold">Correcciones:</span>
                      <span className="font-black text-indigo-600">{corrections.length}</span>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={handleSave}
                  className="w-full h-14 text-lg font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
                >
                  <Save className="w-5 h-5" />
                  Guardar Evaluación
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};