import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Pencil, Type, Eraser, MousePointer2, Loader2, ZoomIn, ZoomOut, RotateCcw, Save } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { publicAnonKey } from '../utils/supabase/info';

// Configuración del Worker (Vital)
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
  
  // Estado para el archivo PDF (Blob)
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'];

  // ✅ EFECTO DE CARGA MANUAL (Bypass CORS)
  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      setError(null);

      let fetchUrl = pdfUrl;
      // Si es proxy, añadimos auth
      const headers: any = {};
      if (pdfUrl.includes('onedrive-proxy') || pdfUrl.includes('drive-proxy')) {
         headers['Authorization'] = `Bearer ${publicAnonKey}`;
      }

      try {
        const res = await fetch(fetchUrl, { headers });
        if (!res.ok) throw new Error(`Error ${res.status}: No se pudo descargar el PDF`);
        
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        setPdfFile(objectUrl);
      } catch (err: any) {
        console.error("Error cargando PDF:", err);
        setError(err.message || "Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    if (pdfUrl) loadPdf();
    return () => { if (pdfFile) URL.revokeObjectURL(pdfFile); };
  }, [pdfUrl]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  // --- LÓGICA DE ZOOM ---
  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3.0));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
  const handleReset = () => setScale(1.0);

  // --- LÓGICA DE DIBUJO ---
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    // Guardamos coordenadas PURAS (sin escala) para que el zoom no rompa el dibujo
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
      const text = prompt("Escribir texto:");
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

  // Renderizado de Canvas (Sincronizado con Zoom)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale); // Aplicar zoom al contexto
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
    <div className="flex flex-col h-full bg-slate-200 rounded-xl overflow-hidden border border-slate-300 relative">
      {/* Header */}
      <div className="bg-white p-2 border-b flex items-center justify-between gap-2 shadow-sm z-20 relative">
        {!readOnly && (
          <div className="flex items-center gap-2">
             <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <Button variant={tool==='move'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('move')}><MousePointer2 className="w-4 h-4"/></Button>
                <Button variant={tool==='pencil'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('pencil')}><Pencil className="w-4 h-4"/></Button>
                <Button variant={tool==='text'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('text')}><Type className="w-4 h-4"/></Button>
                <Button variant={tool==='eraser'?'default':'ghost'} size="icon" className="h-8 w-8" onClick={()=>setTool('eraser')}><Eraser className="w-4 h-4"/></Button>
             </div>
             <div className="flex gap-1">
                {colors.map(c => (
                    <button key={c} onClick={()=>setColor(c)} className={cn("w-6 h-6 rounded-full border-2", color===c ? "border-slate-800 scale-110" : "border-white")} style={{backgroundColor: c}}/>
                ))}
             </div>
          </div>
        )}

        <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}><ZoomOut className="w-4 h-4"/></Button>
                <span className="text-xs font-bold w-10 text-center">{Math.round(scale*100)}%</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}><ZoomIn className="w-4 h-4"/></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset}><RotateCcw className="w-4 h-4"/></Button>
            </div>
            <div className="flex bg-slate-100 px-2 py-1 rounded-lg text-xs font-bold items-center gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={currentPage<=1} onClick={()=>setCurrentPage(p=>p-1)}>{'<'}</Button>
                <span>{currentPage} / {numPages || '--'}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={currentPage>=numPages} onClick={()=>setCurrentPage(p=>p+1)}>{'>'}</Button>
            </div>
        </div>
      </div>

      {/* Visor */}
      <div className="flex-1 overflow-auto bg-slate-100 relative flex justify-center p-4" ref={containerRef}>
         {loading && <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-white/80"><Loader2 className="w-10 h-10 animate-spin text-indigo-600"/><p className="text-slate-500 font-bold mt-2">Cargando PDF...</p></div>}
         
         {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-40">
                <div className="text-center max-w-md p-6 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-red-600 font-bold text-lg mb-2">No se pudo cargar el documento</p>
                    <p className="text-slate-600 text-sm">{error}</p>
                    <p className="text-slate-500 text-xs mt-4">Por favor, edita la tarea y pega de nuevo el enlace de OneDrive.</p>
                </div>
            </div>
         )}

         {pdfFile && (
            <div className="relative shadow-2xl border border-slate-300 bg-white" style={{ width: 'fit-content', height: 'fit-content' }}>
                <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess} loading={null}>
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
         )}
      </div>
    </div>
  );
};
