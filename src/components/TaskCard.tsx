import React from 'react';
import { Task, SubmissionStatus } from '../types';
import { Button } from './ui/button';
import { Clock, FileText, PlayCircle, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface TaskCardProps {
  task: Task;
  status: SubmissionStatus; // Estado desde la perspectiva del alumno
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, status, onClick }) => {
  
  // Configuración visual según estado
  const getStatusStyles = () => {
    switch (status) {
      case 'graded':
        return {
          border: 'border-emerald-200',
          bg: 'bg-emerald-50/50',
          icon: <Award className="w-5 h-5 text-emerald-600" />,
          label: 'Revisado',
          actionText: 'Ver Feedback',
          actionVariant: 'outline' as const
        };
      case 'submitted':
        return {
          border: 'border-slate-200',
          bg: 'bg-slate-50',
          icon: <CheckCircle2 className="w-5 h-5 text-slate-400" />,
          label: 'Enviado',
          actionText: 'Esperando Revisión',
          actionVariant: 'ghost' as const
        };
      case 'in_progress':
        return {
          border: 'border-indigo-200',
          bg: 'bg-white',
          icon: <Clock className="w-5 h-5 text-indigo-500" />,
          label: 'En Progreso',
          actionText: 'Continuar',
          actionVariant: 'default' as const
        };
      default: // assigned
        return {
          border: 'border-slate-200',
          bg: 'bg-white',
          icon: <FileText className="w-5 h-5 text-slate-400" />,
          label: 'Pendiente',
          actionText: 'Comenzar',
          actionVariant: 'outline' as const
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div 
        onClick={onClick}
        className={cn(
            "group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1",
            styles.border,
            styles.bg,
            status === 'graded' ? "shadow-emerald-100" : "shadow-slate-100"
        )}
    >
      {/* Etiqueta Superior */}
      <div className="flex justify-between items-start mb-4">
        <span className={cn(
            "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md",
            task.category === 'quiz' ? "bg-rose-100 text-rose-700" : 
            task.category === 'reading' ? "bg-amber-100 text-amber-700" :
            "bg-slate-100 text-slate-600"
        )}>
            {task.category}
        </span>
        {styles.icon}
      </div>

      {/* Contenido */}
      <div className="flex-1 mb-4">
        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
            {task.title}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-2 font-medium">
            {task.description}
        </p>
      </div>

      {/* Footer Metadata */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100/50">
         <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            {task.content_data.type === 'pdf' ? (
                <>
                    <FileText className="w-3 h-3" /> PDF
                </>
            ) : (
                <>
                    <PlayCircle className="w-3 h-3" /> Interactivo
                </>
            )}
            <span>•</span>
            <span>10 min</span>
         </div>

         <Button 
            size="sm" 
            variant={styles.actionVariant}
            className={cn(
                "h-8 text-xs font-bold rounded-lg",
                status === 'in_progress' && "bg-indigo-600 hover:bg-indigo-700 text-white",
                status === 'graded' && "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
            )}
         >
            {styles.actionText}
            {status === 'assigned' && <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />}
         </Button>
      </div>
      
      {/* Status Indicator Badge (Solo si completado) */}
      {status === 'graded' && task.rubric && (
          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-in zoom-in">
              9/10
          </div>
      )}

    </div>
  );
};
