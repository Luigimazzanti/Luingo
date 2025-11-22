import React, { useState } from 'react';
import { Student, Submission, Task } from '../types';
import { Star, Zap, Trophy, Calendar, CheckCircle2, X, ChevronDown, ChevronUp, Medal } from 'lucide-react';
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
    (s.grade && s.grade > 0) 
      ? s.grade 
      : (s.score && s.total) 
        ? (s.score / s.total) * 10 
        : 0
  ).filter(g => g > 0);

  const averageGrade = validGrades.length > 0 
    ? validGrades.reduce((acc, curr) => acc + curr, 0) / validGrades.length 
    : 0;

  const vocabScore = Math.min(100, (averageGrade * 10) + (submissions.length * 2));
  const grammarScore = Math.min(100, (averageGrade * 10) + 10);

  const historyLimit = 5;
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const dateA = new Date(a.submitted_at || 0).getTime();
    const dateB = new Date(b.submitted_at || 0).getTime();
    return dateB - dateA;
  });
  const visibleSubmissions = showAllHistory ? sortedSubmissions : sortedSubmissions.slice(0, historyLimit);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      
      {/* 1. PORTADA (Header más compacto) */}
      <div className={`relative h-40 shrink-0 bg-gradient-to-r ${currentLevelInfo.color} overflow-hidden`}>
         <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
         <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
         
         {/* Marca de Agua */}
         <div className="absolute top-6 left-6 flex items-center gap-2 opacity-90">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-white font-black border border-white/20">
              L
            </div>
            <span className="text-white/70 font-bold tracking-widest text-xs uppercase">
              Pasaporte Oficial
            </span>
         </div>

         <button 
           onClick={onBack} 
           className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full backdrop-blur-md transition-all z-30 border border-white/10"
           aria-label="Cerrar pasaporte"
         >
            <X className="w-5 h-5" />
         </button>
      </div>

      {/* 2. CONTENIDO PRINCIPAL (Margen negativo reducido para evitar cortes) */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 md:px-8 -mt-12 z-10 relative"> 
         <div className="max-w-4xl mx-auto">
            
            {/* TARJETA DE PERFIL PRINCIPAL (overflow-visible crítico) */}
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border-4 border-white mb-6 relative overflow-visible">
                <div className="flex flex-col md:flex-row items-start gap-6">
                    
                    {/* AVATAR (Corregido: -mt-16/-mt-20 menos agresivo) */}
                    <div className="-mt-16 md:-mt-20 relative shrink-0 mx-auto md:mx-0">
                        <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl border-[6px] border-white shadow-lg overflow-hidden bg-slate-100">
                            <img 
                              src={student.avatar_url} 
                              alt={student.name} 
                              className="w-full h-full object-cover" 
                            />
                        </div>
                        {/* Icono Elemento Flotante */}
                        <div 
                          className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-xl border-2 border-slate-50 ring-4 ring-slate-50/50" 
                          title={currentLevelInfo.label}
                        >
                            {currentLevelInfo.icon}
                        </div>
                    </div>

                    {/* INFO USUARIO */}
                    <div className="flex-1 text-center md:text-left w-full pt-2">
                        
                        {/* NIVEL (Badge Superior - whitespace-nowrap para evitar cortes) */}
                        <div className="flex justify-center md:justify-start mb-2">
                            <div className={cn(
                              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-sm whitespace-nowrap bg-gradient-to-r",
                              currentLevelInfo.color
                            )}>
                                <Medal className="w-3.5 h-3.5" />
                                <span className="uppercase tracking-wide">
                                  {currentLevelInfo.label}
                                </span>
                            </div>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight mb-1">
                          {student.name}
                        </h1>
                        <p className="text-slate-400 text-sm font-medium mb-4">
                          {student.email}
                        </p>

                        {/* Botones */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto md:mx-0">
                            <Button 
                              onClick={onAssignTask} 
                              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold h-11 rounded-xl shadow-md border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"
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

                {/* STATS GRID (Horizontal con separadores) */}
                <div className="grid grid-cols-3 gap-2 mt-8 pt-6 border-t-2 border-slate-100">
                     <div className="text-center p-2">
                        <p className="text-2xl font-black text-amber-500">{totalXP}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">XP Total</p>
                     </div>
                     <div className="text-center p-2 border-l-2 border-slate-100">
                        <p className="text-2xl font-black text-purple-500">{submissions.length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Misiones</p>
                     </div>
                     <div className="text-center p-2 border-l-2 border-slate-100">
                        <p className="text-2xl font-black text-emerald-500">{averageGrade.toFixed(1)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nota Media</p>
                     </div>
                </div>
            </div>

            {/* ZONA INFERIOR: Habilidades + Historial */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10">
                
                {/* Habilidades */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 h-fit">
                    <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Habilidades
                    </h3>
                    <div className="space-y-4">
                        <SkillBar label="Vocabulario" percent={vocabScore} color="bg-emerald-500" />
                        <SkillBar label="Gramática" percent={grammarScore} color="bg-blue-500" />
                    </div>
                </div>

                {/* Historial */}
                <div className="md:col-span-2 bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100">
                    <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" /> Historial de Misiones
                    </h3>
                    
                    <div className="space-y-3">
                        {submissions.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Trophy className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-slate-400 font-medium text-sm">Sin actividad registrada.</p>
                                <p className="text-xs text-slate-300 mt-1 italic">Las tareas completadas aparecerán aquí</p>
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
                                          className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all"
                                        >
                                            <div className={cn(
                                              "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-black text-white shadow-sm",
                                              grade >= 6 ? 'bg-emerald-400' : 'bg-rose-400'
                                            )}>
                                                <span className="text-lg leading-none">{grade.toFixed(0)}</span>
                                                <span className="text-[8px] opacity-80 uppercase">Nota</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-700 text-sm truncate">
                                                  {sub.task_title}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                  {new Date(sub.submitted_at || Date.now()).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short'
                                                  })}
                                                </p>
                                            </div>
                                            <div className="text-right px-2">
                                                <div className="text-xs font-black text-slate-500">
                                                  {sub.score || 0}/{sub.total || 0}
                                                </div>
                                                <div className="text-[8px] text-slate-400 uppercase font-bold">
                                                  Aciertos
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {submissions.length > historyLimit && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => setShowAllHistory(!showAllHistory)} 
                                      className="w-full text-indigo-600 text-xs font-bold mt-2 hover:bg-indigo-50 rounded-xl h-10"
                                    >
                                        {showAllHistory ? (
                                          <>
                                            <ChevronUp className="w-4 h-4 mr-1" /> Ver menos
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="w-4 h-4 mr-1" /> Ver historial completo ({submissions.length - historyLimit} más)
                                          </>
                                        )}
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
  );
};

const SkillBar = ({ label, percent, color }: { label: string, percent: number, color: string }) => (
  <div>
    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
      <span>{label}</span>
      <span>{percent.toFixed(0)}%</span>
    </div>
    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={cn("h-full rounded-full transition-all duration-1000", color)} 
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);
