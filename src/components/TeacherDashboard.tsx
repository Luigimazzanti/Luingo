import React, { useState } from 'react';
import { Student, Task, Classroom } from '../types';
import { StudentCard } from './StudentCard';
import { Users, QrCode, Sparkles, Trash2, Edit2, List } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { DialogTitle } from './ui/dialog';

interface TeacherDashboardProps {
  classroom: Classroom;
  students: Student[];
  tasks: Task[];
  onSelectStudent: (studentId: string) => void;
  onGenerateTask: () => void; // Simplificado: Solo abre el builder
  onDeleteTask: (id: string) => void;
  onEditTask?: (task: Task) => void; // Opcional para futuro
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  classroom,
  students,
  tasks,
  onSelectStudent,
  onGenerateTask,
  onDeleteTask,
  onEditTask,
}) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'students' | 'tasks'>('students');
  const inviteLink = `https://edtech.app/join/${classroom.invite_code}`;

  return (
    <div className="h-full w-full bg-[#F0F4F8] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div className="relative px-4 md:px-6 py-6 md:py-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Info Clase */}
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">🇪🇸</div>
               <div>
                   <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-1 text-[rgb(255,255,255)]">{classroom.name}</h1>
                   <p className="text-indigo-200 font-medium opacity-90">{classroom.description}</p>
               </div>
            </div>

            {/* BOTONES DE ACCIÓN (Ahora abren cosas buenas) */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Botón Invitar */}
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-indigo-50 border-b-4 border-indigo-200 h-12 md:h-14 px-6 rounded-xl font-black active:translate-y-1 active:border-b-0 transition-all">
                    <Users className="w-5 h-5 mr-2" />
                    INVITAR
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-4 border-indigo-100 rounded-3xl w-[95%] p-6">
                    {/* ACCESIBILIDAD: Título oculto para lectores de pantalla */}
                    <DialogTitle className="sr-only">Código de Invitación</DialogTitle>
                    
                    <div className="text-center">
                        <QrCode className="w-32 h-32 mx-auto mb-4 text-indigo-900" />
                        <p className="font-bold text-indigo-900 text-lg mb-2">Código de Acceso</p>
                        <div className="bg-indigo-50 p-3 rounded-xl border-2 border-indigo-100 font-mono text-xl tracking-widest text-indigo-600">
                            {classroom.invite_code}
                        </div>
                    </div>
                </DialogContent>
              </Dialog>

              {/* BOTÓN IA (Ahora abre el TaskBuilder Real) */}
              <Button 
                onClick={onGenerateTask}
                className="w-full sm:w-auto bg-amber-400 text-amber-900 hover:bg-amber-500 border-b-4 border-amber-700 h-12 md:h-14 px-6 rounded-xl font-black active:translate-y-1 active:border-b-0 transition-all shadow-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                CREAR TAREA IA
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Switch Vista */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
             <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                 {viewMode === 'students' ? 'Estudiantes' : 'Misiones Activas'}
                 <span className="bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-xl text-sm font-bold shadow-sm">
                     {viewMode === 'students' ? students.length : tasks.length}
                 </span>
             </h2>
             <Button 
                variant="outline"
                onClick={() => setViewMode(viewMode === 'students' ? 'tasks' : 'students')}
                className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-600 font-bold h-12 rounded-xl hover:border-indigo-300 hover:text-indigo-600"
             >
                 {viewMode === 'students' ? <List className="w-5 h-5 mr-2" /> : <Users className="w-5 h-5 mr-2" />}
                 {viewMode === 'students' ? 'Ver Misiones' : 'Ver Estudiantes'}
             </Button>
        </div>

        {/* GRID ESTUDIANTES */}
        {viewMode === 'students' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {students.map(student => (
                    <StudentCard key={student.id} student={student} onClick={() => onSelectStudent(student.id)} />
                ))}
                {students.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        No hay estudiantes matriculados (o eres el único en el curso).
                    </div>
                )}
            </div>
        )}

        {/* LISTA DE TAREAS */}
        {viewMode === 'tasks' && (
            <div className="space-y-4 max-w-4xl mx-auto">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white p-5 rounded-2xl border-2 border-slate-100 flex items-center justify-between hover:border-indigo-200 transition-all shadow-sm">
                        <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">{task.category}</span>
                                <h3 className="font-bold text-slate-800 truncate">{task.title}</h3>
                            </div>
                            <p className="text-xs text-slate-400 truncate">{task.description}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                onClick={() => onEditTask && onEditTask(task)}
                            >
                                <Edit2 className="w-5 h-5" />
                            </Button>
                            <Button onClick={() => onDeleteTask(task.id)} variant="ghost" size="icon" className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};