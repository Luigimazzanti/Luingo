import React, { useState } from 'react';
import { ArrowLeft, Send, Save } from 'lucide-react';
import { Button } from './ui/button';
import { PDFAnnotator } from './PDFAnnotator';
import { toast } from 'sonner@2.0.3';

interface DocumentEditorProps {
  task: any;
  initialData?: any[];
  onBack: () => void;
  onSaveDraft: (annotations: any[]) => Promise<void>;
  onSubmit: (annotations: any[]) => Promise<void>;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  task,
  initialData = [],
  onBack,
  onSaveDraft,
  onSubmit
}) => {
  const [annotations, setAnnotations] = useState<any[]>(initialData);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await onSaveDraft(annotations);
      toast.success("💾 Borrador guardado");
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (annotations.length === 0) {
      toast.error("⚠️ Debes hacer al menos una anotación en el documento");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(annotations);
      toast.success("✅ ¡Tarea enviada con éxito!");
    } catch (error) {
      toast.error("Error al enviar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-amber-600 p-4 text-white flex justify-between items-center shadow-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="text-white hover:bg-white/20 hover:text-white p-2 rounded-full h-auto"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="font-bold text-lg leading-tight">{task.title}</h1>
            <p className="text-xs text-amber-200 font-medium uppercase tracking-wider">Documento PDF</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            onClick={handleSaveDraft} 
            disabled={saving || submitting} 
            className="text-white/90 hover:text-white hover:bg-white/20 hidden md:flex"
          >
            <Save className="w-4 h-4 mr-2"/> 
            {saving ? 'Guardando...' : 'Guardar avance'}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={saving || submitting} 
            className="bg-white text-amber-600 hover:bg-amber-50 font-bold shadow-lg border-2 border-transparent hover:border-amber-100 transition-all"
          >
            <Send className="w-4 h-4 mr-2"/> 
            {submitting ? 'Enviando...' : 'Entregar Tarea'}
          </Button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 overflow-hidden bg-slate-50 p-4">
        <PDFAnnotator 
          pdfUrl={task.content_data.pdfUrl}
          initialData={annotations}
          onSave={setAnnotations}
        />
      </div>
    </div>
  );
};
