import React from 'react';
import { Student, Submission, Task } from '../types';
import { Star, Zap, Trophy, Calendar, CheckCircle2, X, Layout } from 'lucide-react';
import { Button } from './ui/button';
import { LUINGO_LEVELS } from '../lib/mockData';

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
  
  // LÓGICA DE DATOS (Mantener igual)
  const totalXP = submissions.length * 15;
  const currentLevelInfo = LUINGO_LEVELS.slice().reverse().find(l => totalXP >= l.min_xp) || LUINGO_LEVELS[0];
  const averageGrade = submissions.length > 0 
    ? submissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) / submissions.length
    : 0;
  const vocabScore = Math.min(100, averageGrade * 10 + (submissions.length * 5));
  const grammarScore = Math.min(100, averageGrade * 10);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      
      {/* 1. PORTADA (Header Visual) */}
      <div className={`relative h-48 shrink-0 bg-gradient-to-r ${currentLevelInfo.color} overflow-hidden`}>
         {/* Patrón de fondo decorativo */}
         <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
         <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
         <div className="absolute top-10 right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
         
         {/* Botón Cerrar Flotante */}
         <button 
            onClick={onBack}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-sm transition-all z-20"
            aria-label="Cerrar pasaporte"
         >
            <X className="w-6 h-6" />
         </button>

         {/* Badge Oficial */}
         <div className="absolute bottom-4 right-4 text-white/80 text-xs font-black uppercase tracking-widest">
            Pasaporte Oficial LuinGo
         </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 md:px-8">
         <div className="max-w-5xl mx-auto">
            
            {/* PERFIL CARD (Con overlap negativo para efecto profesional) */}
            <div className="relative -mt-16 mb-8 flex flex-col md:flex-row items-center md:items-end gap-6">
                
                {/* Avatar con Overlap */}
                <div className="relative group shrink-0">
                    <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-2xl overflow-hidden bg-white">
                        <img 
                          src={student.avatar_url} 
                          alt={student.name} 
                          className="w-full h-full object-cover"
                        />
                    </div>
                    {/* Badge de Nivel */}
                    <div 
                      className="absolute -bottom-3 -right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-2xl border-2 border-slate-100" 
                      title={currentLevelInfo.label}
                    >
                        {currentLevelInfo.icon}
                    </div>
                </div>

                {/* Info Principal */}
                <div className="flex-1 pb-2 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">{student.name}</h1>
                    <div className="flex flex-col md:flex-row items-center md:items-center gap-2 text-slate-500">
                        <span className="bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1 rounded-lg text-xs font-black uppercase text-indigo-700 tracking-wider border border-indigo-200">
                            Estudiante
                        </span>
                        <span className="text-sm font-medium hidden md:inline">•</span>
                        <span className="text-sm font-medium">{student.email}</span>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 w-full md:w-auto">
                    <Button 
                      onClick={onAssignTask} 
                      className="flex-1 md:flex-none bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black h-12 rounded-xl shadow-lg shadow-indigo-200 border-b-4 border-indigo-900 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        ✨ Nueva Misión
                    </Button>
                </div>
            </div>

            {/* GRID DE DATOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* COLUMNA IZQUIERDA: Estadísticas */}
                <div className="space-y-6">
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                            <div className="text-amber-400 mb-2 flex justify-center">
                                <Star className="w-6 h-6 fill-amber-400" />
                            </div>
                            <div className="text-2xl font-black text-slate-800">{totalXP}</div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Puntos XP</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                            <div className="text-purple-500 mb-2 flex justify-center">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div className="text-2xl font-black text-slate-800">{submissions.length}</div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Misiones</div>
                        </div>
                    </div>

                    {/* Card de Nivel Actual */}
                    <div className={`bg-gradient-to-br ${currentLevelInfo.color} p-6 rounded-2xl border-2 border-white shadow-lg text-white`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="text-4xl">{currentLevelInfo.icon}</div>
                            <div>
                                <div className="text-xs font-bold opacity-80 uppercase tracking-wider">Nivel Actual</div>
                                <div className="text-2xl font-black">{currentLevelInfo.label}</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span>Progreso</span>
                                <span>{totalXP} / {LUINGO_LEVELS[Math.min(LUINGO_LEVELS.findIndex(l => l.label === currentLevelInfo.label) + 1, LUINGO_LEVELS.length - 1)].min_xp} XP</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-white/80 rounded-full transition-all duration-1000" 
                                  style={{ 
                                    width: `${Math.min(100, (totalXP / LUINGO_LEVELS[Math.min(LUINGO_LEVELS.findIndex(l => l.label === currentLevelInfo.label) + 1, LUINGO_LEVELS.length - 1)].min_xp) * 100)}%` 
                                  }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Habilidades */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" /> Habilidades
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                                    <span>Vocabulario</span>
                                    <span>{vocabScore.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000" 
                                      style={{ width: `${vocabScore}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                                    <span>Gramática</span>
                                    <span>{grammarScore.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000" 
                                      style={{ width: `${grammarScore}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Resumen de Progreso */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100">
                        <h3 className="font-black text-slate-700 mb-3 text-sm">📊 Resumen</h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Completadas:</span>
                                <span className="font-bold text-slate-800">{submissions.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Promedio:</span>
                                <span className="font-bold text-slate-800">{averageGrade.toFixed(1)} / 10</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Total XP:</span>
                                <span className="font-bold text-indigo-600">{totalXP} XP</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Timeline */}
                <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 mb-6 text-xl flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" /> Historial de Misiones
                    </h3>
                    
                    <div className="space-y-0 relative pl-4">
                        {/* Línea conectora */}
                        {submissions.length > 0 && (
                          <div className="absolute top-2 bottom-4 left-[19px] w-0.5 bg-gradient-to-b from-slate-200 via-slate-100 to-transparent"></div>
                        )}
                        
                        {submissions.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <Layout className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-400 font-bold">Sin actividad reciente</p>
                                <p className="text-xs text-slate-300 mt-1">Asigna una tarea para empezar</p>
                            </div>
                        ) : (
                            submissions
                              .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime())
                              .map((sub, idx) => (
                                <div key={idx} className="relative pl-8 pb-8 last:pb-0 group animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${idx * 50}ms` }}>
                                    
                                    {/* Punto de línea de tiempo */}
                                    <div className="absolute left-0 top-0 w-10 h-10 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center z-10 group-hover:border-indigo-200 group-hover:scale-110 transition-all shadow-sm">
                                        {(sub.grade || 0) >= 5 ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                                        )}
                                    </div>
                                    
                                    {/* Card de Actividad */}
                                    <div className="bg-gradient-to-br from-slate-50 to-white hover:from-white hover:to-white p-4 rounded-2xl border border-slate-100 group-hover:border-indigo-200 group-hover:shadow-lg transition-all cursor-default">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 text-base md:text-lg mb-1">{sub.task_title}</h4>
                                                <p className="text-xs font-bold text-slate-400">
                                                    {new Date(sub.submitted_at || Date.now()).toLocaleDateString('es-ES', { 
                                                      weekday: 'long', 
                                                      year: 'numeric', 
                                                      month: 'long', 
                                                      day: 'numeric' 
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0 ml-4">
                                                <div className={`text-2xl font-black ${
                                                    (sub.grade || 0) >= 9 ? 'text-amber-500' : 
                                                    (sub.grade || 0) >= 7 ? 'text-emerald-500' : 
                                                    (sub.grade || 0) >= 5 ? 'text-indigo-500' : 'text-rose-500'
                                                }`}>
                                                    {(sub.grade || 0).toFixed(1)}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Nota</div>
                                            </div>
                                        </div>
                                        
                                        {/* Mini detalles */}
                                        <div className="flex flex-wrap gap-2">
                                            {sub.score !== undefined && (
                                              <span className="px-2 py-1 bg-white rounded-lg text-xs font-bold text-slate-500 border border-slate-100 shadow-sm">
                                                  {sub.score} Aciertos
                                              </span>
                                            )}
                                            <span className="px-2 py-1 bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-lg text-xs font-bold text-emerald-700 border border-emerald-200 shadow-sm">
                                                +15 XP
                                            </span>
                                            {(sub.grade || 0) >= 9 && (
                                              <span className="px-2 py-1 bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg text-xs font-bold text-amber-700 border border-amber-200 shadow-sm">
                                                  ⭐ Excelente
                                              </span>
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
    </div>
  );
};
