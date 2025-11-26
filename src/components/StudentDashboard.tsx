import React, { useState } from 'react';
import { Student, Task, Submission } from '../types';
import { TaskCard } from './TaskCard';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  Users, 
  Zap, 
  Flame,
  MessageSquare,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CommunityFeed } from './community/CommunityFeed';
import { mockMaterials } from '../lib/mockData';
import { TextAnnotator } from './TextAnnotator';

interface StudentDashboardProps {
  student: Student;
  tasks: Task[];
  submissions: Submission[];
  onSelectTask: (task: Task) => void;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  student, tasks = [], submissions = [], onSelectTask, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'portfolio' | 'community' | 'achievements'>('tasks');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // --- PROTECCIÓN CONTRA CRASH ---
  if (!student) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400">Cargando perfil...</div>;
  }

  // --- LÓGICA DE NEGOCIO (INTACTA) ---
  const getAttemptsCount = (taskId: string) => {
    if (!submissions) return 0;
    return submissions.filter(s => 
      s.task_id === taskId && 
      String(s.student_id) === String(student.id)
    ).length;
  };

  const getTaskStatus = (taskId: string) => {
    const sub = submissions
      .filter(s => s.task_id === taskId && String(s.student_id) === String(student.id))
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
    
    return sub ? (sub.status || 'submitted') : 'assigned';
  };

  const pendingTasks = tasks.filter(t => {
    const status = getTaskStatus(t.id);
    
    if (status === 'submitted' || status === 'graded') return false;
    
    if (t.content_data?.type !== 'writing') {
      const attempts = getAttemptsCount(t.id);
      const max = t.content_data?.max_attempts ?? 3;
      return attempts < max;
    }
    
    return true;
  });

  const completedTasks = tasks.filter(t => {
    const status = getTaskStatus(t.id);
    return status === 'submitted' || status === 'graded';
  });

  const openSummary = (task: Task) => {
    const sub = submissions
      .filter(s => s.task_id === task.id && String(s.student_id) === String(student.id))
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
    
    if (sub) setSelectedSubmission(sub);
  };

  // --- COMPONENTE NAV DOCK (DISEÑO MODERNO) ---
  const NavDock = () => (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500 w-[90%] md:w-auto max-w-md md:max-w-none">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full p-2 md:p-2 grid grid-cols-4 gap-1 bg-[rgba(50,50,50,0.9)]">
        <DockItem 
          icon={LayoutDashboard} 
          label="Misiones" 
          active={activeTab === 'tasks'} 
          onClick={() => setActiveTab('tasks')} 
        />
        <DockItem 
          icon={BookOpen} 
          label="Portafolio" 
          active={activeTab === 'portfolio'} 
          onClick={() => setActiveTab('portfolio')} 
        />
        <DockItem 
          icon={Users} 
          label="Comunidad" 
          active={activeTab === 'community'} 
          onClick={() => setActiveTab('community')} 
        />
        <DockItem 
          icon={Trophy} 
          label="Logros" 
          active={activeTab === 'achievements'} 
          onClick={() => setActiveTab('achievements')} 
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 font-sans overflow-x-hidden">
      {/* CONTENEDOR PRINCIPAL CON SCROLL */}
      <div className="h-screen overflow-y-auto pb-32 scroll-smooth">
        
        {/* HEADER ESTADÍSTICAS (TRANSPARENTE) */}
        <div className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              Hola, <span className="text-indigo-600">{student.name.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">¡Sigue aprendiendo!</p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-bold text-xs border border-amber-200 shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 5 Días
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full font-bold text-xs border border-indigo-200 shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" /> {student.xp_points} XP
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          
          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-700 flex items-center gap-2">
                  🚀 Misiones Disponibles
                  <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingTasks.length}</span>
                </h2>
              </div>
              
              {pendingTasks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      status={getTaskStatus(task.id)} 
                      attemptsUsed={getAttemptsCount(task.id)} 
                      onClick={() => onSelectTask(task)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-200 shadow-sm">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">¡Misión Cumplida!</h3>
                  <p className="text-slate-400 text-sm mt-1">Has completado todas tus tareas pendientes.</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'portfolio' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-black text-slate-700 flex items-center gap-2">
                📚 Tu Portafolio
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    status="graded" 
                    attemptsUsed={getAttemptsCount(task.id)} 
                    onClick={() => openSummary(task)} 
                  />
                ))}
                {completedTasks.length === 0 && (
                  <p className="col-span-full text-center text-slate-400 italic py-10">Tu historial de aprendizaje aparecerá aquí.</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'achievements' && (
            <div className="animate-in fade-in zoom-in duration-500 text-center py-10">
              <div className="inline-block p-6 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-50 border-4 border-white shadow-xl mb-6">
                <Trophy className="w-16 h-16 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Sala de Trofeos</h2>
              <p className="text-slate-400 mt-2">Próximamente podrás ver tus medallas aquí.</p>
            </div>
          )}

          {activeTab === 'community' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CommunityFeed materials={mockMaterials} student={student} />
            </div>
          )}
        </div>
      </div>

      {/* NAVEGACIÓN FLOTANTE */}
      <NavDock />

      {/* VISOR DE DETALLES (RESUMEN) */}
      <Dialog open={!!selectedSubmission} onOpenChange={(o) => !o && setSelectedSubmission(null)}>
        <DialogContent className="w-[95%] max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-0 bg-slate-50 border-0">
          <DialogHeader className="p-6 bg-white border-b border-slate-100 sticky top-0 z-10">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <DialogTitle className="text-xl font-black text-slate-800">{selectedSubmission?.task_title}</DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  Intento realizado el {new Date(selectedSubmission?.submitted_at || '').toLocaleDateString()}
                </DialogDescription>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-lg font-black text-sm shrink-0",
                (selectedSubmission?.grade ?? 0) >= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              )}>
                Nota: {(selectedSubmission?.grade || 0).toFixed(1)}
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {/* FEEDBACK DEL PROFESOR */}
            {selectedSubmission?.teacher_feedback && selectedSubmission.teacher_feedback.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border-2 border-indigo-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0 text-lg">
                    👨‍🏫
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-indigo-900 mb-2 text-sm uppercase tracking-wide">
                      Comentarios del Profesor
                    </h4>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      "{selectedSubmission.teacher_feedback}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VISOR DE REDACCIÓN */}
            {selectedSubmission?.textContent && selectedSubmission.textContent.length > 0 && (
              <div className="bg-white p-0 rounded-2xl border-2 border-indigo-100 shadow-sm overflow-hidden">
                <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600"/>
                  <h4 className="font-black text-indigo-900 text-xs uppercase tracking-wider">Tu Redacción Corregida</h4>
                </div>
                <div className="p-4">
                  <TextAnnotator 
                    text={selectedSubmission.textContent} 
                    annotations={selectedSubmission.corrections || []} 
                    onAddAnnotation={()=>{}} 
                    onRemoveAnnotation={()=>{}} 
                    readOnly={true} 
                  />
                </div>
              </div>
            )}

            {/* LISTA DE RESPUESTAS */}
            {selectedSubmission?.answers && selectedSubmission.answers.length > 0 && (
              selectedSubmission.answers.map((ans: any, i: number) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="font-bold text-slate-700 text-sm mb-3 flex gap-2">
                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded flex items-center justify-center text-xs shrink-0">{i+1}</span>
                    {ans.questionText || "Pregunta"}
                  </p>
                  <div className="space-y-3">
                    <div className={cn(
                      "p-3 rounded-xl text-sm border-l-4",
                      ans.isCorrect ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-rose-50 border-rose-400 text-rose-900'
                    )}>
                      <div className="flex items-center gap-2 mb-1 font-black text-[10px] opacity-60 uppercase">
                        {ans.isCorrect ? <CheckCircle2 className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                        Tu Respuesta:
                      </div>
                      <div className="font-medium">{String(ans.studentAnswer || '---')}</div>
                    </div>
                    {!ans.isCorrect && ans.correctAnswer && (
                      <div className="p-3 rounded-xl text-sm bg-slate-50 border-l-4 border-slate-300 text-slate-600">
                        <span className="font-black text-[10px] opacity-60 uppercase block mb-1">Solución Correcta:</span>
                        <div className="font-medium">{String(ans.correctAnswer)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Mensaje si no hay respuestas ni texto */}
            {(!selectedSubmission?.answers || selectedSubmission.answers.length === 0) && 
             (!selectedSubmission?.textContent || selectedSubmission.textContent.length === 0) && (
              <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                No hay detalles de respuestas guardados para este intento.
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
            <Button onClick={() => setSelectedSubmission(null)} variant="outline" className="border-slate-200">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// COMPONENTE DE BOTÓN DEL DOCK
const DockItem = ({ icon: Icon, label, active, onClick }: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex flex-col items-center justify-center gap-1 px-3 py-4 md:px-4 md:py-3 rounded-full transition-all duration-300 group w-full min-h-[68px] md:min-h-0",
      active 
        ? "bg-white text-indigo-600 shadow-lg scale-110" 
        : "hover:bg-white/10 text-slate-300 hover:text-white hover:scale-105"
    )}
  >
    <Icon className={cn("w-7 h-7 md:w-5 md:h-5 transition-all", active && "stroke-[2.5px]")} />
    <span className={cn(
      "text-[9px] font-bold transition-all whitespace-nowrap hidden md:block",
      active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
    )}>
      {label}
    </span>
    {active && (
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
    )}
  </button>
);