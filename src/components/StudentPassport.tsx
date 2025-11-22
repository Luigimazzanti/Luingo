import React, { useState } from 'react';
import { Student, Submission, Task } from '../types';
import { Star, Zap, Trophy, Calendar, CheckCircle2, X, ChevronDown, ChevronUp, Medal, Layout } from 'lucide-react';
import { Button } from './ui/button';
import { LUINGO_LEVELS } from '../lib/mockData';
import { cn } from '../lib/utils';

interface StudentPassportProps {
  student: Student;
  tasks?: Task[];
  submissions?: Submission[];
  onBack: () => void;
  onAssignTask: () => void;
}

export const StudentPassport: React.FC<StudentPassportProps> = ({ 
  student, 
  tasks = [], 
  submissions = [], 
  onBack, 
  onAssignTask 
}) => {
  const [showAllHistory, setShowAllHistory] = useState(false);

  // LÓGICA DE DATOS
  const totalXP = submissions.length * 15;
  const currentLevelInfo = LUINGO_LEVELS.slice().reverse().find(l => totalXP >= l.min_xp) || LUINGO_LEVELS[0];

  const validGrades = submissions.map(s => 
    (s.grade && s.grade > 0) ? s.grade : (s.score && s.total) ? (s.score / s.total) * 10 : 0
  ).filter(g => g > 0);

  const averageGrade = validGrades.length > 0 
    ? validGrades.reduce((acc, curr) => acc + curr, 0) / validGrades.length 
    : 0;

  const vocabScore = Math.min(100, (averageGrade * 10) + (submissions.length * 2));
  const grammarScore = Math.min(100, (averageGrade * 10) + 10);

  const historyLimit = 5;
  const sortedSubmissions = [...submissions].reverse();
  const visibleSubmissions = showAllHistory ? sortedSubmissions : sortedSubmissions.slice(0, historyLimit);

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      
      {/* 1. HEADER QUE SCROLLEA (Parte del flujo) */}
      <div className={`relative h-48 shrink-0 bg-gradient-to-r ${currentLevelInfo.color}`}>
         <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
         
         {/* Controles Superiores (Ahora se mueven con el scroll) */}
         <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start">
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2 text-white shadow-sm">
                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-indigo-600 font-black text-xs">L</div>
                <span className="font-black text-[10px] md:text-xs tracking-widest uppercase">Pasaporte LuinGo</span>
            </div>
            <button 
                onClick={onBack} 
                className="p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-all"
            >
                <X className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL (Superpuesto con margen negativo) */}
      <div className="px-4 md:px-8 pb-20 -mt-12 relative z-10"> 
         <div className="max-w-4xl mx-auto">
            
            {/* TARJETA DE PERFIL */}
            <div className="bg-white rounded-[2rem] shadow-xl border-4 border-white mb-6 overflow-hidden">
                
                {/* LAYOUT FLEXIBLE (El secreto para no dejar espacios) */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 p-6 pt-0">
                    
                    {/* COLUMNA AVATAR (Sube con margen negativo) */}
                    <div className="relative shrink-0 -mt-16 md:-mt-20">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-[6px] border-white shadow-lg bg-slate-100 overflow-hidden">
                            <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
                        </div>
                        {/* Badge Elemento */}
                        <div 
                          className="absolute -bottom-2 -right-2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-md text-xl md:text-2xl border-4 border-slate-50" 
                          title={currentLevelInfo.label}
                        >
                            {currentLevelInfo.icon}
                        </div>
                    </div>

                    {/* COLUMNA INFO (Fluye natural) */}
                    <div className="flex-1 text-center md:text-left w-full pt-2 md:pt-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 mb-1">
                            <h1 className="text-2xl md:text-4xl font-black text-slate-800 leading-tight">
                              {student.name}
                            </h1>
                            {/* Badge Nivel (Al lado o abajo del nombre) */}
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap mt-1 md:mt-2">
                                <Medal className="w-3 h-3" />
                                <span>{currentLevelInfo.label}</span>
                            </div>
                        </div>
                        
                        <p className="text-slate-400 text-sm font-medium mb-4">{student.email}</p>

                        {/* Botones */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Button 
                              onClick={onAssignTask} 
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl shadow-md border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"
                            >
                                ✨ Nueva Misión
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={onBack} 
                              className="sm:w-auto border-2 border-slate-200 text-slate-500 font-bold h-11 rounded-xl hover:bg-slate-50"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* STATS BAR (Pegado abajo sin huecos) */}
                <div className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100 bg-slate-50/50 mt-4">
                    <div className="p-4 text-center">
                        <div className="text-xl md:text-2xl font-black text-amber-500">{totalXP}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP Total</div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-xl md:text-2xl font-black text-purple-500">{submissions.length}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Misiones</div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-xl md:text-2xl font-black text-emerald-500">{averageGrade.toFixed(1)}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nota Media</div>
                    </div>
                </div>
            </div>

            {/* GRID INFERIOR (Habilidades + Historial) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Habilidades */}
                <div className="md:col-span-1 h-fit">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-slate-100">
                        <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Zap className="w-4 h-4 text-amber-500" /> Habilidades
                        </h3>
                        <div className="space-y-5">
                            <SkillBar label="Vocabulario" percent={vocabScore} color="bg-emerald-500" />
                            <SkillBar label="Gramática" percent={grammarScore} color="bg-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Historial */}
                <div className="md:col-span-2">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-500" /> Historial
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg uppercase">
                              Reciente
                            </span>
                        </div>

                        <div className="space-y-3">
                            {submissions.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                                    <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm font-medium">Sin actividad registrada.</p>
                                </div>
                            ) : (
                                <>
                                    {visibleSubmissions.map((sub, idx) => {
                                        const grade = (sub.grade && sub.grade > 0) 
                                          ? sub.grade 
                                          : (sub.score && sub.total) 
                                            ? (sub.score / sub.total) * 10 
                                            : 0;

                                        return (
                                            <div 
                                              key={idx} 
                                              className="flex items-center gap-4 p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all"
                                            >
                                                <div className={cn(
                                                  "w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 font-black text-white text-sm shadow-sm",
                                                  grade >= 6 ? 'bg-emerald-400' : 'bg-rose-400'
                                                )}>
                                                    {grade.toFixed(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-700 text-sm truncate">
                                                      {sub.task_title}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase">
                                                      {new Date(sub.submitted_at || Date.now()).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right px-2">
                                                    <span className="text-xs font-black text-slate-500">
                                                      {sub.score || 0}/{sub.total || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {submissions.length > historyLimit && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setShowAllHistory(!showAllHistory)}
                                            className="w-full mt-2 text-indigo-600 font-bold text-xs hover:bg-indigo-50"
                                        >
                                            {showAllHistory ? "Mostrar menos" : `Ver ${submissions.length - historyLimit} más`}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const SkillBar = ({ label, percent, color }: { label: string, percent: number, color: string }) => (
    <div>
        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
          <span>{label}</span>
          <span>{percent.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-1000", color)} 
            style={{ width: `${percent}%` }}
          />
        </div>
    </div>
);
