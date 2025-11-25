import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { X, Check, Trash2, Highlighter, Type } from 'lucide-react';
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
  onRemoveAnnotation: (id: string) => void;
  readOnly?: boolean;
}

export const TextAnnotator: React.FC<TextAnnotatorProps> = ({
  text,
  annotations,
  onAddAnnotation,
  onRemoveAnnotation,
  readOnly = false
}) => {
  const [selection, setSelection] = useState<{start: number, end: number, text: string} | null>(null);
  const [comment, setComment] = useState('');
  const [type, setType] = useState<Annotation['type']>('grammar');
  const containerRef = useRef<HTMLDivElement>(null);

  // ========== LÓGICA DE SELECCIÓN (ROBUSTA) ==========
  const getCaretOffset = (element: HTMLElement, range: Range) => {
    let caretOffset = 0;
    const doc = element.ownerDocument || document;
    const win = doc.defaultView || window;
    const sel = win.getSelection();
    
    if (sel && sel.rangeCount > 0) {
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      caretOffset = preCaretRange.toString().length;
    }
    
    return caretOffset;
  };

  const handleMouseUp = () => {
    if (readOnly) return;
    
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      // No limpiamos selección inmediatamente para no cerrar el panel por error si clicamos dentro de él
      // La limpieza se hace al cancelar/guardar
      return;
    }

    const range = sel.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    const start = getCaretOffset(container, range);
    const selectedText = range.toString();
    const end = start + selectedText.length;

    if (selectedText.trim().length === 0) return;

    // ✅ Solo guardamos los datos, NO calculamos coordenadas de pantalla
    setSelection({ start, end, text: selectedText });
  };

  const saveAnnotation = () => {
    if (!selection || !comment.trim()) return;
    
    onAddAnnotation({
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      start: selection.start,
      end: selection.end,
      text: selection.text,
      type,
      comment: comment.trim()
    });
    
    handleCancel();
  };

  const handleCancel = () => {
    setSelection(null);
    setComment('');
    window.getSelection()?.removeAllRanges();
  };

  // ========== RENDERIZADO DE TEXTO ==========
  const renderContent = () => {
    if (!annotations.length) {
      return <span className="whitespace-pre-wrap leading-loose">{text}</span>;
    }

    const sorted = [...annotations].sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((ann, idx) => {
      if (ann.start > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}-${idx}`} className="whitespace-pre-wrap leading-loose">
            {text.slice(lastIndex, ann.start)}
          </span>
        );
      }
      
      const colorClasses = {
        grammar: 'bg-rose-100 text-rose-900 border-b-2 border-rose-400',
        vocabulary: 'bg-amber-100 text-amber-900 border-b-2 border-amber-400',
        spelling: 'bg-blue-100 text-blue-900 border-b-2 border-blue-400',
        suggestion: 'bg-emerald-100 text-emerald-800 border-b-2 border-emerald-400'
      };

      elements.push(
        <span key={ann.id} className="relative group inline-block">
          <mark className={cn("rounded px-0.5 cursor-help transition-colors", colorClasses[ann.type])}>
            {text.slice(ann.start, ann.end)}
          </mark>
          
          {/* Tooltip Hover (Solo lectura rápida) */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">
            <div className="font-bold uppercase mb-1">{ann.type}</div>
            <p>{ann.comment}</p>
          </div>

          {!readOnly && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRemoveAnnotation(ann.id);
              }}
              className="absolute -top-2 -right-2 bg-white text-rose-500 rounded-full p-0.5 shadow-sm border border-rose-100 opacity-0 group-hover:opacity-100 transition-opacity z-40 cursor-pointer hover:scale-110"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      );

      lastIndex = ann.end;
    });

    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-end`} className="whitespace-pre-wrap leading-loose">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  return (
    <>
      {/* ========== ÁREA DE TEXTO ========== */}
      <div
        ref={containerRef}
        className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-sm min-h-[300px] whitespace-pre-wrap text-lg leading-loose font-serif text-slate-800 selection:bg-indigo-200 selection:text-indigo-900 mb-32"
        onMouseUp={handleMouseUp}
      >
        {renderContent()}
      </div>

      {/* Contador de correcciones */}
      {annotations.length > 0 && (
        <div className="mt-3 mb-6 flex items-center justify-between text-xs">
          <div className="flex gap-3">
            {[
              { type: 'grammar', label: 'Gramática', color: 'bg-rose-400' },
              { type: 'vocabulary', label: 'Vocabulario', color: 'bg-amber-400' },
              { type: 'spelling', label: 'Ortografía', color: 'bg-blue-400' },
              { type: 'suggestion', label: 'Sugerencia', color: 'bg-emerald-400' }
            ].map(({ type: t, label, color }) => {
              const count = annotations.filter(a => a.type === t).length;
              if (count === 0) return null;
              return (
                <div key={t} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${color}`}></span>
                  <span className="font-bold text-slate-600">
                    {label}: {count}
                  </span>
                </div>
              );
            })}
          </div>
          <span className="text-slate-400 font-bold">
            Total: {annotations.length} {annotations.length === 1 ? 'corrección' : 'correcciones'}
          </span>
        </div>
      )}

      {/* ========== PANEL DE CORRECCIÓN (DOCK FIJO) ========== */}
      {selection && !readOnly && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-indigo-500 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 z-[100] animate-in slide-in-from-bottom-10 duration-300">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            
            {/* Header del Dock */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Highlighter className="w-5 h-5 text-indigo-600" />
                <span className="font-black text-slate-700 uppercase text-sm">Corrigiendo:</span>
                <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono text-sm border border-indigo-100 max-w-[200px] truncate">
                  "{selection.text}"
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel} className="text-slate-400 hover:text-rose-500">
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Controles del Dock */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Selector de Tipo */}
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 shrink-0">
                <TypeBtn label="Gramática" color="rose" active={type==='grammar'} onClick={()=>setType('grammar')} />
                <TypeBtn label="Vocabulario" color="amber" active={type==='vocabulary'} onClick={()=>setType('vocabulary')} />
                <TypeBtn label="Ortografía" color="blue" active={type==='spelling'} onClick={()=>setType('spelling')} />
                <TypeBtn label="Sugerencia" color="emerald" active={type==='suggestion'} onClick={()=>setType('suggestion')} />
              </div>

              {/* Input Comentario */}
              <div className="flex-1 flex gap-2">
                <Textarea 
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  placeholder="Escribe aquí la corrección o comentario..." 
                  className="h-12 min-h-[3rem] resize-none py-2 px-4 bg-slate-50 focus:bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-500 transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      saveAnnotation();
                    } else if (e.key === 'Escape') {
                      handleCancel();
                    }
                  }}
                />
                <Button 
                  onClick={saveAnnotation} 
                  disabled={!comment.trim()} 
                  className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ========== COMPONENTE AUXILIAR: BOTÓN DE TIPO ==========
const TypeBtn = ({ label, color, active, onClick }: {
  label: string;
  color: 'rose' | 'amber' | 'blue' | 'emerald';
  active: boolean;
  onClick: () => void;
}) => {
  const colorMap = {
    rose: {
      active: 'bg-rose-50 text-rose-700 border-rose-500 shadow-sm scale-105',
      inactive: 'bg-white text-slate-500 border-slate-200 hover:border-rose-300 hover:bg-rose-50'
    },
    amber: {
      active: 'bg-amber-50 text-amber-700 border-amber-500 shadow-sm scale-105',
      inactive: 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:bg-amber-50'
    },
    blue: {
      active: 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm scale-105',
      inactive: 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
    },
    emerald: {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm scale-105',
      inactive: 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all shrink-0 flex flex-col items-center justify-center w-24 h-12",
        active ? colorMap[color].active : colorMap[color].inactive
      )}
    >
      {label}
    </button>
  );
};
