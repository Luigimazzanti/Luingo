import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Pencil, Type, Eraser, Move, Palette, MousePointer2, Loader2, Save } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

// Configuración obligatoria para que funcione sin instalación compleja
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Annotation {
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
  initialData?: Annotation[];
  readOnly?: boolean;
  onSave?: (data: Annotation[]) => void;
}

export const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({ pdfUrl, initialData = [], readOnly = false, onSave }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState(1.0);
  const [tool, setTool] = useState<'pencil' | 'text' | 'eraser' | 'move'>('move');
  const [color, setColor] = useState('#EF4444'); 
  const [annotations, setAnnotations] = useState<Annotation[]>(initialData);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'];

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly || tool !== 'pencil') return;
    setIsDrawing(true);
    const coords = getCoordinates(e);
    setCurrentPath([coords]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool !== 'pencil') return;
    const coords = getCoordinates(e);
    setCurrentPath(prev => [...prev, coords]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 0) {
      const newAnnotation: Annotation = {
        id: crypto.randomUUID(),
        type: 'path',
        points: currentPath,
        color: color,
        page: currentPage
      };
      const newAnns = [...annotations, newAnnotation];
      setAnnotations(newAnns);
      onSave?.(newAnns);
      setCurrentPath([]);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    const coords = getCoordinates(e);

    if (tool === 'text') {
      const text = prompt("Escribe texto:");
      if (text) {
        const newAnns = [...annotations, {
          id: crypto.randomUUID(), type: 'text' as const, content: text,
          x: coords.x, y: coords.y, color: color, page: currentPage
        }];
        setAnnotations(newAnns);
        onSave?.(newAnns);
        setTool('move');
      }
    } else if (tool === 'eraser') {
      const threshold = 20;
      const toDelete = annotations.find(ann => {
        if (ann.page !== currentPage) return false;
        if (ann.type === 'text') return Math.abs((ann.x||0) - coords.x) < threshold && Math.abs((ann.y||0) - coords.y) < threshold;
        if (ann.type === 'path' && ann.points) return ann.points.some(p => Math.abs(p.x - coords.x) < threshold && Math.abs(p.y - coords.y) < threshold);
        return false;
      });
      if (toDelete) {
        const newAnns = annotations.filter(a => a.id !== toDelete.id);
        setAnnotations(newAnns);
        onSave?.(newAnns);
      }
    }
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    annotations.forEach(ann => {
      if (ann.page !== currentPage) return;
      if (ann.type === 'path' && ann.points) {
        ctx.beginPath();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = 3;
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        ann.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      } else if (ann.type === 'text' && ann.content) {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = ann.color;
        ctx.fillText(ann.content, ann.x || 0, ann.y || 0);
      }
    });

    if (currentPath.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [annotations, currentPath, currentPage, scale, color]);

  return (
    <div className="flex flex-col h-full bg-slate-200 rounded-xl overflow-hidden border border-slate-300">
      <div className="bg-white p-2 border-b flex items-center justify-between gap-2 shadow-sm z-10">
        {!readOnly && (
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <Button variant={tool==='move'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('move')} title="Mover"><MousePointer2 className="w-4 h-4"/></Button>
                <Button variant={tool==='pencil'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('pencil')} title="Lápiz"><Pencil className="w-4 h-4"/></Button>
                <Button variant={tool==='text'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('text')} title="Texto"><Type className="w-4 h-4"/></Button>
                <Button variant={tool==='eraser'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('eraser')} title="Borrador"><Eraser className="w-4 h-4"/></Button>
            </div>
            <div className="h-6 w-px bg-slate-300"></div>
            <div className="flex gap-1">
                {colors.map(c => (
                    <button key={c} onClick={()=>setColor(c)} className={cn("w-6 h-6 rounded-full border-2", color===c ? "border-slate-800 scale-110" : "border-white")} style={{backgroundColor: c}}/>
                ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold">
            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={currentPage<=1} onClick={()=>setCurrentPage(p=>p-1)}>‹</Button>
            <span>{currentPage} / {numPages||'--'}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={currentPage>=numPages} onClick={()=>setCurrentPage(p=>p+1)}>›</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative bg-slate-500/10 flex justify-center p-4" ref={containerRef}>
        <div className="relative shadow-2xl border border-slate-300 bg-white">
            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="p-10 flex items-center gap-2"><Loader2 className="animate-spin"/> Cargando...</div>} error={<div className="p-10 text-red-500 font-bold">Error al cargar PDF. Verifica el enlace.</div>}>
                <Page pageNumber={currentPage} width={containerRef.current?.clientWidth ? Math.min(containerRef.current.clientWidth-40, 800) : 600} renderTextLayer={false} renderAnnotationLayer={false} 
                    onLoadSuccess={(page) => {
                        if (canvasRef.current) {
                            canvasRef.current.width = page.width;
                            canvasRef.current.height = page.height;
                            setScale(1);
                        }
                    }}
                />
            </Document>
            <canvas ref={canvasRef} className={cn("absolute inset-0 z-10 touch-none", tool==='move'?'pointer-events-none':'cursor-crosshair')}
                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} onClick={handleCanvasClick}
            />
        </div>
      </div>
    </div>
  );
};
