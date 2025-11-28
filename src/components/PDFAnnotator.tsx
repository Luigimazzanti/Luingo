import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Pencil, Type, Eraser, MousePointer2, Loader2, ZoomIn, ZoomOut, Save } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

// Worker Config
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface Annotation {
  id: string;
  type: 'path' | 'text';
  content?: string;
  points?: { x: number, y: number }[];
  color: string;
  x?: number;
  y?: number;
  page: number;
}

interface PDFAnnotatorProps {
  pdfUrl: string;
  initialData?: Annotation[];      // Capa Alumno (fondo)
  teacherData?: Annotation[];      // Capa Profesor (correcciones)
  readOnly?: boolean;              // Si true, nadie edita nada
  isTeacherMode?: boolean;         // ✅ NUEVO: Si true, edita teacherData en rojo
  onSave?: (data: Annotation[]) => void;
}

export const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({ pdfUrl, initialData = [], teacherData = [], readOnly = false, isTeacherMode = false, onSave }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState(1.0);
  
  // Herramientas: 'select' (mover), 'pencil', 'text', 'eraser'
  const [tool, setTool] = useState<'select' | 'pencil' | 'text' | 'eraser'>('select');
  
  // ✅ Si es profesor, forzamos rojo. Si es alumno, color seleccionable
  const [color, setColor] = useState(isTeacherMode ? '#EF4444' : '#000000'); 
  
  // ✅ Datos activos: si soy profe edito teacherData, si soy alumno edito initialData
  const [activeAnnotations, setActiveAnnotations] = useState<Annotation[]>(isTeacherMode ? teacherData : initialData);
  
  // Estados de interacción
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // ✅ Colores para estudiantes (profesor siempre usa rojo)
  const studentColors = ['#000000', '#2563EB', '#10B981', '#F59E0B'];

  // ✅ Actualizar datos activos si cambian las props
  useEffect(() => { 
    setActiveAnnotations(isTeacherMode ? teacherData : initialData); 
  }, [teacherData, initialData, isTeacherMode]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // --- COORDENADAS (Ajustadas al Zoom) ---
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (cx - rect.left) / scale,
      y: (cy - rect.top) / scale
    };
  };

  // --- HIT DETECTION (Para seleccionar) ---
  const findAnnotationAt = (x: number, y: number) => {
    // Buscamos en las anotaciones activas (las que estoy editando)
    for (let i = activeAnnotations.length - 1; i >= 0; i--) {
      const ann = activeAnnotations[i];
      if (ann.page !== currentPage) continue;
      
      if (ann.type === 'text') {
        // Caja aproximada de texto
        if (Math.abs((ann.x || 0) - x) < 50 && Math.abs((ann.y || 0) - y) < 20) return ann;
      } else if (ann.type === 'path' && ann.points) {
        // Distancia a cualquier punto del trazo
        const hit = ann.points.some(p => Math.hypot(p.x - x, p.y - y) < 15);
        if (hit) return ann;
      }
    }
    return null;
  };

  // --- HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    const { x, y } = getCoords(e);

    if (tool === 'select') {
        const target = findAnnotationAt(x, y);
        if (target) {
            setSelectedId(target.id);
            setIsDragging(true);
            setDragStart({ x, y });
        } else {
            setSelectedId(null);
        }
    } else if (tool === 'pencil') {
        setIsDrawing(true);
        setCurrentPath([{ x, y }]);
    } else if (tool === 'text') {
        const text = prompt("Texto:");
        if (text) {
            const newAnn: Annotation = {
                id: crypto.randomUUID(), type: 'text', content: text,
                x, y, color, page: currentPage
            };
            const next = [...activeAnnotations, newAnn];
            setActiveAnnotations(next);
            onSave?.(next);
            setTool('select'); // Auto-cambiar a select tras escribir
        }
    } else if (tool === 'eraser') {
        const target = findAnnotationAt(x, y);
        if (target) {
            const next = activeAnnotations.filter(a => a.id !== target.id);
            setActiveAnnotations(next);
            onSave?.(next);
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    const { x, y } = getCoords(e);

    if (tool === 'select' && isDragging && selectedId && dragStart) {
        const dx = x - dragStart.x;
        const dy = y - dragStart.y;
        
        setActiveAnnotations(prev => prev.map(ann => {
            if (ann.id !== selectedId) return ann;
            // Mover anotación
            if (ann.type === 'text') {
                return { ...ann, x: (ann.x || 0) + dx, y: (ann.y || 0) + dy };
            } else if (ann.type === 'path' && ann.points) {
                return { ...ann, points: ann.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
            }
            return ann;
        }));
        setDragStart({ x, y }); // Reset base
    } else if (tool === 'pencil' && isDrawing) {
        setCurrentPath(prev => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
        onSave?.(activeAnnotations); // Guardar tras mover
    }
    if (isDrawing) {
        setIsDrawing(false);
        if (currentPath.length > 2) { // Mínimo 3 puntos para trazo válido
            const newAnn: Annotation = {
                id: crypto.randomUUID(), type: 'path', points: currentPath, color, page: currentPage
            };
            const next = [...activeAnnotations, newAnn];
            setActiveAnnotations(next);
            onSave?.(next);
        }
        setCurrentPath([]);
    }
  };

  // --- RENDER CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Helper para dibujar una anotación
    const drawAnn = (ann: Annotation, isBackground: boolean = false) => {
        if (ann.page !== currentPage) return;
        
        // Estilo especial si está seleccionada (solo para activeAnnotations)
        const isSelected = !isBackground && ann.id === selectedId;
        const drawColor = isSelected ? '#2563EB' : ann.color;
        const opacity = isBackground ? 0.5 : 1.0; // Fondo más transparente

        if (ann.type === 'path' && ann.points) {
            ctx.beginPath();
            ctx.globalAlpha = opacity;
            ctx.strokeStyle = drawColor;
            ctx.lineWidth = 3;
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            ann.points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            
            // Borde de selección
            if (isSelected) {
                ctx.shadowColor = 'rgba(37, 99, 235, 0.5)';
                ctx.shadowBlur = 8;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        } else if (ann.type === 'text' && ann.content) {
            ctx.globalAlpha = opacity;
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = drawColor;
            ctx.fillText(ann.content, ann.x || 0, ann.y || 0);
            ctx.globalAlpha = 1.0;
            
            if (isSelected) {
                const width = ctx.measureText(ann.content).width;
                ctx.strokeStyle = '#2563EB';
                ctx.lineWidth = 2;
                ctx.strokeRect((ann.x || 0) - 2, (ann.y || 0) - 16, width + 4, 20);
            }
        }
    };

    // ✅ LÓGICA DE CAPAS:
    // 1. Si soy profesor → Ver anotaciones del alumno de fondo
    if (isTeacherMode) {
        initialData.forEach(ann => drawAnn(ann, true)); // Capa de fondo (alumno)
    }

    // 2. Dibujar mis anotaciones activas (editables)
    activeAnnotations.forEach(ann => drawAnn(ann, false));

    // 3. Dibujar trazo actual
    if (currentPath.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        currentPath.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
    }

    ctx.restore();
  }, [annotations, teacherData, currentPath, currentPage, scale, color, selectedId]);

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-xl overflow-hidden border border-slate-300 relative">
      {/* TOOLBAR */}
      <div className="bg-white p-2 border-b flex items-center justify-between gap-2 shadow-sm z-20 flex-wrap">
        <div className="flex items-center gap-2">
            {/* Herramientas */}
            {!readOnly && (
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <Button variant={tool==='select'?'default':'ghost'} size="icon" onClick={()=>setTool('select')} title="Seleccionar/Mover"><MousePointer2 className="w-4 h-4"/></Button>
                    <Button variant={tool==='pencil'?'default':'ghost'} size="icon" onClick={()=>setTool('pencil')} title="Lápiz"><Pencil className="w-4 h-4"/></Button>
                    <Button variant={tool==='text'?'default':'ghost'} size="icon" onClick={()=>setTool('text')} title="Texto"><Type className="w-4 h-4"/></Button>
                    <Button variant={tool==='eraser'?'default':'ghost'} size="icon" onClick={()=>setTool('eraser')} title="Borrador"><Eraser className="w-4 h-4"/></Button>
                </div>
            )}
            {!readOnly && !isTeacherMode && (
                <>
                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                    {/* Colores para estudiantes */}
                    <div className="flex gap-1">
                        {studentColors.map(c => <button key={c} onClick={()=>setColor(c)} className={cn("w-5 h-5 rounded-full border-2 transition-transform", color===c?"scale-125 border-slate-800":"border-slate-300")} style={{backgroundColor: c}}/>)}
                    </div>
                </>
            )}
            {/* ✅ Badge de modo profesor */}
            {isTeacherMode && !readOnly && (
                <>
                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                    <div className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1.5">
                        <Pencil className="w-3 h-3"/> Modo Corrección
                    </div>
                </>
            )}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}><ZoomOut className="w-4 h-4"/></Button>
             <span className="text-xs font-bold min-w-[40px] text-center">{Math.round(scale*100)}%</span>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.min(3, s + 0.1))}><ZoomIn className="w-4 h-4"/></Button>
             <div className="h-4 w-px bg-slate-300 mx-1"></div>
             <div className="flex items-center text-xs bg-slate-100 px-2 py-1 rounded font-medium">
                <button disabled={currentPage<=1} onClick={()=>setCurrentPage(p=>p-1)} className="px-1 hover:text-indigo-600 disabled:opacity-30">◀</button>
                <span className="mx-2">{currentPage} / {numPages||'--'}</span>
                <button disabled={currentPage>=numPages} onClick={()=>setCurrentPage(p=>p+1)} className="px-1 hover:text-indigo-600 disabled:opacity-30">▶</button>
             </div>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 overflow-auto bg-slate-200 flex justify-center p-8 relative touch-none" ref={containerRef}>
          {pdfUrl ? (
            <div className="relative shadow-xl border border-slate-300 bg-white" style={{ width: 'fit-content', height: 'fit-content' }}>
                <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="p-20 flex flex-col items-center text-slate-400"><Loader2 className="animate-spin mb-2"/>Cargando PDF...</div>}>
                    <Page pageNumber={currentPage} scale={scale} renderTextLayer={false} renderAnnotationLayer={false}
                        onLoadSuccess={(page) => {
                            if(canvasRef.current) {
                                canvasRef.current.width = page.width;
                                canvasRef.current.height = page.height;
                            }
                        }}
                    />
                </Document>
                <canvas 
                    ref={canvasRef}
                    className={cn("absolute inset-0 z-10", tool==='hand' ? 'cursor-grab' : 'cursor-crosshair')}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                />
            </div>
          ) : <div className="m-auto text-slate-400 font-bold">No hay documento cargado</div>}
      </div>
    </div>
  );
};
