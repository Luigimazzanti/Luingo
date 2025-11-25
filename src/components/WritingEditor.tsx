import React, { useState } from 'react';
import { Task } from '../types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Save, Send, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner@2.0.3';

interface WritingEditorProps {
  task: Task;
  initialText?: string;
  onBack: () => void;
  onSaveDraft: (text: string) => Promise<void>;
  onSubmit: (text: string) => Promise<void>;
}

export const WritingEditor: React.FC<WritingEditorProps> = ({
  task,
  initialText = '',
  onBack,
  onSaveDraft,
  onSubmit
}) => {
  const [text, setText] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minWords = task.content_data?.min_words || 0;
  const maxWords = task.content_data?.max_words || 999999;
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isUnderMin = wordCount < minWords;
  const isOverMax = wordCount > maxWords;
  const canSubmit = !isUnderMin && !isOverMax && text.trim().length > 0;

  const handleSaveDraft = async () => {
    if (text.trim().length === 0) {
      toast.error('Escribe algo antes de guardar');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveDraft(text);
      toast.success('💾 Borrador guardado');
    } catch (error) {
      console.error('Error al guardar borrador:', error);
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (isUnderMin) {
        toast.error(`Escribe al menos ${minWords} palabras`);
      } else if (isOverMax) {
        toast.error(`El máximo es ${maxWords} palabras`);
      } else {
        toast.error('Escribe algo antes de enviar');
      }
      return;
    }

    if (!window.confirm('¿Enviar esta redacción? No podrás editarla después.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(text);
      toast.success('✅ Redacción enviada');
    } catch (error) {
      console.error('Error al enviar:', error);
      toast.error('Error al enviar');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
              <div>
                <h1 className="font-black text-xl text-slate-800">{task.title}</h1>
                <p className="text-xs text-slate-500">{task.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSaving || text.trim().length === 0}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar Borrador'}
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Enviando...' : 'Entregar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 flex flex-col">
        
        {/* Prompt e Instrucciones */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-indigo-900 mb-2">Instrucción</h3>
          <p className="text-indigo-800 leading-relaxed whitespace-pre-wrap">
            {task.content_data?.writing_prompt || task.description}
          </p>
          {task.due_date && (
            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-700">
              <Clock className="w-4 h-4" />
              <span className="font-bold">Fecha límite:</span>
              <span>{new Date(task.due_date).toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</span>
            </div>
          )}
        </div>

        {/* Contador de Palabras */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Palabras escritas:</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-black text-2xl",
                isUnderMin ? "text-amber-500" : isOverMax ? "text-rose-500" : "text-emerald-500"
              )}>
                {wordCount}
              </span>
              <span className="text-slate-400 text-sm">
                {minWords > 0 && `/ ${minWords} mín.`}
              </span>
            </div>
          </div>
          {isUnderMin && minWords > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span>Faltan {minWords - wordCount} palabras</span>
            </div>
          )}
          {isOverMax && (
            <div className="mt-2 flex items-center gap-2 text-xs text-rose-600">
              <AlertCircle className="w-4 h-4" />
              <span>Superas el máximo por {wordCount - maxWords} palabras</span>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex-1 flex flex-col">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 w-full text-lg leading-relaxed font-serif resize-none border-0 focus-visible:ring-0 p-0 min-h-[400px]"
            placeholder="Escribe tu redacción aquí..."
          />
        </div>
      </div>
    </div>
  );
};
