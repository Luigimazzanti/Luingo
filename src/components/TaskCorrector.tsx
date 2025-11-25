import React, { useState, useRef, useEffect } from 'react';
import { Submission, Task, WritingCorrection, CorrectionType } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Plus, X, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { gradeSubmission } from '../lib/moodle';
import { toast } from 'sonner@2.0.3';

interface TaskCorrectorProps {
  submission: Submission;
  task: Task;
  onBack: () => void;
  onSave: () => Promise<void>;
}

const CORRECTION_TYPES: { value: CorrectionType; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { value: 'grammar', label: 'Gramática', color: 'text-rose-700', bgColor: 'bg-rose-100', borderColor: 'border-rose-500' },
  { value: 'vocabulary', label: 'Vocabulario', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-500' },
  { value: 'spelling', label: 'Ortografía', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-500' },
  { value: 'style', label: 'Estilo', color: 'text-purple-700', bgColor: 'bg-purple-100', borderColor: 'border-purple-500' },
  { value: 'coherence', label: 'Coherencia', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-500' },
];

export const TaskCorrector: React.FC<TaskCorrectorProps> = ({
  submission,
  task,
  onBack,
  onSave
}) => {
  const [corrections, setCorrections] = useState<WritingCorrection[]>(submission.corrections || []);
  const [selectedText, setSelectedText] = useState<{ start: number; end: number; text: string } | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [correctionType, setCorrectionType] = useState<CorrectionType>('grammar');
  const [correctionText, setCorrectionText] = useState('');
  const [correctionExplanation, setCorrectionExplanation] = useState('');
  const [grade, setGrade] = useState(submission.grade?.toString() || '0');
  const [feedback, setFeedback] = useState(submission.teacher_feedback || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const textRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const textContent = submission.text_content || '';

  // Cerrar popover al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPopover(false);
        setSelectedText(null);
      }
    };

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  // Manejar selección de texto
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (selectedText.length === 0) {
      setShowPopover(false);
      return;
    }

    // Calcular posición relativa al documento completo
    const fullText = textRef.current?.textContent || '';
    const beforeSelection = range.startContainer.textContent?.substring(0, range.startOffset) || '';
    const start = fullText.indexOf(selectedText, beforeSelection.length);
    const end = start + selectedText.length;

    if (start === -1) return;

    // Posición del popover
    const rect = range.getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 5
    });

    setSelectedText({ start, end, text: selectedText });
    setShowPopover(true);
    setCorrectionText('');
    setCorrectionExplanation('');
  };

  // Añadir corrección
  const handleAddCorrection = () => {
    if (!selectedText || !correctionText.trim()) {
      toast.error('Ingresa una corrección');
      return;
    }

    const newCorrection: WritingCorrection = {
      type: correctionType,
      start: selectedText.start,
      end: selectedText.end,
      original: selectedText.text,
      correction: correctionText.trim(),
      explanation: correctionExplanation.trim() || undefined
    };

    setCorrections([...corrections, newCorrection]);
    setShowPopover(false);
    setSelectedText(null);
    window.getSelection()?.removeAllRanges();
    toast.success('Corrección añadida');
  };

  // Eliminar corrección
  const handleDeleteCorrection = (index: number) => {
    setCorrections(corrections.filter((_, i) => i !== index));
    toast.success('Corrección eliminada');
  };

  // Renderizar texto con resaltado
  const renderHighlightedText = () => {
    if (!textContent) {
      return <p className="text-slate-400 italic">Sin contenido</p>;
    }

    let lastIndex = 0;
    const elements: React.ReactNode[] = [];
    
    // Ordenar correcciones por posición
    const sorted = [...corrections].sort((a, b) => a.start - b.start);

    sorted.forEach((corr, i) => {
      // Texto antes del error
      if (corr.start > lastIndex) {
        elements.push(
          <span key={`text-${i}`}>
            {textContent.slice(lastIndex, corr.start)}
          </span>
        );
      }
      
      // El error resaltado
      const typeConfig = CORRECTION_TYPES.find(t => t.value === corr.type) || CORRECTION_TYPES[0];
      elements.push(
        <span 
          key={`corr-${i}`} 
          className={cn(
            "px-1 rounded cursor-help border-b-2 transition-all hover:scale-105",
            typeConfig.bgColor,
            typeConfig.borderColor
          )}
          title={`${typeConfig.label}: ${corr.correction}${corr.explanation ? ' - ' + corr.explanation : ''}`}
        >
          {textContent.slice(corr.start, corr.end)}
        </span>
      );
      lastIndex = corr.end;
    });
    
    // Texto final
    if (lastIndex < textContent.length) {
      elements.push(
        <span key="text-end">
          {textContent.slice(lastIndex)}
        </span>
      );
    }

    return (
      <div 
        ref={textRef}
        onMouseUp={handleTextSelection}
        className="whitespace-pre-wrap text-lg leading-relaxed font-serif select-text"
      >
        {elements}
      </div>
    );
  };

  // Guardar correcciones y calificación
  const handleSave = async () => {
    const gradeNum = parseFloat(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
      toast.error('Ingresa una calificación válida entre 0 y 10');
      return;
    }

    setIsSaving(true);
    try {
      toast.loading('Guardando corrección...');

      // Construir payload completo
      const payload = {
        ...submission.original_payload,
        taskId: submission.task_id,
        taskTitle: submission.task_title,
        studentId: submission.student_id,
        studentName: submission.student_name,
        text_content: textContent,
        word_count: submission.word_count,
        corrections: corrections,
        timestamp: submission.submitted_at
      };

      const postId = submission.postId || submission.id.replace('post-', '');
      await gradeSubmission(postId, gradeNum, feedback, payload);

      toast.dismiss();
      toast.success('Corrección guardada correctamente');
      
      await onSave();
      onBack();
    } catch (error) {
      console.error('Error al guardar corrección:', error);
      toast.dismiss();
      toast.error('Error al guardar la corrección');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
              <div>
                <h1 className="font-black text-xl text-slate-800">Corrigiendo: {task.title}</h1>
                <p className="text-xs text-slate-500">Estudiante: {submission.student_name}</p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? 'Guardando...' : 'Guardar Corrección'}
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel Izquierdo - Lista de Correcciones */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Instrucción */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
              <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Cómo usar
              </h3>
              <p className="text-sm text-indigo-700 leading-relaxed">
                Selecciona cualquier texto en la redacción para añadir una corrección. 
                Aparecerá un menú para elegir el tipo de error y la corrección sugerida.
              </p>
            </div>

            {/* Lista de Correcciones */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span>Correcciones ({corrections.length})</span>
              </h3>

              {corrections.length === 0 ? (
                <p className="text-center text-slate-400 py-6 text-sm">
                  Aún no hay correcciones. Selecciona texto para empezar.
                </p>
              ) : (
                <div className="space-y-3">
                  {corrections.map((corr, index) => {
                    const typeConfig = CORRECTION_TYPES.find(t => t.value === corr.type) || CORRECTION_TYPES[0];
                    return (
                      <div
                        key={index}
                        className={cn(
                          "p-3 rounded-lg border-l-4",
                          typeConfig.bgColor,
                          typeConfig.borderColor
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={cn("text-xs font-bold uppercase", typeConfig.color)}>
                            {typeConfig.label}
                          </span>
                          <button
                            onClick={() => handleDeleteCorrection(index)}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-slate-500">Original:</span>
                            <span className="ml-2 font-medium text-slate-700 line-through">
                              {corr.original}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Corrección:</span>
                            <span className="ml-2 font-medium text-emerald-700">
                              {corr.correction}
                            </span>
                          </div>
                          {corr.explanation && (
                            <div className="text-xs text-slate-600 italic mt-1">
                              {corr.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Calificación */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">Calificación</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nota (0-10)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="text-center text-2xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Comentario General
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Escribe un comentario general sobre la redacción..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho - Texto del Estudiante */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 text-lg">Redacción del Estudiante</h2>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>{submission.word_count || 0} palabras</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>{corrections.length} correcciones</span>
                  </div>
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                {renderHighlightedText()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popover de Corrección */}
      {showPopover && selectedText && (
        <div
          ref={popoverRef}
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-80"
          style={{
            left: `${popoverPosition.x}px`,
            top: `${popoverPosition.y}px`,
            maxWidth: 'calc(100vw - 32px)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-800">Añadir Corrección</h4>
            <button
              onClick={() => setShowPopover(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Texto seleccionado
              </label>
              <div className="text-sm bg-slate-50 p-2 rounded border border-slate-200 font-medium">
                "{selectedText.text}"
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tipo de error
              </label>
              <Select value={correctionType} onValueChange={(v) => setCorrectionType(v as CorrectionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CORRECTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Corrección *
              </label>
              <Input
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                placeholder="Escribe la forma correcta..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Explicación (opcional)
              </label>
              <Textarea
                value={correctionExplanation}
                onChange={(e) => setCorrectionExplanation(e.target.value)}
                placeholder="Explica por qué es incorrecto..."
                className="min-h-[60px]"
              />
            </div>

            <Button
              onClick={handleAddCorrection}
              className="w-full gap-2"
              disabled={!correctionText.trim()}
            >
              <Plus className="w-4 h-4" />
              Añadir Corrección
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
