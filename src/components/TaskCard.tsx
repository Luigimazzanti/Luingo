import React from 'react';
import { Task } from '../types';
import { Button } from './ui/button';
import { Clock, PlayCircle, CheckCircle2, RotateCcw, Eye, Award } from 'lucide-react';
import { cn } from '../lib/utils';

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
  
  // ✅ LEER EL DATO REAL (Si no existe, 1 por defecto para seguridad)
  const maxAttempts = task.content_data?.max_attempts ?? 1;

  // ✅ Lógica diferenciada para Writing vs Quiz
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
        
        {/* ✅ CONTADOR CLARO DE INTENTOS */}
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
      </div>

      {/* Título y Descripción */}
      <div className="flex-1 mb-4">
        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {task.title}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-2 font-medium min-h-[2.5em]">
          {task.description}
        </p>
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
        ) : attemptsUsed > 0 && !isWriting ? (
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