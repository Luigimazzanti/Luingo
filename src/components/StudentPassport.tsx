import React from 'react';
import { Student } from '../types';
import { Star, Zap, Trophy, Calendar, Play, Mic } from 'lucide-react';
import { Button } from './ui/button';

interface StudentPassportProps {
  student: Student;
  onBack: () => void;
  onAssignTask: () => void;
}

export const StudentPassport: React.FC<StudentPassportProps> = ({ student, onBack, onAssignTask }) => {
  return (
    <div className="max-w-6xl mx-auto p-6 animate-in slide-in-from-bottom-8 duration-500">
      {/* Header Pasaporte */}
      <div className="bg-slate-800 text-white rounded-t-[2.5rem] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full border-4 border-white/20 p-1">
                <img 
                    src={student.avatar_url} 
                    alt={student.name} 
                    className="w-full h-full rounded-full object-cover bg-slate-700"
                />
            </div>
            <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-4xl font-black tracking-tight">{student.name}</h1>
                    <span className="bg-emerald-500 text-emerald-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                        Nivel {student.level}
                    </span>
                </div>
                <p className="text-slate-400 font-medium text-lg mb-6">{student.email}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        <span className="font-bold">{student.xp_points} XP</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-purple-400" />
                        <span className="font-bold">{student.completed_tasks} Misiones</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-400" />
                        <span className="font-bold">Racha de 5 días</span>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[200px]">
                <Button 
                    onClick={onAssignTask}
                    className="bg-amber-400 hover:bg-amber-500 text-amber-900 font-black h-12 rounded-xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-1"
                >
                    ✨ Asignar Misión IA
                </Button>
                <Button 
                    variant="outline"
                    onClick={onBack}
                    className="bg-white/10 hover:bg-white/20 text-white border-transparent h-12 rounded-xl font-bold"
                >
                    Cerrar Pasaporte
                </Button>
            </div>
        </div>
      </div>

      {/* Cuerpo del Pasaporte */}
      <div className="bg-white rounded-b-[2.5rem] border-b-8 border-x-2 border-slate-200 p-8 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna Izquierda: Stats & Skills */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-100">
                    <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Habilidades
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm font-bold text-slate-600 mb-1">
                                <span>Vocabulario</span>
                                <span>85%</span>
                            </div>
                            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 w-[85%]"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-bold text-slate-600 mb-1">
                                <span>Gramática</span>
                                <span>60%</span>
                            </div>
                            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 w-[60%]"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-bold text-slate-600 mb-1">
                                <span>Oral</span>
                                <span>45%</span>
                            </div>
                            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 w-[45%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Columna Derecha: Timeline */}
            <div className="lg:col-span-2">
                <h3 className="font-black text-slate-700 mb-6 flex items-center gap-2 text-xl">
                    <Calendar className="w-6 h-6 text-slate-400" />
                    Actividad Reciente
                </h3>

                <div className="space-y-4 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-1 before:bg-slate-100">
                    {/* Item 1: Tarea Completada */}
                    <div className="relative pl-20">
                        <div className="absolute left-4 top-0 w-9 h-9 bg-emerald-100 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10">
                            <Trophy className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800">Completó "Misión Frutal"</h4>
                                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Hace 2h</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                <span className="text-emerald-600 font-black">+50 Bananas</span>
                                <span>•</span>
                                <span>Score: 5/5</span>
                            </div>
                             <div className="bg-amber-50 p-3 rounded-xl flex items-center gap-3 border border-amber-100">
                                <button className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-amber-500">
                                    <Play className="w-3 h-3 fill-current" />
                                </button>
                                <div>
                                    <div className="h-1 w-24 bg-amber-200 rounded-full mb-1"></div>
                                    <p className="text-[10px] font-bold text-amber-700 uppercase">Audio Respuesta (0:14)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Item 2: Comentario */}
                    <div className="relative pl-20">
                        <div className="absolute left-4 top-0 w-9 h-9 bg-indigo-100 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10">
                            <Mic className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800">Practicó Pronunciación</h4>
                                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Ayer</span>
                            </div>
                            <p className="text-slate-600 text-sm italic">"Me gusta mucho la biblioteca."</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};