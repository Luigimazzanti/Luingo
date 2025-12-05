import React from 'react';
import { Task } from '../types';
import { Button } from './ui/button';
import { Clock, PlayCircle, CheckCircle2, RotateCcw, Eye, Award } from 'lucide-react';
import { cn } from '../lib/utils';

// ✅ CONFIGURACIÓN DE ETIQUETAS (Colores e Iconos)
const TAG_CONFIG: Record<string, { label: string, color: string, icon: string }> = {
  grammar: { label: 'Gramática', color: 'bg-indigo-100 text-indigo-700', icon: '🧩' },
  vocabulary: { label: 'Vocabulario', color: 'bg-emerald-100 text-emerald-700', icon: '🗣️' },
  listening: { label: 'Listening', color: 'bg-rose-100 text-rose-700', icon: '🎧' },
  reading: { label: 'Reading', color: 'bg-cyan-100 text-cyan-700', icon: '📖' },
  speaking: { label: 'Speaking', color: 'bg-amber-100 text-amber-700', icon: '🎙️' },
  culture: { label: 'Cultura', color: 'bg-purple-100 text-purple-700', icon: '🌍' },
};

interface TaskCardProps {
  task: Task;
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'completed' | 'draft';
  onClick: () => void;
  attemptsUsed?: number;
  bestGrade?: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  status, 
  onClick, 
  attemptsUsed = 0,
  bestGrade
}) => {
  const isWriting = task.content_data?.type === 'writing';
  const isDocument = task.content_data?.type === 'document';
  
  // ✅ LEER EL DATO REAL (Si no existe, 1 por defecto para seguridad)
  const maxAttempts = task.content_data?.max_attempts ?? 1;

  // ✅ Lógica diferenciada para Writing vs Document vs Quiz
  let isLocked = false;
  let hasActivity = attemptsUsed > 0;
  let isCompleted = status === 'graded';
  let buttonLabel = 'Comenzar';
  let buttonVariant: 'default' | 'outline' | 'secondary' = 'default';

  if (isWriting) {
    // ✅ WRITING: No hay intentos, solo estados
    if (status === 'draft') {
      buttonLabel = 'Continuar Borrador';
      buttonVariant = 'secondary';
    } else if (status === 'submitted') {
      buttonLabel = 'Esperando Corrección';
      buttonVariant = 'outline';
      isLocked = true;
    } else if (status === 'graded') {
      buttonLabel = 'Ver Corrección';
      isCompleted = true;
    }
  } else if (isDocument) {
    // ✅ DOCUMENT PDF: Similar a Writing, sin intentos
    if (status === 'submitted') {
      buttonLabel = 'Esperando Revisión';
      buttonVariant = 'outline';
      isLocked = true;
    } else if (status === 'graded') {
      buttonLabel = 'Ver Corrección';
      isCompleted = true;
    } else {
      buttonLabel = 'Anotar Documento';
    }
  } else {
    // ✅ QUIZ: Lógica de intentos
    isLocked = attemptsUsed >= maxAttempts;
    isCompleted = status === 'graded' || (status === 'submitted' && isLocked);
    
    if (isCompleted) {
      buttonLabel = 'Ver Resumen';
    } else if (attemptsUsed > 0) {
      buttonLabel = 'Reintentar';
    }
  }

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 bg-white",
        isCompleted 
          ? "border-emerald-200 opacity-90" 
          : isLocked 
            ? "border-slate-200 opacity-60" 
            : "border-indigo-200"
      )}
    >
      {/* Cabecera: Categoría + Contador */}
      <div className="flex items-center justify-between mb-3">
        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide">
          {task.category || 'Tarea'}
        </span>
        
        {/* ✅ CONTADOR CLARO DE INTENTOS (SOLO PARA QUIZ) */}
        {!isWriting && !isDocument && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
            isCompleted 
              ? "bg-emerald-100 text-emerald-700" 
              : "bg-slate-100 text-slate-500"
          )}>
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> 
                Completado
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" /> 
                Intentos: {attemptsUsed} / {maxAttempts}
              </>
            )}
          </div>
        )}
        
        {/* Badge para Writing y Document */}
        {(isWriting || isDocument) && isCompleted && (
          <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" /> 
            Corregido
          </div>
        )}
      </div>

      {/* Título y Descripción */}
      <div className="flex-1 mb-4">
        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {task.title}
        </h3>
        
        {/* ✅ RENDERIZADO DE ETIQUETAS EN LA CARD */}
        <div className="mb-3 flex flex-wrap gap-1.5 min-h-[24px]">
          {task.content_data?.tags && task.content_data.tags.length > 0 ? (
            task.content_data.tags.map((tagId: string) => {
              const config = TAG_CONFIG[tagId];
              if (!config) return null;
              return (
                <span key={tagId} className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide", config.color)}>
                  <span>{config.icon}</span> {config.label}
                </span>
              );
            })
          ) : (
            // Fallback para tareas muy viejas (aunque dijiste que borraste todo)
            <p className="text-xs text-slate-400 line-clamp-2 italic">{task.description}</p>
          )}
        </div>
      </div>

      {/* ✅ MOSTRAR MEJOR NOTA SI EXISTE */}
      {hasActivity && bestGrade !== undefined && (
        <div className="mb-3 flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 p-2 rounded-xl border border-amber-200">
          <Award className="w-4 h-4 text-amber-600" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-amber-600 uppercase">Mejor Nota</p>
            <p className="text-lg font-black text-amber-700">{bestGrade.toFixed(1)} / 10</p>
          </div>
        </div>
      )}

      {/* ✅ BOTÓN DE ACCIÓN */}
      <Button 
        size="sm" 
        className={cn(
          "w-full h-10 font-bold rounded-xl transition-all",
          isCompleted 
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" 
            : isLocked 
              ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200" 
              : buttonVariant === 'secondary'
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
        )}
        disabled={false} // ✅ Siempre clickeable
      >
        {isCompleted ? (
          <>
            <Eye className="w-4 h-4 mr-2" /> 
            {buttonLabel}
          </>
        ) : isLocked ? (
          <>
            <Clock className="w-4 h-4 mr-2" /> 
            {buttonLabel}
          </>
        ) : attemptsUsed > 0 && !isWriting && !isDocument ? (
          <>
            <RotateCcw className="w-4 h-4 mr-2" /> 
            {buttonLabel}
          </>
        ) : (
          <>
            <PlayCircle className="w-4 h-4 mr-2 fill-current" /> 
            {buttonLabel}
          </>
        )}
      </Button>
    </div>
  );
};