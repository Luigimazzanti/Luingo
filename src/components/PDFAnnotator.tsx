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
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider'; // ✅ FIX: Importar Slider para controles
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
  onSaveDraft?: (annotations: PDFAnnotation[]) => void;
  readOnly?: boolean;
}

export const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({
  mode,
  pdfUrl,
  initialAnnotations = [],
  onSave,
  onSaveDraft,
  readOnly = false
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>(initialAnnotations);
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [scale, setScale] = useState<number>(1.0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [history, setHistory] = useState<PDFAnnotation[][]>([initialAnnotations]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false); // ✅ FIX: Estado para mover anotaciones
  const [strokeWidth, setStrokeWidth] = useState<number>(0.5); // ✅ FIX: Grosor del lápiz
  const [fontSize, setFontSize] = useState<number>(16); // ✅ FIX: Tamaño del texto (renombrado de textSize a fontSize)
  const [stampScale, setStampScale] = useState<number>(1); // Tamaño de sellos: 0.6=Pequeño, 1.0=Medio, 1.5=Grande
  // ✅ ESTADOS SEPARADOS: Cada botón tiene su propio estado de carga
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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

  // Convertir coordenadas del mouse a porcentajes relativos
  const getRelativePosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  // Handlers de dibujo
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    
    const pos = getRelativePosition(e);

    if (currentTool === 'pen') {
      setIsDrawing(true);
      setCurrentPath(`M ${pos.x} ${pos.y}`);
    } else if (currentTool === 'text') {
      const content = prompt('Escribe tu anotación:');
      if (content) {
        const newAnnotation: PDFAnnotation = {
          id: `text-${Date.now()}`,
          type: 'text',
          x: pos.x,
          y: pos.y,
          content,
          color: mode === 'teacher' ? '#ef4444' : '#3b82f6',
          fontSize: fontSize, // ✅ FIX: Guardar tamaño de fuente actual
          author: mode,
          timestamp: new Date().toISOString()
        };
        const newAnnotations = [...annotations, newAnnotation];
        setAnnotations(newAnnotations);
        saveToHistory(newAnnotations);
      }
    } else if (currentTool === 'stamp-check' || currentTool === 'stamp-x') {
      const newAnnotation: PDFAnnotation = {
        id: `stamp-${Date.now()}`,
        type: 'stamp',
        x: pos.x,
        y: pos.y,
        content: currentTool === 'stamp-check' ? 'check' : 'x',
        color: currentTool === 'stamp-check' ? '#22c55e' : '#ef4444',
        scale: stampScale,
        author: mode,
        timestamp: new Date().toISOString()
      };
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      saveToHistory(newAnnotations);
    } else if (currentTool === 'eraser') {
      // Buscar anotación cercana y eliminarla
      const clicked = annotations.find(ann => {
        const distance = Math.sqrt(Math.pow(ann.x - pos.x, 2) + Math.pow(ann.y - pos.y, 2));
        return distance < 5; // 5% de tolerancia
      });
      
      // ✅ FIX CRÍTICO: Profesor NO puede borrar anotaciones del estudiante
      if (mode === 'teacher' && clicked?.author === 'student') {
        return; // Bloquear borrado
      }
      
      if (clicked) {
        const newAnnotations = annotations.filter(ann => ann.id !== clicked.id);
        setAnnotations(newAnnotations);
        saveToHistory(newAnnotations);
      }
    } else if (currentTool === 'select') {
      // Seleccionar anotación y preparar para mover
      const clicked = annotations.find(ann => {
        const distance = Math.sqrt(Math.pow(ann.x - pos.x, 2) + Math.pow(ann.y - pos.y, 2));
        return distance < 5;
      });
      
      // ✅ FIX: Profesor NO puede mover/seleccionar anotaciones del estudiante
      if (mode === 'teacher' && clicked?.author === 'student') {
        return; // Bloquear acción
      }
      
      setSelectedAnnotation(clicked?.id || null);
      if (clicked) {
        setIsDragging(true); // ✅ FIX: Habilitar modo arrastre si se selecciona anotación
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePosition(e);
    
    // ✅ FIX: Mover anotación si estamos en modo arrastre
    if (isDragging && currentTool === 'select' && selectedAnnotation) {
      const newAnnotations = annotations.map(ann =>
        ann.id === selectedAnnotation
          ? { ...ann, x: pos.x, y: pos.y }
          : ann
      );
      setAnnotations(newAnnotations);
      return;
    }
    
    // Lógica original del lápiz
    if (!isDrawing || currentTool !== 'pen') return;
    setCurrentPath(prev => `${prev} L ${pos.x} ${pos.y}`);
  };

  const handleMouseUp = () => {
    // ✅ FIX: Finalizar arrastre y guardar en historial
    if (isDragging) {
      setIsDragging(false);
      saveToHistory(annotations); // Guardar posición final
      return;
    }
    
    // Lógica original del lápiz
    if (isDrawing && currentTool === 'pen' && currentPath) {
      const newAnnotation: PDFAnnotation = {
        id: `path-${Date.now()}`,
        type: 'path',
        x: 0,
        y: 0,
        pathData: currentPath,
        color: mode === 'teacher' ? '#ef4444' : '#3b82f6',
        strokeWidth, // ✅ FIX: Guardar grosor actual
        author: mode,
        timestamp: new Date().toISOString()
      };
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      saveToHistory(newAnnotations);
      setCurrentPath('');
    }
    setIsDrawing(false);
  };

  // Eliminar anotación seleccionada
  const deleteSelected = () => {
    if (selectedAnnotation) {
      // ✅ FIX: Profesor NO puede borrar anotaciones del estudiante
      const targetAnnotation = annotations.find(a => a.id === selectedAnnotation);
      if (mode === 'teacher' && targetAnnotation?.author === 'student') {
        return; // Bloquear borrado
      }
      
      const newAnnotations = annotations.filter(ann => ann.id !== selectedAnnotation);
      setAnnotations(newAnnotations);
      saveToHistory(newAnnotations);
      setSelectedAnnotation(null);
    }
  };

  // Guardar borrador (Draft)
  const handleLocalSaveDraft = async () => {
    if (onSaveDraft) {
      setSavingDraft(true);
      try { 
        await onSaveDraft(annotations); 
      } finally { 
        setSavingDraft(false); 
      }
    }
  };

  // Entregar tarea final (Submit)
  const handleLocalSubmit = async () => {
    if (onSave) {
      setSubmitting(true); // Bloquea la UI
      try { 
        await onSave(annotations); 
      } finally { 
        setSubmitting(false); 
      }
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
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
                <Button
                  size="sm"
                  variant={currentTool === 'stamp-x' ? 'default' : 'outline'}
                  onClick={() => setCurrentTool('stamp-x')}
                  title="Sello Error"
                  className="text-red-600"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </>
            )}

            {/* ✅ FIX: Control de grosor del lápiz */}
            {currentTool === 'pen' && (
              <>
                <div className="w-px h-6 bg-slate-300" />
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs font-medium text-slate-600 whitespace-nowrap">Grosor:</span>
                  <Slider
                    value={[strokeWidth]}
                    onValueChange={(values) => setStrokeWidth(values[0])}
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    className="w-24"
                  />
                  <span className="text-xs font-mono text-slate-600">{strokeWidth.toFixed(1)}</span>
                </div>
              </>
            )}

            {/* ✅ FIX: Control de tamaño de texto */}
            {currentTool === 'text' && (
              <>
                <div className="w-px h-6 bg-slate-300" />
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs font-medium text-slate-600 whitespace-nowrap">Tamaño:</span>
                  <select 
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="h-8 px-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={12}>Pequeño (12px)</option>
                    <option value={16}>Normal (16px)</option>
                    <option value={24}>Grande (24px)</option>
                    <option value={32}>Muy Grande (32px)</option>
                  </select>
                </div>
              </>
            )}

            {(currentTool === 'stamp-check' || currentTool === 'stamp-x') && (
              <>
                <div className="w-px h-6 bg-slate-300" />
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs font-medium text-slate-600 whitespace-nowrap">Tamaño:</span>
                  <select 
                    value={stampScale} 
                    onChange={(e) => setStampScale(Number(e.target.value))}
                    className="h-8 px-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0.6}>Pequeño</option>
                    <option value={1.0}>Medio</option>
                    <option value={1.5}>Grande</option>
                  </select>
                </div>
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
            {mode === 'student' && onSaveDraft ? (
              <>
                {/* ✅ Botón Guardar Avance - Estado independiente */}
                <Button 
                  onClick={handleLocalSaveDraft} 
                  size="sm" 
                  variant="outline" 
                  disabled={savingDraft || submitting} // Bloquear si algo está pasando
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  {savingDraft ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Guardar Avance
                    </>
                  )}
                </Button>
                {/* ✅ Botón Entregar - Estado independiente */}
                <Button 
                  onClick={handleLocalSubmit} 
                  size="sm" 
                  disabled={savingDraft || submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Entregando...
                    </>
                  ) : (
                    <>
                      🚀 Entregar Tarea
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleLocalSubmit} 
                size="sm" 
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            )}
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
            <div className="relative w-fit mx-auto bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-200">
              <div
                ref={canvasRef}
                className="relative"
                style={{
                  cursor: currentTool === 'pen' ? 'crosshair' : 
                          currentTool === 'text' ? 'text' :
                          currentTool === 'eraser' ? 'not-allowed' :
                          currentTool === 'select' ? 'move' : 'default'
                }}
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
                    scale={scale}
                    className="block"
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                  />
                </Document>

              {/* Capa de anotaciones SVG */}
              <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 10 }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {/* ✅ FIX: viewBox hace que coordenadas 0-100 se mapeen correctamente al canvas */}
                {/* Renderizar anotaciones guardadas */}
                {annotations.map(ann => {
                  if (ann.type === 'path') {
                    // ✅ FIX: vectorEffect mantiene grosor constante con zoom
                    return (
                      <path
                        key={ann.id}
                        d={ann.pathData}
                        stroke={ann.color}
                        strokeWidth={ann.strokeWidth || strokeWidth}
                        fill="none"
                        opacity={selectedAnnotation === ann.id ? 0.5 : 0.8}
                        vectorEffect="non-scaling-stroke"
                        className={cn(
                          selectedAnnotation === ann.id && 'drop-shadow-lg'
                        )}
                      />
                    );
                  }
                  return null;
                })}

                {/* Trazo actual mientras se dibuja - Aplicar grosor actual al preview */}
                {isDrawing && currentPath && (
                  <path
                    d={currentPath}
                    stroke={mode === 'teacher' ? '#ef4444' : '#3b82f6'}
                    strokeWidth={strokeWidth}
                    fill="none"
                    opacity="0.6"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>

              {/* Capa de textos y sellos */}
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 11 }}>
                {annotations.map(ann => {
                  if (ann.type === 'text') {
                    return (
                      <div
                        key={ann.id}
                        className={cn(
                          "absolute px-2 py-1 rounded font-medium shadow-md pointer-events-auto cursor-pointer",
                          selectedAnnotation === ann.id && 'ring-2 ring-offset-2 ring-indigo-500'
                        )}
                        style={{
                          left: `${ann.x}%`,
                          top: `${ann.y}%`,
                          backgroundColor: ann.color === '#ef4444' ? '#fee2e2' : '#dbeafe',
                          color: ann.color,
                          fontSize: `${(ann.fontSize || fontSize) * scale}px`,
                          transform: `translate(-50%, -50%)`
                        }}
                        onClick={() => setSelectedAnnotation(ann.id)}
                      >
                        {/* ✅ FIX: fontSize se multiplica por scale para zoom sincronizado */}
                        {ann.content}
                      </div>
                    );
                  } else if (ann.type === 'stamp') {
                    const Icon = ann.content === 'check' ? CheckCircle2 : XCircle;
                    return (
                      <div
                        key={ann.id}
                        className={cn(
                          "absolute pointer-events-auto cursor-pointer",
                          selectedAnnotation === ann.id && 'ring-2 ring-offset-2 ring-indigo-500 rounded-full'
                        )}
                        style={{
                          left: `${ann.x}%`,
                          top: `${ann.y}%`,
                          transform: `translate(-50%, -50%) scale(${(ann.scale || 1) * scale})`,
                          zIndex: 20
                        }}
                        onClick={() => setSelectedAnnotation(ann.id)}
                      >
                        {/* ✅ FIX CRÍTICO: Eliminado fill={ann.color} para que se vea el símbolo ✓ o ✗ */}
                        <Icon 
                          className="w-12 h-12 drop-shadow-lg" 
                          color={ann.color}
                          fill="white"
                          strokeWidth={2.5}
                        />
                        {/* color define el borde, fill="white" da fondo blanco al círculo */}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
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
