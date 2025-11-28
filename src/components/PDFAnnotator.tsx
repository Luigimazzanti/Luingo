import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { Save, Undo, Eraser, Pen, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

// Configurar worker CDN de forma segura
try {
  // Usamos una versión fija para evitar errores de 'undefined' en pdfjs.version
  const pdfVersion = pdfjs.version || '3.11.174';
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.js`;
} catch (e) {
  console.error("Error configuring PDF worker:", e);
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface PDFAnnotatorProps {
  bgUrl: string; // URL del PDF real
  mode: 'student' | 'teacher'; // 'student' = blue pen, 'teacher' = red pen
  onSave: (strokes: Stroke[]) => void;
}

export const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({ bgUrl, mode, onSave }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Color según rol
  const penColor = mode === 'teacher' ? '#ef4444' : '#3b82f6'; // Rojo profe, Azul alumno
  const penWidth = 3;

  // Manejadores PDF
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(err: Error) {
      console.error("Error loading PDF:", err);
      setError("No se pudo cargar el PDF. Verifica la URL o CORS.");
      setLoading(false);
  }

  // --- LÓGICA DE DIBUJO (CANVAS OVERLAY) ---
  
  // Redibujar todo cuando cambian los trazos o el zoom
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ajustar tamaño del canvas al del contenedor (que debería coincidir con el PDF)
      // Nota: Esto es tricky porque el PDF puede tardar en renderizar.
      // Lo ideal es que el canvas tenga el tamaño exacto de la página PDF renderizada.
      // Usaremos un ResizeObserver o asumiremos tamaño standard A4 * scale.
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      strokes.forEach(stroke => {
          if (stroke.points.length < 2) return;
          ctx.beginPath();
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.width; // Podríamos escalar el width con el zoom
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
              ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
      });

      // Dibujar trazo actual
      if (currentStroke && currentStroke.points.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = currentStroke.color;
          ctx.lineWidth = currentStroke.width;
          ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
          for (let i = 1; i < currentStroke.points.length; i++) {
              ctx.lineTo(currentStroke.points[i].x, currentStroke.points[i].y);
          }
          ctx.stroke();
      }
  }, [strokes, currentStroke, scale]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      
      let clientX, clientY;
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      return {
          x: (clientX - rect.left),
          y: (clientY - rect.top)
      };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (tool === 'eraser') return; // Implementar goma real es complejo, haremos "Undo" simple
      setIsDrawing(true);
      const point = getPoint(e);
      setCurrentStroke({
          points: [point],
          color: penColor,
          width: penWidth
      });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !currentStroke) return;
      e.preventDefault(); // Evitar scroll en móvil
      const point = getPoint(e);
      setCurrentStroke(prev => prev ? {
          ...prev,
          points: [...prev.points, point]
      } : null);
  };

  const handleEnd = () => {
      if (!isDrawing || !currentStroke) return;
      setIsDrawing(false);
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke(null);
  };

  const handleUndo = () => {
      setStrokes(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
      if (window.confirm('¿Borrar todo?')) {
          setStrokes([]);
      }
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-100">
        {/* Toolbar Flotante */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur shadow-xl border border-slate-200 rounded-2xl p-2 flex gap-2 items-center">
             <Button 
                variant={tool === 'pen' ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setTool('pen')}
                className={tool === 'pen' ? (mode === 'teacher' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600') : ''}
             >
                 <Pen className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" onClick={handleUndo} title="Deshacer">
                 <Undo className="w-4 h-4 text-slate-600" />
             </Button>
             <Button variant="ghost" size="icon" onClick={handleClear} title="Limpiar Página">
                 <Eraser className="w-4 h-4 text-slate-600" />
             </Button>
             <div className="w-px h-6 bg-slate-200 mx-1"></div>
             <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
                 <ZoomOut className="w-4 h-4 text-slate-600" />
             </Button>
             <span className="text-xs font-bold text-slate-500 w-12 text-center">
                 {Math.round(scale * 100)}%
             </span>
             <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(2, s + 0.1))}>
                 <ZoomIn className="w-4 h-4 text-slate-600" />
             </Button>
             <div className="w-px h-6 bg-slate-200 mx-1"></div>
             <Button 
                onClick={() => onSave(strokes)} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm"
             >
                 <Save className="w-4 h-4 mr-2" />
                 Guardar
             </Button>
        </div>

        {/* Area de Visualización */}
        <div 
            className="flex-1 overflow-auto p-8 flex justify-center items-start relative touch-none" 
            ref={containerRef}
        >
            {error ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                    <AlertCircle className="w-12 h-12 text-red-300" />
                    <p>{error}</p>
                    <p className="text-sm">Intenta con otro PDF o verifica la URL.</p>
                 </div>
            ) : (
                <div className="relative shadow-2xl border border-slate-300 bg-white" style={{ minWidth: '300px', minHeight: '400px' }}>
                    {loading && (
                         <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-20">
                             <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                             <span className="ml-3 font-bold text-slate-500">Cargando Documento...</span>
                         </div>
                    )}
                    
                    {/* Capa 1: El PDF Real */}
                    <Document
                        file={bgUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={null}
                        className="select-none"
                    >
                        <Page 
                            pageNumber={pageNumber} 
                            scale={scale}
                            renderAnnotationLayer={false}
                            renderTextLayer={false} // Desactivar para mejor performance en dibujo
                            canvasRef={(ref) => {
                                // Truco: Ajustar el canvas de dibujo al tamaño del canvas del PDF
                                if (ref && canvasRef.current) {
                                    canvasRef.current.width = ref.width;
                                    canvasRef.current.height = ref.height;
                                    canvasRef.current.style.width = `${ref.width}px`;
                                    canvasRef.current.style.height = `${ref.height}px`;
                                }
                            }}
                        />
                    </Document>

                    {/* Capa 2: Canvas de Dibujo Transparente */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 z-10 cursor-crosshair"
                        onMouseDown={handleStart}
                        onMouseMove={handleMove}
                        onMouseUp={handleEnd}
                        onMouseLeave={handleEnd}
                        onTouchStart={handleStart}
                        onTouchMove={handleMove}
                        onTouchEnd={handleEnd}
                    />
                </div>
            )}
        </div>
    </div>
  );
};
