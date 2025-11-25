import React, { useState } from 'react';
import { Submission } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Save, Highlighter, MessageSquare, Check, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { cn } from '../lib/utils';

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
  
  // ✅ ESTADO WRITING
  const [corrections, setCorrections] = useState<any[]>(submission.corrections || []);
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number, text: string} | null>(null);
  const [correctionType, setCorrectionType] = useState<'grammar'|'vocab'|'spelling'>('grammar');
  const [correctionNote, setCorrectionNote] = useState('');

  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().length === 0) return;
    
    const selectedText = selection.toString();
    setSelectionRange({ 
      start: 0, // Simplificado - en producción usar offsets reales
      end: 0, 
      text: selectedText 
    });
  };

  const addCorrection = () => {
    if (!selectionRange) return;
    
    const newCorr = {
      id: Date.now(),
      original: selectionRange.text,
      type: correctionType,
      note: correctionNote
    };
    
    setCorrections([...corrections, newCorr]);
    setSelectionRange(null);
    setCorrectionNote('');
    toast.success('Corrección añadida');
  };

  const removeCorrection = (id: number) => {
    setCorrections(corrections.filter(c => c.id !== id));
    toast.info('Corrección eliminada');
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
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-700 text-sm uppercase tracking-wide">Texto del Alumno</h3>
                  <span className="text-xs font-bold text-slate-400">
                    {(submission.textContent || submission.text_content || '').split(/\s+/).filter((w: string) => w.length > 0).length} palabras
                  </span>
                </div>
                
                <div 
                  className="prose prose-lg max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-6 rounded-xl border-2 border-slate-100"
                  onMouseUp={handleTextSelect}
                  style={{ cursor: 'text', userSelect: 'text' }}
                >
                  {submission.textContent || submission.text_content}
                </div>
                
                {/* Popover de Corrección */}
                {selectionRange && (
                  <div className="absolute top-20 right-10 bg-white p-4 rounded-xl shadow-2xl border-2 border-indigo-200 z-50 w-72 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-indigo-900">Corregir selección</p>
                      <button onClick={() => setSelectionRange(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 p-2 bg-slate-50 rounded border border-slate-200 italic">
                      "{selectionRange.text}"
                    </p>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setCorrectionType('grammar')}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                          correctionType === 'grammar'
                            ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        Gramática
                      </button>
                      <button
                        onClick={() => setCorrectionType('vocab')}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                          correctionType === 'vocab'
                            ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        Vocabulario
                      </button>
                      <button
                        onClick={() => setCorrectionType('spelling')}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                          correctionType === 'spelling'
                            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        Ortografía
                      </button>
                    </div>
                    <Textarea
                      value={correctionNote}
                      onChange={e => setCorrectionNote(e.target.value)}
                      placeholder="Corrección sugerida..."
                      className="h-20 text-sm mb-2 resize-none"
                    />
                    <Button
                      size="sm"
                      onClick={addCorrection}
                      disabled={!correctionNote.trim()}
                      className="w-full gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Añadir Corrección
                    </Button>
                  </div>
                )}
                
                {/* Lista de Correcciones Aplicadas */}
                {corrections.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
                      <Highlighter className="w-4 h-4" />
                      Correcciones Aplicadas ({corrections.length})
                    </h4>
                    {corrections.map(c => (
                      <div
                        key={c.id}
                        className={cn(
                          "bg-white p-4 rounded-xl border-l-4 shadow-sm flex items-start justify-between gap-3",
                          c.type === 'grammar' ? 'border-rose-400' : 
                          c.type === 'vocab' ? 'border-amber-400' : 
                          'border-blue-400'
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-xs font-black uppercase px-2 py-1 rounded",
                              c.type === 'grammar' ? 'bg-rose-100 text-rose-700' :
                              c.type === 'vocab' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            )}>
                              {c.type === 'grammar' ? 'Gramática' : c.type === 'vocab' ? 'Vocabulario' : 'Ortografía'}
                            </span>
                          </div>
                          <p className="text-sm">
                            <span className="font-bold text-slate-700 line-through mr-2">{c.original}</span>
                            <span className="text-slate-600">→ {c.note}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => removeCorrection(c.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
