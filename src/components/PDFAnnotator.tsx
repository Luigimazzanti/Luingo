import React, { useRef, useState, useEffect } from 'react';
import { DrawingStroke } from '../types';
import { Button } from './ui/button';
import { Pencil, Eraser, Highlighter, Undo, Save, ZoomIn, ZoomOut, MousePointer2 } from 'lucide-react';

interface PDFAnnotatorProps {
  bgUrl: string; // URL del PDF o Imagen de fondo
  initialAnnotations?: DrawingStroke[];
  initialCorrections?: DrawingStroke[];
  readOnly?: boolean;
  mode?: 'student' | 'teacher'; // 'student' draws blue/pencil, 'teacher' draws red
  onSave: (strokes: DrawingStroke[]) => void;
}

export const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({ 
  bgUrl, 
  initialAnnotations = [], 
  initialCorrections = [],
  readOnly = false,
  mode = 'student',
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estado del Canvas
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'highlight' | 'eraser' | 'move'>('pen');
  const [scale, setScale] = useState(1);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  
  // Historial de Trazos (Local State)
  // Si es Teacher, editamos corrections. Si es Student, annotations.
  const [myStrokes, setMyStrokes] = useState<DrawingStroke[]>(mode === 'student' ? initialAnnotations : initialCorrections);
  
  // Configuración de herramientas
  const getStrokeStyle = (toolType: string) => {
    if (toolType === 'eraser') return { color: '#ffffff', width: 20, composite: 'destination-out' };
    if (toolType === 'highlight') return { color: mode === 'teacher' ? 'rgba(251, 113, 133, 0.3)' : 'rgba(253, 224, 71, 0.3)', width: 20, composite: 'source-over' };
    // Pen
    return { 
        color: mode === 'teacher' ? '#ef4444' : '#2563eb', // Teacher = Red, Student = Blue
        width: 3, 
        composite: 'source-over' 
    };
  };

  // --- RENDERIZADO DEL CANVAS ---
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Limpiar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 2. Dibujar capa base (Student Annotations) si soy profesor
    if (mode === 'teacher') {
         initialAnnotations.forEach(stroke => drawStroke(ctx, stroke));
    }

    // 3. Dibujar mis trazos (Lo que estoy editando)
    myStrokes.forEach(stroke => drawStroke(ctx, stroke));

    // 4. Dibujar trazo actual (mientras arrastro)
    if (currentPath.length > 0) {
       const style = getStrokeStyle(tool);
       ctx.beginPath();
       ctx.strokeStyle = style.color;
       ctx.lineWidth = style.width;
       // @ts-ignore
       ctx.globalCompositeOperation = style.composite;
       
       ctx.moveTo(currentPath[0].x, currentPath[0].y);
       for (let i = 1; i < currentPath.length; i++) {
         ctx.lineTo(currentPath[i].x, currentPath[i].y);
       }
       ctx.stroke();
       ctx.globalCompositeOperation = 'source-over';
    }
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length < 1) return;
    
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    // Simular transparencia para highlight si viene del JSON
    if (stroke.type === 'highlight' && !stroke.color.startsWith('rgba')) {
        ctx.globalAlpha = 0.3;
    } else {
        ctx.globalAlpha = 1;
    }

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  // Re-render cuando cambian los trazos
  useEffect(() => {
    renderCanvas();
  }, [myStrokes, currentPath, scale]);

  // Inicializar tamaño del canvas
  useEffect(() => {
      const handleResize = () => {
          if (containerRef.current && canvasRef.current) {
              // Ajustar al ancho del contenedor, mantener aspect ratio A4 aprox (1:1.41)
              const width = containerRef.current.offsetWidth;
              const height = width * 1.41; 
              canvasRef.current.width = width;
              canvasRef.current.height = height;
              renderCanvas();
          }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);


  // --- HANDLERS DE INTERACCIÓN (Mouse & Touch) ---
  
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
        x: (clientX - rect.left) * (canvasRef.current.width / rect.width),
        y: (clientY - rect.top) * (canvasRef.current.height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly || tool === 'move') return;
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    setCurrentPath([{ x, y }]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault(); // Evitar scroll en touch
    const { x, y } = getCoords(e);
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Guardar trazo en historial
    const style = getStrokeStyle(tool);
    const newStroke: DrawingStroke = {
        points: currentPath,
        color: style.color,
        width: style.width,
        type: tool as any
    };
    
    setMyStrokes(prev => [...prev, newStroke]);
    setCurrentPath([]);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
        {/* Toolbar */}
        {!readOnly && (
            <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border-2 border-slate-100 sticky top-4 z-20">
                <div className="flex gap-2">
                    <Button 
                        size="icon" variant={tool === 'move' ? 'default' : 'ghost'} 
                        onClick={() => setTool('move')} title="Mover/Scroll"
                        className={tool === 'move' ? 'bg-slate-800 text-white' : ''}
                    >
                        <MousePointer2 className="w-5 h-5" />
                    </Button>
                    <div className="w-px bg-slate-200 mx-1"></div>
                    <Button 
                        size="icon" variant={tool === 'pen' ? 'default' : 'ghost'} 
                        onClick={() => setTool('pen')}
                        className={tool === 'pen' ? (mode === 'teacher' ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-blue-500 text-white hover:bg-blue-600') : 'text-slate-500'}
                    >
                        <Pencil className="w-5 h-5" />
                    </Button>
                    <Button 
                        size="icon" variant={tool === 'highlight' ? 'default' : 'ghost'} 
                        onClick={() => setTool('highlight')}
                        className={tool === 'highlight' ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500' : 'text-slate-500'}
                    >
                        <Highlighter className="w-5 h-5" />
                    </Button>
                    <Button 
                        size="icon" variant={tool === 'eraser' ? 'default' : 'ghost'} 
                        onClick={() => setTool('eraser')}
                        className={tool === 'eraser' ? 'bg-slate-200 text-slate-700' : 'text-slate-500'}
                    >
                        <Eraser className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex gap-2">
                     <Button 
                        variant="ghost" size="icon" 
                        onClick={() => setMyStrokes(prev => prev.slice(0, -1))}
                        disabled={myStrokes.length === 0}
                     >
                        <Undo className="w-5 h-5" />
                     </Button>
                     <Button 
                        onClick={() => onSave(myStrokes)}
                        className={mode === 'teacher' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                     >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                     </Button>
                </div>
            </div>
        )}

        {/* Canvas Container */}
        <div 
            ref={containerRef}
            className="relative w-full bg-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-200 touch-none"
            style={{ minHeight: '600px' }}
        >
            {/* Fondo (Imagen/PDF Simulado) */}
            <div 
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
                style={{ 
                    backgroundImage: `url(${bgUrl})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center top',
                    opacity: 0.9
                }}
            ></div>

            {/* Drawing Canvas */}
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={`absolute inset-0 z-10 cursor-${tool === 'move' ? 'grab' : 'crosshair'}`}
                style={{ touchAction: 'none', pointerEvents: tool === 'move' ? 'none' : 'auto' }}
            />
        </div>
        
        <div className="text-center text-xs text-slate-400 font-medium">
            {mode === 'teacher' ? '🖊️ Modo Corrección (Rojo)' : '✏️ Modo Alumno (Azul)'} • Usa 2 dedos para hacer scroll si estás en modo dibujo.
        </div>
    </div>
  );
};
