import React from 'react';
import { Student, Submission, Task } from '../types';
import { Star, Zap, Trophy, Calendar, CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/button';
import { LUINGO_LEVELS } from '../lib/mockData';

interface StudentPassportProps {
  student: Student;
  tasks?: Task[]; // Lista completa de tareas para referencias
  submissions?: Submission[]; // Entregas reales de este alumno
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
  
  // 1. CÁLCULO DE ESTADÍSTICAS REALES
  const totalXP = submissions.length * 15; // 15 XP por tarea
  
  // Calcular Nivel basado en XP
  const currentLevelInfo = LUINGO_LEVELS.slice().reverse().find(l => totalXP >= l.min_xp) || LUINGO_LEVELS[0];
  
  // Calcular Promedios (Simulando habilidades por falta de metadata específica)
  const averageGrade = submissions.length > 0 
    ? submissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) / submissions.length
    : 0;
  const vocabScore = Math.min(100, averageGrade * 10 + (submissions.length * 5)); // Algoritmo simple
  const grammarScore = Math.min(100, averageGrade * 10);
  const oralScore = Math.min(100, (averageGrade * 8) + (submissions.length * 3));

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      {/* Header Pasaporte */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white p-6 md:p-8 relative shrink-0 rounded-t-3xl">
        {/* Abstract decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        {/* Botón Cerrar Superior (Más accesible) */}
        <button 
          onClick={onBack}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors z-20"
          aria-label="Cerrar pasaporte"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/20 p-1 shrink-0">
            <img 
              src={student.avatar_url} 
              alt={student.name} 
              className="w-full h-full rounded-full object-cover bg-slate-700"
            />
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{student.name}</h1>
              <span className={`bg-gradient-to-r ${currentLevelInfo.color} text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20 shadow-lg`}>
                {currentLevelInfo.icon} {currentLevelInfo.label}
              </span>
            </div>
            <p className="text-slate-300 text-xs md:text-sm mb-3 md:mb-4">{student.email}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 md:py-2 rounded-xl flex items-center gap-2 border border-white/10">
                <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400 fill-amber-400" />
                <span className="font-bold text-xs md:text-sm">{totalXP} XP</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 md:py-2 rounded-xl flex items-center gap-2 border border-white/10">
                <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                <span className="font-bold text-xs md:text-sm">{submissions.length} Misiones</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 md:gap-3 w-full md:w-auto md:min-w-[200px]">
            <Button 
              onClick={onAssignTask}
              className="bg-amber-400 hover:bg-amber-500 text-amber-900 font-black h-10 md:h-12 rounded-xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 w-full text-sm md:text-base"
            >
              ✨ Asignar Misión IA
            </Button>
            <Button 
              variant="outline"
              onClick={onBack}
              className="bg-white/10 hover:bg-white/20 text-white border-transparent h-10 md:h-12 rounded-xl font-bold w-full text-sm md:text-base md:hidden"
            >
              Cerrar Pasaporte
            </Button>
          </div>
        </div>
      </div>

      {/* Cuerpo del Pasaporte */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* Columna Izquierda: Stats & Skills */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 border-2 border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm md:text-base">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                Habilidades
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>Vocabulario</span>
                    <span>{vocabScore.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 md:h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 rounded-full" 
                      style={{ width: `${vocabScore}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>Gramática</span>
                    <span>{grammarScore.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 md:h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000 rounded-full" 
                      style={{ width: `${grammarScore}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>Expresión Oral</span>
                    <span>{oralScore.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 md:h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 rounded-full" 
                      style={{ width: `${oralScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen de Progreso */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl md:rounded-3xl p-5 md:p-6 border-2 border-indigo-100">
              <h3 className="font-black text-slate-700 mb-3 text-sm md:text-base">📊 Estadísticas</h3>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Tareas completadas:</span>
                  <span className="font-bold text-slate-800">{submissions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Promedio de notas:</span>
                  <span className="font-bold text-slate-800">{averageGrade.toFixed(1)} / 10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total XP ganado:</span>
                  <span className="font-bold text-indigo-600">{totalXP} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Timeline Real */}
          <div className="lg:col-span-2">
            <h3 className="font-black text-slate-700 mb-4 md:mb-6 flex items-center gap-2 text-lg md:text-xl">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
              Actividad Reciente
            </h3>
            <div className="space-y-3 md:space-y-4 relative before:absolute before:left-4 md:before:left-8 before:top-4 before:bottom-4 before:w-0.5 md:before:w-1 before:bg-slate-200 pb-10">
              {submissions.length === 0 ? (
                <div className="pl-12 md:pl-20 py-6 md:py-8 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-6 h-6 md:w-8 md:h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm md:text-base font-medium">
                      No hay actividad reciente
                    </p>
                    <p className="text-slate-300 text-xs md:text-sm mt-1">
                      ¡Asigna una tarea para comenzar!
                    </p>
                  </div>
                </div>
              ) : (
                submissions
                  .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime())
                  .map((sub, index) => (
                    <div key={sub.id} className="relative pl-12 md:pl-20 animate-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="absolute left-2 md:left-4 top-0 w-7 h-7 md:w-9 md:h-9 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full border-3 md:border-4 border-white shadow-md flex items-center justify-center z-10">
                        <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
                      </div>
                      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border-2 border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-800 text-sm md:text-base flex-1 pr-2">
                            Completó "{sub.task_title}"
                          </h4>
                          <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg whitespace-nowrap">
                            {new Date(sub.submitted_at || Date.now()).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500">
                          <span className="text-emerald-600 font-black">+15 XP</span>
                          <span>•</span>
                          <span className="font-bold text-slate-700">Nota: {(sub.grade || 0).toFixed(1)} / 10</span>
                          {sub.grade && sub.grade >= 8 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 font-bold">⭐ Excelente</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
