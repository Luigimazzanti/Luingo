import React from 'react';
import { Student } from '../types';
import { TrendingUp, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';

interface StudentCardProps {
  student: Student;
  onClick: () => void;
  totalMaterials?: number; // Para calcular % de materiales vistos
}

/**
 * COMPONENTE TARJETA DE ESTUDIANTE
 * 
 * Diseño Clean & Professional (No Circus)
 * - Información clara
 * - Colores semánticos suaves
 * - Niveles CEFR (A1-C2)
 */
export const StudentCard: React.FC<StudentCardProps> = ({ 
  student, 
  onClick,
  totalMaterials = 3 
}) => {
  
  const getCEFRLevel = (level: number) => {
      if (level <= 5) return { label: 'A1', color: 'bg-slate-100 text-slate-600 border-slate-300' };
      if (level <= 10) return { label: 'A2', color: 'bg-sky-100 text-sky-700 border-sky-300' };
      if (level <= 15) return { label: 'B1', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
      if (level <= 20) return { label: 'B2', color: 'bg-amber-100 text-amber-700 border-amber-300' };
      if (level <= 25) return { label: 'C1', color: 'bg-orange-100 text-orange-700 border-orange-300' };
      return { label: 'C2', color: 'bg-rose-100 text-rose-700 border-rose-300' };
  };

  const cefr = getCEFRLevel(student.level);
  const completionPercentage = (student.completed_tasks / student.total_tasks) * 100;
  const materialsViewedPercentage = (student.materials_viewed.length / totalMaterials) * 100;
  
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-3xl p-5 shadow-sm border-b-4 border-slate-200 hover:border-amber-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Cabecera con avatar y nombre */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border-2 border-indigo-100 overflow-hidden group-hover:rotate-6 transition-transform duration-300">
                <img
                    src={student.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={student.name}
                    className="w-full h-full object-cover"
                />
            </div>
            {completionPercentage === 100 && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                    <CheckCircle className="w-4 h-4 text-white font-bold" />
                </div>
            )}
        </div>
        <div className="min-w-0 flex-1">
            <h4 className="font-black text-slate-800 group-hover:text-amber-500 transition-colors text-lg truncate leading-tight">
                {student.name}
            </h4>
            <div className={`inline-flex items-center px-2 py-0.5 rounded-lg border-2 text-[10px] font-black mt-1 uppercase tracking-wide ${cefr.color}`}>
                Nivel {cefr.label}
            </div>
        </div>
      </div>

      {/* Progreso General */}
      <div className="space-y-4 mb-5">
        {/* Tareas */}
        <div>
            <div className="flex justify-between text-xs mb-2 font-bold">
                <span className="text-slate-400 uppercase tracking-wider">Misiones</span>
                <span className="text-slate-800">{student.completed_tasks}/{student.total_tasks}</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                    className="h-full bg-amber-400 rounded-full border-r-2 border-amber-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]" 
                    style={{ width: `${completionPercentage}%` }}
                />
            </div>
        </div>

        {/* Materiales */}
        <div>
            <div className="flex justify-between text-xs mb-2 font-bold">
                <span className="text-slate-400 uppercase tracking-wider">XP Ganada</span>
                <span className="text-slate-800">{student.materials_viewed.length}/{totalMaterials}</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                    className="h-full bg-sky-400 rounded-full border-r-2 border-sky-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]" 
                    style={{ width: `${materialsViewedPercentage}%` }}
                />
            </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="pt-4 border-t-2 border-dashed border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-slate-50 text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-50 transition-colors">
                <TrendingUp className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Nota</p>
                <p className="text-lg font-black text-slate-800 leading-none">{student.average_grade.toFixed(1)}</p>
            </div>
        </div>
        
        <div className="text-right group-hover:translate-x-[-4px] transition-transform">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Pendientes</p>
            <p className="text-lg font-black text-rose-500 leading-none">{student.total_tasks - student.completed_tasks}</p>
        </div>
      </div>
    </div>
  );
};
