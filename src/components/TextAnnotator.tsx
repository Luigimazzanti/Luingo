import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { X, Check, Trash2, Highlighter, PenTool, MessageSquare, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export interface Annotation {
  id: string;
  start: number;
  end: number;
  text: string;
  type: 'grammar' | 'vocabulary' | 'spelling' | 'suggestion';
  comment: string;
}

interface TextAnnotatorProps {
  text: string;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation?: (annotation: Annotation) => void;
  onRemoveAnnotation: (id: string) => void;
  readOnly?: boolean;
}

export const TextAnnotator: React.FC<TextAnnotatorProps> = ({
  text,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onRemoveAnnotation,
  readOnly = false
}) => {
  // Estados de Selección
  const [pendingSelection, setPendingSelection] = useState<{start: number, end: number, text: string} | null>(null);
  
  // Estados de Edición/Visor
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Formulario
  const [comment, setComment] = useState('');
  const [type, setType] = useState<Annotation['type']>('grammar');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. ALGORITMO DE POSICIÓN (Tree Walker)
  const getAbsoluteOffset = (root: Node, node: Node, offset: number): number => {
    if (node === root) return offset;
    let totalOffset = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      if (walker.currentNode === node) return totalOffset + offset;
      totalOffset += walker.currentNode.textContent?.length || 0;
    }
    return -1;
  };

  // 2. DETECTOR DE SELECCIÓN
  const handleSelectionChange = useCallback(() => {
    // Si estamos editando o viendo algo, ignorar selecciones nuevas para no cerrar el panel
    if (activeAnnotation || isCreating) return;
    
    const sel = window.getSelection();
    const container = containerRef.current;
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !container) return;
    if (!container.contains(sel.anchorNode)) {
      setPendingSelection(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const start = getAbsoluteOffset(container, range.startContainer, range.startOffset);
    const end = getAbsoluteOffset(container, range.endContainer, range.endOffset);
    if (start === -1 || end === -1) return;
    const s = Math.min(start, end);
    const e = Math.max(start, end);
    const txt = text.slice(s, e);
    if (txt.trim().length > 0) {
      setPendingSelection({ start: s, end: e, text: txt });
    }
  }, [text, activeAnnotation, isCreating]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  // 3. ACCIONES DEL USUARIO
  
  // A) Empezar a crear una corrección nueva
  const startCreation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCreating(true);
    setComment('');
    setType('grammar');
  };

  // B) Abrir una existente (para Leer o Editar)
  const openAnnotation = (ann: Annotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAnnotation(ann);
    setComment(ann.comment);
    setType(ann.type);
    setPendingSelection(null); // Limpiar selección de texto si hubiera
    window.getSelection()?.removeAllRanges();
  };

  // C) Guardar (Nueva o Edición)
  const save = () => {
    if (isCreating && pendingSelection) {
      // NUEVA
      onAddAnnotation({
        id: Date.now().toString(),
        start: pendingSelection.start,
        end: pendingSelection.end,
        text: pendingSelection.text,
        type,
        comment
      });
    } else if (activeAnnotation && !readOnly && onUpdateAnnotation) {
      // EDITAR EXISTENTE
      onUpdateAnnotation({
        ...activeAnnotation,
        type,
        comment
      });
    }
    closeAll();
  };

  const closeAll = () => {
    setIsCreating(false);
    setActiveAnnotation(null);
    setPendingSelection(null);
    setComment('');
    window.getSelection()?.removeAllRanges(); // <--- ESTO DESTAPA EL COLOR
  };

  // 4. RENDERIZADO
  const renderContent = () => {
    if (!annotations.length) return text;
    const sorted = [...annotations].sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((ann) => {
      if (ann.start > lastIndex) {
        elements.push(<span key={`txt-${lastIndex}`}>{text.slice(lastIndex, ann.start)}</span>);
      }
      
      const colors = {
        grammar: 'bg-rose-100 text-rose-900 border-b-2 border-rose-400',
        vocabulary: 'bg-amber-100 text-amber-900 border-b-2 border-amber-400',
        spelling: 'bg-blue-100 text-blue-900 border-b-2 border-blue-400',
        suggestion: 'bg-emerald-100 text-emerald-900 border-b-2 border-emerald-400'
      };

      elements.push(
        <span 
          key={ann.id} 
          className="relative group inline"
          onClick={(e) => openAnnotation(ann, e)} // <--- CLIC PARA ABRIR
        >
          <mark className={cn("rounded px-0.5 cursor-pointer mx-0.5", colors[ann.type])}>
            {text.slice(ann.start, ann.end)}
          </mark>
        </span>
      );
      lastIndex = ann.end;
    });

    if (lastIndex < text.length) {
      elements.push(<span key="txt-end">{text.slice(lastIndex)}</span>);
    }
    
    return elements;
  };

  return (
    <>
      {/* 🎨 LEYENDA DE COLORES */}
      {annotations.length > 0 && (
        <div className="mb-3 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="w-4 h-4" />
            <span className="font-bold">Leyenda:</span>
          </div>
          <LegendItem label="Gramática" color="rose" />
          <LegendItem label="Vocabulario" color="amber" />
          <LegendItem label="Ortografía" color="blue" />
          <LegendItem label="Sugerencia" color="emerald" />
        </div>
      )}

      <div 
        ref={containerRef} 
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm whitespace-pre-wrap break-words text-lg leading-relaxed font-serif text-slate-800 pb-32"
      >
        {renderContent()}
      </div>

      {/* BOTÓN FLOTANTE (Solo crear) */}
      {pendingSelection && !isCreating && !activeAnnotation && !readOnly && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-[60] px-4 animate-in slide-in-from-bottom-4">
          <Button 
            onClick={startCreation}
            className="bg-slate-900 text-white shadow-2xl rounded-full px-6 h-14 font-bold flex items-center gap-2 border-2 border-slate-700"
          >
            <Highlighter className="w-5 h-5 text-amber-400" />
            CORREGIR SELECCIÓN
          </Button>
        </div>
      )}

      {/* PANEL INFERIOR (DOCK) - Sirve para Crear, Editar y Leer */}
      {(isCreating || activeAnnotation) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-indigo-500 shadow-[0_-10px_50px_rgba(0,0,0,0.2)] p-4 z-[100] animate-in slide-in-from-bottom-full duration-300 pb-8">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            
            {/* Cabecera del Panel */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                {readOnly ? <MessageSquare className="w-4 h-4"/> : <PenTool className="w-4 h-4"/>}
                {readOnly ? "Comentario del Profesor" : isCreating ? "Nueva Corrección" : "Editando Corrección"}
              </span>
              
              {/* Botón Borrar (Solo si editamos y no es readOnly) */}
              {activeAnnotation && !readOnly && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    onRemoveAnnotation(activeAnnotation.id);
                    closeAll();
                  }}
                  className="text-rose-500 hover:bg-rose-50 mr-auto ml-2 h-8 px-2"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Borrar
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={closeAll}
                className="h-8 w-8 text-slate-400"
              >
                <X className="w-5 h-5"/>
              </Button>
            </div>
            
            {/* Selector de Tipo (Solo si no es readOnly) */}
            {!readOnly && (
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <TypeBtn label="Gramática" color="rose" active={type==='grammar'} onClick={()=>setType('grammar')} />
                <TypeBtn label="Vocab" color="amber" active={type==='vocabulary'} onClick={()=>setType('vocabulary')} />
                <TypeBtn label="Ortografía" color="blue" active={type==='spelling'} onClick={()=>setType('spelling')} />
                <TypeBtn label="Sugerencia" color="emerald" active={type==='suggestion'} onClick={()=>setType('suggestion')} />
              </div>
            )}

            {/* Área de Comentario (Editable o Solo Lectura) */}
            <div className="flex gap-2">
              {readOnly ? (
                <div className={`flex-1 p-4 rounded-xl border-l-4 bg-slate-50 text-slate-700 font-medium ${
                  activeAnnotation?.type === 'grammar' ? 'border-rose-400' : 
                  activeAnnotation?.type === 'vocabulary' ? 'border-amber-400' : 
                  activeAnnotation?.type === 'spelling' ? 'border-blue-400' :
                  'border-emerald-400'
                }`}>
                  {activeAnnotation?.comment}
                </div>
              ) : (
                <>
                  <Textarea 
                    value={comment} 
                    onChange={e => setComment(e.target.value)} 
                    placeholder="Escribe tu comentario..." 
                    className="h-14 min-h-[3rem] resize-none bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-indigo-500 text-base"
                    autoFocus
                  />
                  <Button 
                    onClick={save} 
                    disabled={!comment.trim()} 
                    className="h-14 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shrink-0"
                  >
                    <Check className="w-6 h-6" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const TypeBtn = ({ label, color, active, onClick }: {
  label: string;
  color: 'rose' | 'amber' | 'blue' | 'emerald';
  active: boolean;
  onClick: () => void;
}) => {
  const colorMap = {
    rose: {
      active: 'bg-rose-50 text-rose-700 border-rose-500',
      inactive: 'bg-white text-slate-500 border-slate-200'
    },
    amber: {
      active: 'bg-amber-50 text-amber-700 border-amber-500',
      inactive: 'bg-white text-slate-500 border-slate-200'
    },
    blue: {
      active: 'bg-blue-50 text-blue-700 border-blue-500',
      inactive: 'bg-white text-slate-500 border-slate-200'
    },
    emerald: {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-500',
      inactive: 'bg-white text-slate-500 border-slate-200'
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all shrink-0 flex-1 whitespace-nowrap",
        active ? colorMap[color].active : colorMap[color].inactive
      )}
    >
      {label}
    </button>
  );
};

const LegendItem = ({ label, color }: {
  label: string;
  color: 'rose' | 'amber' | 'blue' | 'emerald';
}) => {
  const colorMap = {
    rose: 'bg-rose-100 text-rose-900 border-b-2 border-rose-400',
    amber: 'bg-amber-100 text-amber-900 border-b-2 border-amber-400',
    blue: 'bg-blue-100 text-blue-900 border-b-2 border-blue-400',
    emerald: 'bg-emerald-100 text-emerald-900 border-b-2 border-emerald-400'
  };

  return (
    <div className="flex items-center gap-1.5">
      <mark className={cn("rounded px-0.5 mx-0.5", colorMap[color])}>
        {label}
      </mark>
    </div>
  );
};