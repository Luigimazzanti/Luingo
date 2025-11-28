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

// Configurar worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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
  const [currentPath, setCurrentPath] = useState<string>('');
  const [history, setHistory] = useState<PDFAnnotation[][]>([initialAnnotations]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
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
      if (clicked) {
        const newAnnotations = annotations.filter(ann => ann.id !== clicked.id);
        setAnnotations(newAnnotations);
        saveToHistory(newAnnotations);
      }
    } else if (currentTool === 'select') {
      // Seleccionar anotación
      const clicked = annotations.find(ann => {
        const distance = Math.sqrt(Math.pow(ann.x - pos.x, 2) + Math.pow(ann.y - pos.y, 2));
        return distance < 5;
      });
      setSelectedAnnotation(clicked?.id || null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || currentTool !== 'pen') return;
    
    const pos = getRelativePosition(e);
    setCurrentPath(prev => `${prev} L ${pos.x} ${pos.y}`);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentTool === 'pen' && currentPath) {
      const newAnnotation: PDFAnnotation = {
        id: `path-${Date.now()}`,
        type: 'path',
        x: 0,
        y: 0,
        pathData: currentPath,
        color: mode === 'teacher' ? '#ef4444' : '#3b82f6',
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
                    return (
                      <path
                        key={ann.id}
                        d={ann.pathData}
                        stroke={ann.color}
                        strokeWidth="2"
                        fill="none"
                        opacity={selectedAnnotation === ann.id ? 0.5 : 0.8}
                        className={cn(
                          selectedAnnotation === ann.id && 'drop-shadow-lg'
                        )}
                      />
                    );
                  }
                  return null;
                })}

                {/* Trazo actual mientras se dibuja */}
                {isDrawing && currentPath && (
                  <path
                    d={currentPath}
                    stroke={mode === 'teacher' ? '#ef4444' : '#3b82f6'}
                    strokeWidth="2"
                    fill="none"
                    opacity="0.6"
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
                          "absolute px-2 py-1 rounded text-sm font-medium shadow-md pointer-events-auto cursor-pointer",
                          selectedAnnotation === ann.id && 'ring-2 ring-offset-2 ring-indigo-500'
                        )}
                        style={{
                          left: `${ann.x}%`,
                          top: `${ann.y}%`,
                          backgroundColor: ann.color === '#ef4444' ? '#fee2e2' : '#dbeafe',
                          color: ann.color,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={() => setSelectedAnnotation(ann.id)}
                      >
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
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={() => setSelectedAnnotation(ann.id)}
                      >
                        <Icon 
                          className="w-8 h-8 drop-shadow-lg" 
                          style={{ color: ann.color }}
                          fill={ann.color}
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
