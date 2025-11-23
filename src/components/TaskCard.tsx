import React from 'react';
import { Task } from '../types';
import { Play, CheckCircle2, Clock, Lock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'completed';
  onClick: () => void;
  attemptsUsed?: number; // Nueva prop opcional para pasar intentos usados desde fuera
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  status, 
  onClick, 
  attemptsUsed = 0 
}) => {
  // ✅ LEER CONFIGURACIÓN REAL (O default a 1 si no existe, NO a 3)
  const maxAttempts = task.content_data?.max_attempts || 1;
  const isLocked = attemptsUsed >= maxAttempts;
  const isCompleted = status === 'graded' || status === 'submitted' || isLocked;

  return (
    <div 
      onClick={isLocked && !isCompleted ? undefined : onClick}
      className={`relative group bg-white p-5 rounded-3xl border-b-4 transition-all duration-300 ${
        isCompleted 
          ? 'border-emerald-200 opacity-90' 
          : isLocked 
            ? 'border-slate-200 opacity-60 cursor-not-allowed' 
            : 'border-indigo-200 hover:border-indigo-400 cursor-pointer hover:-translate-y-1 hover:shadow-lg'
      }`}
    >
      {/* Badge Categoría */}
      <div className="flex items-center justify-between mb-3">
        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide">
          {task.category || 'Tarea'}
        </span>
        
        {/* Badge de Intentos o Estado */}
        {isCompleted ? (
          <div className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold">Completada</span>
          </div>
        ) : attemptsUsed > 0 ? (
          <div className="flex items-center gap-1 text-amber-600">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold">Intento {attemptsUsed + 1} de {maxAttempts}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold">{maxAttempts} {maxAttempts === 1 ? 'intento' : 'intentos'}</span>
          </div>
        )}
      </div>

      <h3 className="font-black text-slate-800 text-lg mb-1 leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">
        {task.title}
      </h3>
      
      <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 min-h-[2.5em]">
        {task.description}
      </p>

      {/* Botón Acción */}
      <div className={`w-full h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
        isCompleted 
          ? 'bg-emerald-50 text-emerald-600' 
          : isLocked 
            ? 'bg-slate-100 text-slate-400'
            : 'bg-indigo-600 text-white shadow-md group-hover:bg-indigo-700'
      }`}>
        {isCompleted ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Ver Resultado
          </>
        ) : isLocked ? (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Bloqueado
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2 fill-current" />
            Comenzar
          </>
        )}
      </div>
    </div>
  );
};
