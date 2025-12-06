import React from 'react';
import { Student } from '../types';
import { TrendingUp, CheckCircle, Clock, Trophy } from 'lucide-react';

interface StudentCardProps { student: Student; onClick: () => void; }

export const StudentCard: React.FC<StudentCardProps> = ({ student, onClick }) => {
  // ✅ CORRECCIÓN: Si es 0, usamos 0. Evitamos el "1" falso.
  const total = student.total_tasks || 0;
  
  // Lógica segura para la barra de progreso (evitar división por cero)
  const completed = Math.min(student.completed_tasks || 0, total);
  const pending = Math.max(0, total - student.completed_tasks);
  
  // Si el total es 0, el porcentaje es 0 (evita NaN)
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const getLevelColor = (l: string) => {
      if(l.includes('A')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      if(l.includes('B')) return 'bg-blue-100 text-blue-700 border-blue-200';
      return 'bg-purple-100 text-purple-700 border-purple-200';
  }

  return (
    <div onClick={onClick} className="group cursor-pointer bg-white rounded-3xl p-5 shadow-sm border-b-4 border-slate-200 hover:border-indigo-300 transition-all hover:-translate-y-1">
      <div className="flex items-center gap-4 mb-4">
        <img src={student.avatar_url} className="w-14 h-14 rounded-2xl bg-slate-100 object-cover border-2 border-white shadow-md" />
        <div>
            <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600">{student.name}</h4>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getLevelColor(student.current_level_code || 'A1')}`}>
                Nivel {student.current_level_code}
            </span>
        </div>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Progreso</span>
              <span>{percent}%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
          </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          <div className="text-center">
              <p className="text-xl font-black text-indigo-600">{student.completed_tasks}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Hechas</p>
          </div>
          <div className="text-center border-l border-slate-100">
              {/* ✅ AHORA MUESTRA EL PENDIENTE REAL */}
              <p className="text-xl font-black text-rose-500">{pending}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Faltan</p>
          </div>
          <div className="text-center border-l border-slate-100">
              <p className="text-xl font-black text-emerald-600">{(student.average_grade || 0).toFixed(1)}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Nota</p>
          </div>
      </div>
    </div>
  );
};
