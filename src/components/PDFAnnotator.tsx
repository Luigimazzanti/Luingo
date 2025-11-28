import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  MousePointer2, 
  Pencil, 
  Type, 
  Eraser, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle2, 
  XCircle,
  Undo,
  Redo,
  Download,
  Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { PDFAnnotation } from '../types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// ✅ Configuración robusta del worker para evitar errores de CORS y Módulos
try {
  // Usamos una versión fija si pdfjs.version no está definida, y forzamos HTTPS + .mjs
  const pdfVersion = pdfjs.version || '4.4.168'; 
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.error("Error configuring PDF worker:", e);
}

type Tool = 'select' | 'pen' | 'text' | 'eraser' | 'stamp-check' | 'stamp-x';

interface PDFAnnotatorProps {
  mode: 'student' | 'teacher';
  pdfUrl: string;
  initialAnnotations?: PDFAnnotation[];
  onSave?: (annotations: PDFAnnotation[]) => void;
  readOnly?: boolean;
}

export const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({
  mode,
  pdfUrl,
  initialAnnotations = [],
  onSave,
  readOnly = false
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>(initialAnnotations);
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [scale, setScale] = useState<number>(1.0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]); // ✅ Array de coordenadas
  const [history, setHistory] = useState<PDFAnnotation[][]>([initialAnnotations]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // ✅ NUEVO: Ref al contenedor de interacción
  const svgRef = useRef<SVGSVGElement>(null);
  const tool = currentTool; // ✅ Alias para simplificar

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError('');
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error cargando PDF:', error);
    setError('No se pudo cargar el PDF. Verifica la URL o intenta con otro archivo.');
  };

  // Guardar en historial
  const saveToHistory = (newAnnotations: PDFAnnotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  // ✅ REESCRITA: Función de coordenadas a prueba de balas
  const getRelativeCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    // Obtenemos el rectángulo EXACTO del contenedor (el div sobre el PDF)
    const rect = containerRef.current.getBoundingClientRect();
    
    // Obtenemos coordenadas del cliente (mouse o touch)
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    // Calculamos la posición relativa restando el offset del contenedor
    // Esto corrige el desfase por scroll o márgenes
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // Convertimos a porcentaje con 2 decimales de precisión
    return {
      x: Number(((relativeX / rect.width) * 100).toFixed(2)),
      y: Number(((relativeY / rect.height) * 100).toFixed(2))
    };
  };

  // ✅ REESCRITO: Handlers con bloqueo de permisos y prevención de scroll
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    
    // Prevenir scroll en móviles al dibujar
    if (tool === 'pen') e.preventDefault();
    
    const coords = getRelativeCoords(e);

    // 1. Lógica para herramienta SELECCIONAR (Mover)
    if (tool === 'select') {
      const target = e.target as HTMLElement;
      // Buscamos el ID del elemento clickeado
      const clickedId = target.closest('[data-annotation-id]')?.getAttribute('data-annotation-id');
      
      if (clickedId) {
        // ✅ SI ES PROFESOR: Bloquear mover anotaciones que venían en 'initialAnnotations' (las del alumno)
        const isInitial = initialAnnotations.some(a => a.id === clickedId);
        if (mode === 'teacher' && isInitial) {
          return; // No hacer nada, es del alumno
        }
        
        setDraggingId(clickedId);
        setSelectedAnnotation(clickedId);
        return;
      }
      
      // Si no hay anotación, deseleccionar
      setSelectedAnnotation(null);
      return;
    }

    // 2. Lógica para herramienta LÁPIZ
    if (tool === 'pen') {
      setIsDrawing(true);
      setCurrentPath([coords]);
      return;
    }
    
    // 3. Lógica para TEXTO
    if (tool === 'text') {
      const content = prompt('Escribe tu anotación:');
      if (content) {
        const newAnnotation: PDFAnnotation = {
          id: `text-${Date.now()}`,
          type: 'text',
          x: coords.x,
          y: coords.y,
          content,
          color: mode === 'teacher' ? '#ef4444' : '#3b82f6',
          author: mode,
          timestamp: new Date().toISOString()
        };
        const newAnnotations = [...annotations, newAnnotation];
        setAnnotations(newAnnotations);
        saveToHistory(newAnnotations);
      }
      return;
    }
    
    // 4. Lógica para SELLOS
    if (tool === 'stamp-check' || tool === 'stamp-x') {
      const newAnnotation: PDFAnnotation = {
        id: `stamp-${Date.now()}`,
        type: 'stamp',
        x: coords.x,
        y: coords.y,
        content: tool === 'stamp-check' ? 'check' : 'x',
        color: tool === 'stamp-check' ? '#22c55e' : '#ef4444',
        author: mode,
        timestamp: new Date().toISOString()
      };
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      saveToHistory(newAnnotations);
      return;
    }
    
    // 5. Lógica para BORRADOR
    if (tool === 'eraser') {
      // Buscar anotación cercana y eliminarla
      const clicked = annotations.find(ann => {
        const distance = Math.sqrt(Math.pow(ann.x - coords.x, 2) + Math.pow(ann.y - coords.y, 2));
        return distance < 5; // 5% de tolerancia
      });
      if (clicked) {
        const newAnnotations = annotations.filter(ann => ann.id !== clicked.id);
        setAnnotations(newAnnotations);
        saveToHistory(newAnnotations);
      }
    }
  };

  // ✅ MEJORADO: handleMouseMove con soporte para arrastrar Y dibujar
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getRelativeCoords(e);

    // A. Moviendo una anotación
    if (draggingId && tool === 'select') {
      setAnnotations(prev => prev.map(ann => 
        ann.id === draggingId ? { ...ann, x: coords.x, y: coords.y } : ann
      ));
      return;
    }

    // B. Dibujando con lápiz
    if (isDrawing && tool === 'pen') {
      setCurrentPath(prev => [...prev, coords]);
    }
  };

  // ✅ MEJORADO: handleMouseUp con limpieza de estado de arrastre
  const handleMouseUp = () => {
    // Guardar trazo del lápiz si existe
    if (isDrawing && tool === 'pen' && currentPath.length > 1) {
      // Convertir array de coordenadas a pathData SVG
      const pathData = currentPath.map((p, i) => 
        i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
      ).join(' ');
      
      const newAnnotation: PDFAnnotation = {
        id: `path-${Date.now()}`,
        type: 'path',
        x: 0,
        y: 0,
        pathData,
        color: mode === 'teacher' ? '#ef4444' : '#3b82f6',
        author: mode,
        timestamp: new Date().toISOString()
      };
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      saveToHistory(newAnnotations);
      setCurrentPath([]);
    }
    
    // Guardar en historial si se movió una anotación
    if (draggingId) {
      saveToHistory(annotations);
    }
    
    setIsDrawing(false);
    setDraggingId(null); // ✅ Soltar elemento
  };

  // Eliminar anotación seleccionada
  const deleteSelected = () => {
    if (selectedAnnotation) {
      const newAnnotations = annotations.filter(ann => ann.id !== selectedAnnotation);
      setAnnotations(newAnnotations);
      saveToHistory(newAnnotations);
      setSelectedAnnotation(null);
    }
  };

  // Guardar anotaciones
  const handleSave = () => {
    if (onSave) {
      onSave(annotations);
    }
  };

  // Filtrar anotaciones por autor
  const studentAnnotations = annotations.filter(a => a.author === 'student');
  const teacherAnnotations = annotations.filter(a => a.author === 'teacher');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Toolbar */}
      {!readOnly && (
        <div className="bg-white border-b border-slate-200 p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Herramientas básicas */}
            <Button
              size="sm"
              variant={currentTool === 'select' ? 'default' : 'outline'}
              onClick={() => setCurrentTool('select')}
              title="Seleccionar"
            >
              <MousePointer2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={currentTool === 'pen' ? 'default' : 'outline'}
              onClick={() => setCurrentTool('pen')}
              title="Lápiz"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={currentTool === 'text' ? 'default' : 'outline'}
              onClick={() => setCurrentTool('text')}
              title="Texto"
            >
              <Type className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={currentTool === 'eraser' ? 'default' : 'outline'}
              onClick={() => setCurrentTool('eraser')}
              title="Borrador"
            >
              <Eraser className="w-4 h-4" />
            </Button>

            {/* Sellos (solo profesor) */}
            {mode === 'teacher' && (
              <>
                <div className="w-px h-6 bg-slate-300" />
                <Button
                  size="sm"
                  variant={currentTool === 'stamp-check' ? 'default' : 'outline'}
                  onClick={() => setCurrentTool('stamp-check')}
                  title="Sello Correcto"
                  className="text-green-600"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={currentTool === 'stamp-x' ? 'default' : 'outline'}
                  onClick={() => setCurrentTool('stamp-x')}
                  title="Sello Error"
                  className="text-red-600"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Zoom */}
            <div className="w-px h-6 bg-slate-300" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-mono text-slate-600 px-2">
              {Math.round(scale * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setScale(Math.min(2.0, scale + 0.1))}
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            {/* Historial */}
            <div className="w-px h-6 bg-slate-300" />
            <Button
              size="sm"
              variant="outline"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Deshacer"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Rehacer"
            >
              <Redo className="w-4 h-4" />
            </Button>

            {/* Eliminar seleccionado */}
            {selectedAnnotation && (
              <Button
                size="sm"
                variant="destructive"
                onClick={deleteSelected}
                title="Eliminar seleccionado"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Estadísticas */}
            <div className="text-xs text-slate-500 font-medium">
              Alumno: {studentAnnotations.length} | Profesor: {teacherAnnotations.length}
            </div>
            <Button onClick={handleSave} size="sm">
              <Download className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </div>
        </div>
      )}

      {/* Visor PDF con anotaciones */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-bold text-red-900 mb-2">Error al cargar PDF</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          ) : (
            <div
              ref={canvasRef}
              className="relative bg-white shadow-2xl rounded-lg overflow-hidden"
              style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* PDF de fondo */}
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-96 bg-slate-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      <p className="text-slate-600 font-medium">Cargando PDF...</p>
                    </div>
                  </div>
                }
              >
                <Page 
                  pageNumber={pageNumber} 
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                />
              </Document>

              {/* Capa de anotaciones SVG */}
              <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 10 }}
              >
                {/* Renderizar anotaciones guardadas */}
                {annotations.map(ann => {
                  if (ann.type === 'path') {
                    // ✅ Bloquear interacción con paths del alumno si el profesor está dibujando
                    const isStudentAnnotation = ann.author === 'student';
                    const blockInteraction = mode === 'teacher' && isStudentAnnotation && tool !== 'select';
                    
                    return (
                      <path
                        key={ann.id}
                        data-annotation-id={ann.id}
                        d={ann.pathData}
                        stroke={ann.color}
                        strokeWidth="2"
                        fill="none"
                        opacity={blockInteraction ? 0.4 : (selectedAnnotation === ann.id ? 0.5 : 0.8)}
                        className={cn(
                          blockInteraction ? "pointer-events-none" : "pointer-events-auto cursor-pointer",
                          selectedAnnotation === ann.id && 'drop-shadow-lg'
                        )}
                        onClick={() => !readOnly && !blockInteraction && setSelectedAnnotation(ann.id)}
                      />
                    );
                  }
                  return null;
                })}

                {/* Trazo actual mientras se dibuja */}
                {isDrawing && currentPath.length > 0 && (
                  <path
                    d={currentPath.map((p, i) => 
                      i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
                    ).join(' ')}
                    stroke={mode === 'teacher' ? '#ef4444' : '#3b82f6'}
                    strokeWidth="2"
                    fill="none"
                    opacity="0.6"
                  />
                )}
              </svg>

              {/* ✅ CRÍTICO: Capa de captura de eventos con containerRef y cursores dinámicos */}
              {!readOnly && (
                <div 
                  ref={containerRef}
                  className={cn(
                    "absolute inset-0 z-50 touch-none",
                    tool === 'pen' && "cursor-crosshair",
                    tool === 'text' && "cursor-text",
                    tool === 'eraser' && "cursor-not-allowed",
                    tool === 'select' && "cursor-default",
                    tool === 'stamp-check' && "cursor-copy",
                    tool === 'stamp-x' && "cursor-copy"
                  )}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUp}
                />
              )}

              {/* Capa de textos y sellos */}
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 11 }}>
                {annotations.map(ann => {
                  if (ann.type === 'text') {
                    // ✅ Bloquear interacción con anotaciones del alumno si el profesor está dibujando
                    const isStudentAnnotation = ann.author === 'student';
                    const blockInteraction = mode === 'teacher' && isStudentAnnotation && tool !== 'select';
                    
                    return (
                      <div
                        key={ann.id}
                        data-annotation-id={ann.id}
                        className={cn(
                          "absolute px-2 py-1 rounded text-sm font-medium shadow-md",
                          blockInteraction ? "pointer-events-none" : "pointer-events-auto cursor-pointer",
                          selectedAnnotation === ann.id && 'ring-2 ring-offset-2 ring-indigo-500'
                        )}
                        style={{
                          left: `${ann.x}%`,
                          top: `${ann.y}%`,
                          backgroundColor: ann.color === '#ef4444' ? '#fee2e2' : '#dbeafe',
                          color: ann.color,
                          transform: 'translate(-50%, -50%)',
                          opacity: blockInteraction ? 0.6 : 1
                        }}
                        onClick={() => !blockInteraction && setSelectedAnnotation(ann.id)}
                      >
                        {ann.content}
                      </div>
                    );
                  } else if (ann.type === 'stamp') {
                    const Icon = ann.content === 'check' ? CheckCircle2 : XCircle;
                    
                    // ✅ Bloquear interacción con anotaciones del alumno si el profesor está dibujando
                    const isStudentAnnotation = ann.author === 'student';
                    const blockInteraction = mode === 'teacher' && isStudentAnnotation && tool !== 'select';
                    
                    return (
                      <div
                        key={ann.id}
                        data-annotation-id={ann.id}
                        className={cn(
                          "absolute",
                          blockInteraction ? "pointer-events-none" : "pointer-events-auto cursor-pointer",
                          selectedAnnotation === ann.id && 'ring-2 ring-offset-2 ring-indigo-500 rounded-full'
                        )}
                        style={{
                          left: `${ann.x}%`,
                          top: `${ann.y}%`,
                          transform: 'translate(-50%, -50%)',
                          opacity: blockInteraction ? 0.6 : 1
                        }}
                        onClick={() => !blockInteraction && setSelectedAnnotation(ann.id)}
                      >
                        {/* ✅ MEJORADO: Sellos con mejor contraste y visibilidad */}
                        <Icon 
                          className={cn(
                            "w-12 h-12 drop-shadow-lg",
                            ann.content === 'check' ? "text-green-600" : "text-red-600"
                          )}
                          fill="white"
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Paginación */}
          {numPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(pageNumber - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-slate-600 font-medium">
                Página {pageNumber} de {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber(pageNumber + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
