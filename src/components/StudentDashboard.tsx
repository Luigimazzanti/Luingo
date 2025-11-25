import React, { useState } from 'react';
import { Student, Task, Submission } from '../types';
import { TaskCard } from './TaskCard';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { LayoutDashboard, BookOpen, Trophy, LogOut, Menu, Zap, Flame, Users, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { CommunityFeed } from './community/CommunityFeed';
import { mockMaterials } from '../lib/mockData';
import luingoLogo from 'figma:asset/5c3aee031df4e645d2ea41499714325beb9cd4f4.png';

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
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'portfolio' | 'community' | 'achievements'>('tasks');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null); // Para el visor

  // --- PROTECCIÓN CONTRA CRASH (SI NO HAY ESTUDIANTE) ---
  if (!student) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8] text-slate-400">Cargando perfil...</div>;
  }

  // --- LÓGICA SEGURA ---
  const getAttemptsCount = (taskId: string) => {
      if (!submissions) return 0;
      // Filtramos por ID de tarea Y estudiante (convirtiendo a string por seguridad)
      return submissions.filter(s => 
          s.task_id === taskId && 
          String(s.student_id) === String(student.id)
      ).length;
  };

  // ✅ NUEVO: Obtener estado real de la tarea (draft, submitted, graded)
  const getTaskStatus = (taskId: string) => {
    // Buscar la submission más reciente de esta tarea
    const sub = submissions
      .filter(s => s.task_id === taskId && String(s.student_id) === String(student.id))
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
    
    return sub ? (sub.status || 'submitted') : 'assigned';
  };

  // ✅ FILTRO ACTUALIZADO: Pendientes = assigned o draft
  const pendingTasks = tasks.filter(t => {
    const status = getTaskStatus(t.id);
    
    // Si está enviado o calificado, YA NO ES PENDIENTE
    if (status === 'submitted' || status === 'graded') return false;
    
    // Si es draft, es pendiente (se puede continuar)
    // Si assigned, es pendiente (no se ha empezado)
    
    // Para Quiz, chequear intentos
    if (t.content_data?.type !== 'writing') {
      const attempts = getAttemptsCount(t.id);
      const max = t.content_data?.max_attempts ?? 3;
      return attempts < max;
    }
    
    // Para Writing, si es assigned o draft, es pendiente
    return true;
  });

  // ✅ COMPLETADAS: Solo las que están submitted o graded
  const completedTasks = tasks.filter(t => {
    const status = getTaskStatus(t.id);
    return status === 'submitted' || status === 'graded';
  });

  // Función para abrir el resumen de una tarea completada
  const openSummary = (task: Task) => {
      // Buscar la última entrega de esta tarea
      const sub = submissions
        .filter(s => s.task_id === task.id && String(s.student_id) === String(student.id))
        .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
      
      if (sub) setSelectedSubmission(sub);
  };

  const handleNavClick = (tab: any) => { setActiveTab(tab); setMobileMenuOpen(false); };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
          <img src={luingoLogo} alt="LuinGo" className="w-full h-full object-cover" />
        </div>
        <span className="ml-3 font-bold text-xl tracking-tight text-slate-800">LuinGo</span>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <SidebarItem icon={LayoutDashboard} label="Mi Espacio" isActive={activeTab === 'tasks'} onClick={() => handleNavClick('tasks')} />
        <SidebarItem icon={BookOpen} label="Portafolio" isActive={activeTab === 'portfolio'} onClick={() => handleNavClick('portfolio')} />
        <SidebarItem icon={Trophy} label="Logros" isActive={activeTab === 'achievements'} onClick={() => handleNavClick('achievements')} />
        <SidebarItem icon={Users} label="Comunidad" isActive={activeTab === 'community'} onClick={() => handleNavClick('community')} />
      </nav>
      <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <img src={student.avatar_url} className="w-10 h-10 rounded-full bg-white border border-slate-200" alt="Avatar" />
          <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate text-slate-700">{student.name}</p></div>
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-400 hover:text-rose-500" onClick={onLogout}><LogOut className="w-4 h-4 mr-2" /> Salir</Button>
      </div>
    </div>
  );

  return (
     <div className="flex h-screen bg-[#F0F4F8] text-slate-900 font-sans overflow-hidden">
        <aside className={cn("hidden md:flex bg-white border-r border-slate-200 flex-col transition-all duration-300 z-20", desktopSidebarOpen ? "w-64" : "w-20")}>
            {desktopSidebarOpen ? <NavContent /> : <div className="flex flex-col items-center py-4"><Button variant="ghost" size="icon" onClick={()=>setActiveTab('tasks')}><LayoutDashboard className="w-5 h-5"/></Button></div>}
        </aside>
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="md:hidden"><Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}><SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="w-6 h-6" /></Button></SheetTrigger><SheetContent side="left" className="p-0 w-72"><SheetTitle className="sr-only">Menu</SheetTitle><SheetDescription className="sr-only">Nav</SheetDescription><NavContent /></SheetContent></Sheet></div>
                    <button onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} className="hidden md:block p-2 text-slate-400"><Menu className="w-5 h-5" /></button>
                    <h1 className="text-lg font-black text-slate-800">Hola, {student.name.split(' ')[0]}</h1>
                </div>
                <div className="flex items-center gap-2"><div className="px-3 py-1 bg-indigo-50 rounded-full text-xs font-black text-indigo-700">{student.xp_points} XP</div></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                {activeTab === 'tasks' && (
                    <div className="max-w-5xl mx-auto space-y-6">
                        <h2 className="text-xl font-bold text-slate-800">Misiones Disponibles</h2>
                        {pendingTasks.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingTasks.map(task => (
                                    <TaskCard 
                                        key={task.id} 
                                        task={task} 
                                        status={getTaskStatus(task.id)} 
                                        attemptsUsed={getAttemptsCount(task.id)} // Pasamos intentos
                                        onClick={() => onSelectTask(task)} 
                                    />
                                ))}
                            </div>
                        ) : <div className="text-center py-20"><Trophy className="w-16 h-16 text-emerald-200 mx-auto mb-4"/><p className="text-slate-400 font-bold">¡Todo al día! 🎉</p></div>}
                    </div>
                )}
                
                {activeTab === 'portfolio' && (
                    <div className="max-w-5xl mx-auto space-y-6">
                        <h2 className="text-xl font-bold text-slate-800">Tu Portafolio</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {completedTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    status="graded" 
                                    attemptsUsed={getAttemptsCount(task.id)} 
                                    onClick={() => openSummary(task)} // ABRIR RESUMEN
                                />
                            ))}
                            {completedTasks.length === 0 && <p className="col-span-full text-center text-slate-400 italic">Aún no has completado tareas.</p>}
                        </div>
                    </div>
                )}
                
                {activeTab === 'achievements' && <div className="text-center py-20 text-slate-400">Sección de Logros en construcción... 🏆</div>}
                {activeTab === 'community' && <CommunityFeed materials={mockMaterials} student={student} />}
            </div>
        </main>

        {/* VISOR DE DETALLES (RESUMEN) */}
        <Dialog open={!!selectedSubmission} onOpenChange={(o) => !o && setSelectedSubmission(null)}>
            <DialogContent className="w-[95%] max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-0 bg-slate-50">
                <DialogHeader className="p-6 bg-white border-b border-slate-100 sticky top-0 z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-800">{selectedSubmission?.task_title}</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                              Intento realizado el {new Date(selectedSubmission?.submitted_at || '').toLocaleDateString()}
                            </DialogDescription>
                        </div>
                        <div className={`px-3 py-1 rounded-lg font-black text-sm ${selectedSubmission?.grade >= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            Nota: {(selectedSubmission?.grade || 0).toFixed(1)}
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="p-6 space-y-6">
                    {/* ✅ SECCIÓN DE FEEDBACK DEL PROFESOR */}
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

                    {/* LISTA DE RESPUESTAS */}
                    {selectedSubmission?.answers && selectedSubmission.answers.length > 0 ? (
                        selectedSubmission.answers.map((ans: any, i: number) => (
                            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="font-bold text-slate-700 text-sm mb-3 flex gap-2">
                                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded flex items-center justify-center text-xs shrink-0">{i+1}</span>
                                    {ans.questionText || "Pregunta"}
                                </p>
                                <div className="space-y-3">
                                    <div className={`p-3 rounded-xl text-sm border-l-4 ${ans.isCorrect ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-rose-50 border-rose-400 text-rose-900'}`}>
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
                    ) : (
                        <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                            No hay detalles de respuestas guardados para este intento.
                        </div>
                    )}
                </div>
                
                <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                    <Button onClick={() => setSelectedSubmission(null)}>Cerrar Resumen</Button>
                </div>
            </DialogContent>
        </Dialog>
     </div>
  );
};

const SidebarItem: React.FC<any> = ({ icon: Icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-sm font-bold", isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50")}><Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} /> {label}</button>
);