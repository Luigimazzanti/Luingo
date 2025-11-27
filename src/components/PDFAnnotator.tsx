import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Pencil, Type, Eraser, MousePointer2, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { publicAnonKey } from '../utils/supabase/info';

// Configuración Worker
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

  // Configuración segura para el Proxy
  const fileOptions = useMemo(() => {
    if (pdfUrl.includes('onedrive-proxy') || pdfUrl.includes('drive-proxy')) {
      return {
        url: pdfUrl,
        httpHeaders: { 'Authorization': `Bearer ${publicAnonKey}` },
        withCredentials: false
      };
    }
    return pdfUrl;
  }, [pdfUrl]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Funciones Zoom
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setScale(1.0);

  // Lógica Canvas
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
      const newAnns = [...annotations, {
        id: crypto.randomUUID(), type: 'path', points: currentPath, color, page: currentPage
      }];
      setAnnotations(newAnns);
      onSave?.(newAnns);
      setCurrentPath([]);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    const coords = getCoordinates(e);

    if (tool === 'text') {
      const text = prompt("Texto:");
      if (text) {
        const newAnns = [...annotations, {
          id: crypto.randomUUID(), type: 'text' as const, content: text,
          x: coords.x, y: coords.y, color, page: currentPage
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
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
    ctx.restore();
  }, [annotations, currentPath, currentPage, scale, color]);

  return (
    <div className="flex flex-col h-full bg-slate-200 rounded-xl overflow-hidden border border-slate-300">
      {/* Toolbar */}
      <div className="bg-white p-2 border-b flex items-center justify-between gap-2 shadow-sm z-10 flex-wrap">
        {!readOnly && (
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <Button variant={tool==='move'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('move')} title="Mover"><MousePointer2 className="w-4 h-4"/></Button>
                <Button variant={tool==='pencil'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('pencil')} title="Lápiz"><Pencil className="w-4 h-4"/></Button>
                <Button variant={tool==='text'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('text')} title="Texto"><Type className="w-4 h-4"/></Button>
                <Button variant={tool==='eraser'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('eraser')} title="Borrador"><Eraser className="w-4 h-4"/></Button>
            </div>
            <div className="flex gap-1">
                {colors.map(c => (
                    <button key={c} onClick={()=>setColor(c)} className={cn("w-6 h-6 rounded-full border-2", color===c ? "border-slate-800 scale-110" : "border-white")} style={{backgroundColor: c}}/>
                ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} disabled={scale <= 0.6}><ZoomOut className="w-3.5 h-3.5"/></Button>
                <span className="text-[10px] font-bold w-8 text-center">{Math.round(scale * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} disabled={scale >= 3.0}><ZoomIn className="w-3.5 h-3.5"/></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetZoom}><RotateCcw className="w-3 h-3"/></Button>
            </div>
            <div className="flex items-center bg-slate-100 px-2 py-1 rounded-lg text-xs font-bold">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={currentPage<=1} onClick={()=>setCurrentPage(p=>p-1)}>{'<'}</Button>
                <span>{currentPage} / {numPages||'--'}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={currentPage>=numPages} onClick={()=>setCurrentPage(p=>p+1)}>{'>'}</Button>
            </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto relative bg-slate-100 flex justify-center p-8" ref={containerRef}>
        <div className="relative shadow-2xl border border-slate-300 bg-white origin-top" style={{ width: 'fit-content', height: 'fit-content' }}>
            <Document 
                file={fileOptions} 
                onLoadSuccess={onDocumentLoadSuccess} 
                loading={<div className="p-20 flex flex-col items-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mb-2"/>Cargando...</div>}
                error={<div className="p-20 text-red-500 font-bold">Error al cargar.</div>}
            >
                <Page 
                    pageNumber={currentPage} 
                    scale={scale} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false}
                    onLoadSuccess={(page) => {
                        if (canvasRef.current) {
                            canvasRef.current.width = page.width;
                            canvasRef.current.height = page.height;
                        }
                    }}
                />
            </Document>
            <canvas 
                ref={canvasRef} 
                className={cn("absolute inset-0 z-10 touch-none", tool==='move'?'pointer-events-none':'cursor-crosshair')}
                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} onClick={handleCanvasClick}
            />
        </div>
      </div>
    </div>
  );
};
