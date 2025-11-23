import React from 'react';
import { Task } from '../types';
import { Button } from './ui/button';
import { Clock, FileText, PlayCircle, Award, CheckCircle2, ArrowRight, Lock, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface TaskCardProps {
  task: Task;
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'completed';
  onClick: () => void;
  attemptsUsed?: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  status, 
  onClick, 
  attemptsUsed = 0 
}) => {
  // ✅ LEER EL DATO REAL (Si no existe, 1 por defecto para seguridad)
  const maxAttempts = task.content_data?.max_attempts ?? 1;

  // ✅ Lógica de Bloqueo: Si ya gastó los intentos, se bloquea.
  // PERO si el estado es 'graded' (ya corregido), también cuenta como completado.
  const isLocked = attemptsUsed >= maxAttempts;
  const isCompleted = status === 'graded' || (status === 'submitted' && isLocked);

  return (
    <div 
      onClick={!isLocked || isCompleted ? onClick : undefined}
      className={cn(
        "group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 bg-white",
        isCompleted 
          ? "border-emerald-200 opacity-90" 
          : isLocked 
            ? "border-slate-200 opacity-60 grayscale cursor-not-allowed" 
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

      {/* ✅ BOTÓN DE ACCIÓN */}
      <Button 
        size="sm" 
        className={cn(
          "w-full h-10 font-bold rounded-xl transition-all",
          isCompleted 
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" 
            : isLocked 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
        )}
        disabled={isLocked && !isCompleted}
      >
        {isCompleted ? (
          "Ver Resultado"
        ) : isLocked ? (
          "Sin intentos"
        ) : attemptsUsed > 0 ? (
          <>
            <RotateCcw className="w-4 h-4 mr-2" /> 
            Reintentar
          </>
        ) : (
          <>
            <PlayCircle className="w-4 h-4 mr-2" /> 
            Comenzar
          </>
        )}
      </Button>
    </div>
  );
};
