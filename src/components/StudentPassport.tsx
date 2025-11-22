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
      
      {/* 1. PORTADA (Header Visual Mejorado) */}
      <div className={`relative h-48 shrink-0 bg-gradient-to-r ${currentLevelInfo.color} overflow-hidden`}>
         {/* Decoración de fondo */}
         <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
         <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
         <div className="absolute top-10 right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
         
         {/* MARCA DE AGUA (Posición Corregida: Arriba Izquierda) */}
         <div className="absolute top-6 left-6 flex items-center gap-2 opacity-80">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-white font-black border border-white/20">
              L
            </div>
            <span className="text-white/60 font-bold tracking-widest text-xs uppercase">
              Pasaporte LuinGo
            </span>
         </div>

         {/* Botón Cerrar */}
         <button
            onClick={onBack}
            className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full backdrop-blur-md transition-all z-30 border border-white/10"
            aria-label="Cerrar pasaporte"
         >
            <X className="w-5 h-5" />
         </button>
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 md:px-8 -mt-16 z-10"> 
         <div className="max-w-4xl mx-auto">
            
            {/* PERFIL CARD */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border-4 border-white mb-6 relative">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    
                    {/* Avatar (Overlap limpio con más espacio) */}
                    <div className="relative -mt-24 shrink-0">
                        <div className="w-36 h-36 rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-slate-100">
                            <img 
                              src={student.avatar_url} 
                              alt={student.name} 
                              className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Icono de Nivel Flotante */}
                        <div 
                          className="absolute bottom-1 right-1 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg text-2xl border-2 border-slate-50" 
                          title={currentLevelInfo.label}
                        >
                            {currentLevelInfo.icon}
                        </div>
                    </div>

                    {/* Info Principal (Diseño Mejorado con Gradiente Mágico) */}
                    <div className="flex-1 text-center md:text-left w-full pt-4">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight mb-2">
                          {student.name}
                        </h1>
                        
                        {/* BADGE DE NIVEL CON GRADIENTE MÁGICO (Diseño "Adepto de Agua") */}
                        <div className="flex flex-col md:flex-row items-center md:items-center gap-3 mb-5">
                            <div className="flex items-center gap-2">
                                <span className="text-3xl">{currentLevelInfo.icon}</span>
                                <span 
                                  className={cn(
                                    "text-2xl font-black uppercase tracking-wide bg-gradient-to-r bg-clip-text text-transparent",
                                    currentLevelInfo.color
                                  )}
                                >
                                  {currentLevelInfo.label}
                                </span>
                            </div>
                            <span className="text-slate-400 text-sm font-medium px-2 py-1 bg-slate-50 rounded-full">
                              {student.email}
                            </span>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Button 
                              onClick={onAssignTask} 
                              className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black h-12 rounded-xl shadow-lg border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"
                            >
                                ✨ Nueva Misión
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={onBack} 
                              className="w-full sm:w-auto border-2 border-slate-200 text-slate-500 font-bold h-12 rounded-xl hover:bg-slate-50"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Rápidas (Mejoradas con más espacio) */}
                <div className="grid grid-cols-3 gap-3 mt-10 pt-6 border-t-2 border-slate-100">
                     <div className="text-center p-3 rounded-xl bg-amber-50 border-2 border-amber-100">
                        <p className="text-2xl font-black text-amber-600">{totalXP}</p>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">XP Total</p>
                     </div>
                     <div className="text-center p-3 rounded-xl bg-purple-50 border-2 border-purple-100">
                        <p className="text-2xl font-black text-purple-600">{submissions.length}</p>
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Misiones</p>
                     </div>
                     <div className="text-center p-3 rounded-xl bg-emerald-50 border-2 border-emerald-100">
                        <p className="text-2xl font-black text-emerald-600">{averageGrade.toFixed(1)}</p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Nota Media</p>
                     </div>
                </div>
            </div>

            {/* DETALLES (Grid Responsive) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                
                {/* Habilidades */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-slate-100 h-full">
                        <h3 className="font-black text-slate-700 mb-5 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Habilidades
                        </h3>
                        <div className="space-y-5">
                            <SkillBar label="Vocabulario" percent={vocabScore} color="bg-emerald-500" />
                            <SkillBar label="Gramática" percent={grammarScore} color="bg-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Historial */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border-2 border-slate-100">
                        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                            <Calendar className="w-5 h-5 text-indigo-500" /> Historial de Actividad
                        </h3>
                        <div className="space-y-3">
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
                                        // Cálculo seguro de nota
                                        const displayGrade = (sub.grade && sub.grade > 0) 
                                            ? sub.grade 
                                            : (sub.score && sub.total) 
                                                ? (sub.score / sub.total) * 10 
                                                : 0;
                                        
                                        return (
                                            <div 
                                              key={idx} 
                                              className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                                            >
                                                <div className={cn(
                                                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-black shadow-sm",
                                                  displayGrade >= 6 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                                )}>
                                                    {displayGrade.toFixed(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-700 text-sm whitespace-normal leading-tight">
                                                      {sub.task_title}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                        {new Date(sub.submitted_at || Date.now()).toLocaleDateString('es-ES', {
                                                          day: '2-digit',
                                                          month: 'short'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-slate-600">
                                                      {sub.score || 0}/{sub.total || 0}
                                                    </span>
                                                    <p className="text-[9px] text-slate-400 uppercase font-bold">
                                                      Aciertos
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {submissions.length > historyLimit && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => setShowAllHistory(!showAllHistory)}
                                            className="w-full text-indigo-600 font-bold text-xs mt-2 hover:bg-indigo-50 rounded-xl h-10"
                                        >
                                            {showAllHistory ? (
                                              <>
                                                <ChevronUp className="w-4 h-4 mr-1" /> Ver menos
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDown className="w-4 h-4 mr-1" /> Ver {submissions.length - historyLimit} más
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

// Componente Auxiliar para Barras de Habilidades
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