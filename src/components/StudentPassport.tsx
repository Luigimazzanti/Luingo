import React, { useState } from 'react';
import { Student, Submission, Task } from '../types';
import { Star, Zap, Trophy, Calendar, CheckCircle2, X, ChevronDown, ChevronUp } from 'lucide-react';
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

  // 1. LÓGICA DE DATOS
  const totalXP = submissions.length * 15;
  const currentLevelInfo = LUINGO_LEVELS.slice().reverse().find(l => totalXP >= l.min_xp) || LUINGO_LEVELS[0];

  // Cálculo de nota media robusto (Fallback si Moodle devuelve 0)
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

  // Paginación del historial
  const historyLimit = 5;
  // Ordenar por fecha (más reciente primero) si tenemos fecha, o por ID
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const dateA = new Date(a.submitted_at || 0).getTime();
    const dateB = new Date(b.submitted_at || 0).getTime();
    return dateB - dateA; // Más reciente primero
  });
  const visibleSubmissions = showAllHistory ? sortedSubmissions : sortedSubmissions.slice(0, historyLimit);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      
      {/* 1. PORTADA (Header Visual Ajustado) */}
      <div className={`relative h-56 shrink-0 bg-gradient-to-r ${currentLevelInfo.color} overflow-hidden`}>
         {/* Patrón de fondo */}
         <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
         <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
         <div className="absolute top-10 right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
         
         <button
            onClick={onBack}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-sm transition-all z-30"
            aria-label="Cerrar pasaporte"
         >
            <X className="w-6 h-6" />
         </button>

         <div className="absolute bottom-4 right-4 text-white/80 text-xs font-black uppercase tracking-widest">
            Pasaporte Oficial LuinGo
         </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 md:px-8 -mt-20 z-10"> 
         <div className="max-w-5xl mx-auto">
            
            {/* PERFIL CARD (Tarjeta Flotante) */}
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border-4 border-white mb-8 relative">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                    
                    {/* Avatar (Superpuesto y ajustado) */}
                    <div className="-mt-20 md:-mt-24 relative shrink-0">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-white shadow-2xl overflow-hidden bg-slate-200">
                            <img 
                              src={student.avatar_url} 
                              alt={student.name} 
                              className="w-full h-full object-cover"
                            />
                        </div>
                        <div 
                          className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-xl border-2 border-slate-100" 
                          title={currentLevelInfo.label}
                        >
                            {currentLevelInfo.icon}
                        </div>
                    </div>

                    {/* Info Principal */}
                    <div className="flex-1 text-center md:text-left w-full">
                        <h1 className="text-2xl md:text-4xl font-black text-slate-800 leading-tight mb-2 whitespace-normal">
                          {student.name}
                        </h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                             <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-slate-200">
                                {student.email}
                             </span>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white bg-gradient-to-r ${currentLevelInfo.color}`}>
                                {currentLevelInfo.icon} Nivel {currentLevelInfo.level}
                             </span>
                        </div>

                        {/* Acciones (Botones Full Width en móvil) */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Button 
                              onClick={onAssignTask} 
                              className="w-full sm:flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black h-12 rounded-xl shadow-md border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all text-sm md:text-base whitespace-normal leading-tight"
                            >
                                ✨ Nueva Misión
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={onBack} 
                              className="w-full sm:w-auto border-2 border-slate-200 hover:bg-slate-50 text-slate-500 font-bold h-12 rounded-xl"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mini Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t-2 border-slate-100">
                     <div className="text-center">
                        <p className="text-2xl font-black text-slate-800">{totalXP}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP Total</p>
                     </div>
                     <div className="text-center">
                        <p className="text-2xl font-black text-slate-800">{submissions.length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Misiones</p>
                     </div>
                     <div className="text-center">
                        <p className="text-2xl font-black text-emerald-500">{averageGrade.toFixed(1)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nota Media</p>
                     </div>
                     <div className="text-center">
                        <p className="text-2xl font-black text-indigo-500">5</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Racha Días</p>
                     </div>
                </div>
            </div>

            {/* GRID DE DETALLES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                
                {/* COLUMNA IZQUIERDA: Habilidades */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100">
                        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                            Stats
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                    <span>Vocabulario</span>
                                    <span>{vocabScore.toFixed(0)}%</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000" 
                                      style={{ width: `${vocabScore}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                    <span>Gramática</span>
                                    <span>{grammarScore.toFixed(0)}%</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000" 
                                      style={{ width: `${grammarScore}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Card adicional de progreso */}
                        <div className={`mt-6 p-4 rounded-2xl bg-gradient-to-br ${currentLevelInfo.color} text-white`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="text-2xl">{currentLevelInfo.icon}</div>
                                <div>
                                    <div className="text-xs font-bold opacity-80 uppercase tracking-wider">Nivel Actual</div>
                                    <div className="text-lg font-black">{currentLevelInfo.label}</div>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/20">
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                    <span>Progreso</span>
                                    <span>{totalXP} XP</span>
                                </div>
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-white/80 rounded-full transition-all duration-1000" 
                                      style={{ 
                                        width: `${Math.min(100, (totalXP / (LUINGO_LEVELS[Math.min(LUINGO_LEVELS.findIndex(l => l.label === currentLevelInfo.label) + 1, LUINGO_LEVELS.length - 1)]?.min_xp || 1000)) * 100)}%` 
                                      }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Historial */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border-2 border-slate-100">
                        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                            <Calendar className="w-5 h-5 text-indigo-500" /> Historial de Actividad
                        </h3>
                        
                        <div className="space-y-4">
                            {submissions.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Trophy className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-medium">Aún no hay actividad registrada.</p>
                                    <p className="text-xs text-slate-300 mt-1">Las tareas completadas aparecerán aquí</p>
                                </div>
                            ) : (
                                <>
                                    {visibleSubmissions.map((sub, idx) => {
                                        // Cálculo de nota individual para cada tarjeta (FIX PRINCIPAL)
                                        const displayGrade = (sub.grade && sub.grade > 0) 
                                            ? sub.grade 
                                            : (sub.score && sub.total) 
                                                ? (sub.score / sub.total) * 10 
                                                : 0;
                                        
                                        return (
                                            <div 
                                              key={idx} 
                                              className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-default"
                                            >
                                                {/* Icono de Estado */}
                                                <div className={cn(
                                                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl shadow-sm transition-transform group-hover:scale-110",
                                                  displayGrade >= 7 ? 'bg-emerald-100 text-emerald-600' : 
                                                  displayGrade >= 5 ? 'bg-amber-100 text-amber-600' : 
                                                  'bg-rose-100 text-rose-600'
                                                )}>
                                                    {displayGrade >= 9 ? '🏆' : displayGrade >= 5 ? '⭐' : '📝'}
                                                </div>

                                                {/* Contenido */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-bold text-slate-800 pr-2 whitespace-normal leading-tight">
                                                          {sub.task_title}
                                                        </h4>
                                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg shrink-0 ml-2">
                                                            {new Date(sub.submitted_at || Date.now()).toLocaleDateString('es-ES', { 
                                                              day: '2-digit', 
                                                              month: 'short' 
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className={cn(
                                                          "text-sm font-black",
                                                          displayGrade >= 5 ? 'text-emerald-600' : 'text-rose-500'
                                                        )}>
                                                            {displayGrade.toFixed(1)} <span className="text-[10px] font-bold text-slate-400 uppercase">Nota</span>
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-400">•</span>
                                                        <span className="text-xs font-bold text-slate-500">
                                                          {sub.score || 0}/{sub.total || 0} Aciertos
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-400">•</span>
                                                        <span className="text-xs font-bold text-indigo-600">+15 XP</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Botón Ver Más / Ver Menos */}
                                    {submissions.length > historyLimit && (
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => setShowAllHistory(!showAllHistory)}
                                            className="w-full mt-4 text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl h-12"
                                        >
                                            {showAllHistory ? (
                                                <>
                                                  <ChevronUp className="w-4 h-4 mr-2" /> 
                                                  Ver menos
                                                </>
                                            ) : (
                                                <>
                                                  <ChevronDown className="w-4 h-4 mr-2" /> 
                                                  Ver {submissions.length - historyLimit} más
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
    </div>
  );
};
