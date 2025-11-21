import React from 'react';
import { Student } from '../types';
import { Star, Zap, Trophy, Calendar, Play, Mic, X } from 'lucide-react';
import { Button } from './ui/button';

interface StudentPassportProps {
  student: Student;
  onBack: () => void;
  onAssignTask: () => void;
}

export const StudentPassport: React.FC<StudentPassportProps> = ({ student, onBack, onAssignTask }) => {
  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      {/* Header Pasaporte */}
      <div className="bg-slate-800 text-white p-6 relative shrink-0">
        {/* Abstract decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        {/* Botón Cerrar Superior (Más accesible) */}
        <button 
            onClick={onBack}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors z-20"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <div className="w-24 h-24 rounded-full border-4 border-white/20 p-1 shrink-0">
                <img 
                    src={student.avatar_url} 
                    alt={student.name} 
                    className="w-full h-full rounded-full object-cover bg-slate-700"
                />
            </div>
            
            <div className="flex flex-col items-center">
                <h1 className="text-2xl font-black tracking-tight leading-tight">{student.name}</h1>
                <p className="text-slate-400 text-sm mb-2">{student.email}</p>
                 <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Nivel {student.level}
                </span>
            </div>
            
            <div className="flex gap-2 w-full justify-center mt-2">
                 <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg flex flex-col items-center min-w-[80px]">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 mb-1" />
                    <span className="font-bold text-sm">{student.xp_points} XP</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg flex flex-col items-center min-w-[80px]">
                    <Trophy className="w-4 h-4 text-purple-400 mb-1" />
                    <span className="font-bold text-sm">{student.completed_tasks}</span>
                    <span className="text-[10px] text-white/50">Misiones</span>
                </div>
            </div>

            <Button 
                onClick={onAssignTask}
                className="w-full bg-amber-400 hover:bg-amber-500 text-amber-900 font-black h-12 rounded-xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 mt-2"
            >
                ✨ Asignar Misión IA
            </Button>
        </div>
      </div>

      {/* Cuerpo Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Stats Section */}
            <div className="bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Progreso de Habilidades
                </h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                            <span>Vocabulario</span>
                            <span>85%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 w-[85%] rounded-full"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                            <span>Gramática</span>
                            <span>60%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 w-[60%] rounded-full"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                            <span>Oral</span>
                            <span>45%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 w-[45%] rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline Section */}
            <div>
                <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    Actividad Reciente
                </h3>

                <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                    {/* Item 1: Tarea Completada */}
                    <div className="relative pl-14">
                        <div className="absolute left-3 top-0 w-7 h-7 bg-emerald-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10">
                            <Trophy className="w-3 h-3 text-emerald-600" />
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-emerald-200 transition-all group">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-slate-800 text-sm">Completó "Misión Frutal"</h4>
                                <span className="text-[10px] font-bold text-slate-400">2h</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                <span className="text-emerald-600 font-black">+50 XP</span>
                                <span>•</span>
                                <span>Score: 5/5</span>
                            </div>
                             <div className="bg-amber-50 p-2 rounded-lg flex items-center gap-3 border border-amber-100 max-w-xs">
                                <button className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-amber-500 shrink-0">
                                    <Play className="w-2 h-2 fill-current ml-0.5" />
                                </button>
                                <div>
                                    <div className="h-1 w-16 bg-amber-200 rounded-full mb-1"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Item 2: Comentario */}
                    <div className="relative pl-14">
                        <div className="absolute left-3 top-0 w-7 h-7 bg-indigo-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10">
                            <Mic className="w-3 h-3 text-indigo-600" />
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-slate-800 text-sm">Practicó Pronunciación</h4>
                                <span className="text-[10px] font-bold text-slate-400">Ayer</span>
                            </div>
                            <p className="text-slate-600 text-xs italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">"Me gusta mucho la biblioteca."</p>
                        </div>
                    </div>
                </div>
            </div>
      </div>
    </div>
  );
};
