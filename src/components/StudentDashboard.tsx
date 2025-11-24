import React, { useState } from 'react';
import { Student, Task, Submission } from '../types';
import { TaskCard } from './TaskCard';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  LogOut, 
  Menu, 
  Zap, 
  Flame,
  Users,
  LucideIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CommunityFeed } from './community/CommunityFeed';
import { mockMaterials } from '../lib/mockData';

interface StudentDashboardProps {
  student: Student;
  tasks: Task[];
  submissions: Submission[]; 
  onSelectTask: (task: Task) => void;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  student, 
  tasks = [], 
  submissions = [],
  onSelectTask,
  onLogout
}) => {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'portfolio' | 'community' | 'achievements'>('tasks');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ Estado para el visor de detalles del Portafolio
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const handleNavClick = (tab: 'tasks' | 'portfolio' | 'community' | 'achievements') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // ========== ✅ LÓGICA DE INTENTOS BLINDADA ==========
  const getAttemptsCount = (taskId: string) => {
    // ✅ PROTECCIÓN: Si no hay submissions, student, o student.id, retorna 0
    if (!submissions || submissions.length === 0 || !student || !student.id) return 0;
    
    // ✅ Filtrar estrictamente por task_id Y student_id
    return submissions.filter(s => 
      s.task_id === taskId && 
      String(s.student_id) === String(student.id)
    ).length;
  };

  const getTaskStatus = (taskId: string) => {
    return getAttemptsCount(taskId) > 0 ? 'submitted' : 'assigned';
  };

  // ✅ FILTRO: Tareas Pendientes (Solo si quedan intentos)
  const pendingTasks = tasks.filter(t => {
    const attempts = getAttemptsCount(t.id);
    const max = t.content_data?.max_attempts || 3;
    
    // ✅ Si attempts >= max, la tarea DESAPARECE de la lista
    return attempts < max;
  });

  // ✅ FILTRO: Tareas Completadas (Si hizo al menos un intento)
  const completedTasks = tasks.filter(t => {
    const attempts = getAttemptsCount(t.id);
    
    // ✅ Si attempts > 0, la tarea APARECE
    return attempts > 0;
  });

  // ========== SIDEBAR NAVIGATION ==========
  const NavContent = () => (
    <nav className="flex-1 p-4 overflow-y-auto">
      <div className="space-y-2">
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Tareas" 
          isActive={activeTab === 'tasks'} 
          onClick={() => handleNavClick('tasks')} 
        />
        <SidebarItem 
          icon={BookOpen} 
          label="Portafolio" 
          isActive={activeTab === 'portfolio'} 
          onClick={() => handleNavClick('portfolio')} 
        />
        <SidebarItem 
          icon={Users} 
          label="Comunidad" 
          isActive={activeTab === 'community'} 
          onClick={() => handleNavClick('community')} 
        />
        <SidebarItem 
          icon={Trophy} 
          label="Logros" 
          isActive={activeTab === 'achievements'} 
          onClick={() => handleNavClick('achievements')} 
        />
      </div>

      <div className="mt-auto pt-6 border-t border-slate-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-sm font-bold"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* ========== SIDEBAR DESKTOP ========== */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 shrink-0",
          desktopSidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-slate-800 tracking-tight">LuinGo</span>
          </div>
        </div>
        <NavContent />
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
                  <SheetDescription className="sr-only">Navegación principal</SheetDescription>
                  <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-black text-slate-800 tracking-tight">LuinGo</span>
                    </div>
                  </div>
                  <NavContent />
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Sidebar Toggle */}
            <button 
              onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} 
              className="hidden md:block p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-lg font-black text-slate-800">
              Hola, {student.name.split(' ')[0]} 👋
            </h1>
          </div>

          {/* XP Badge */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-indigo-50 rounded-full text-xs font-black text-indigo-700 flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {student.xp_points} XP
            </div>
          </div>
        </div>

        {/* ========== CONTENT AREA ========== */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          
          {/* ========== TAB: TAREAS ========== */}
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
                      attemptsUsed={getAttemptsCount(task.id)} 
                      onClick={() => onSelectTask(task)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Trophy className="w-16 h-16 text-emerald-200 mx-auto mb-4"/>
                  <p className="text-slate-400 font-bold">¡No tienes tareas pendientes!</p>
                  <p className="text-slate-300 text-sm mt-2">Has completado todas las misiones disponibles 🎉</p>
                </div>
              )}
            </div>
          )}
          
          {/* ========== TAB: PORTAFOLIO ========== */}
          {activeTab === 'portfolio' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <h2 className="text-xl font-bold text-slate-800">Tu Portafolio</h2>
              
              <div className="grid grid-cols-1 gap-4">
                {submissions
                  .filter(s => String(s.student_id) === String(student.id))
                  .map((sub, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedSubmission(sub)} 
                      className="bg-white p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 cursor-pointer flex justify-between items-center shadow-sm transition-all hover:shadow-md"
                    >
                      <div>
                        <h4 className="font-bold text-slate-700">{sub.task_title}</h4>
                        <p className="text-xs text-slate-400">
                          {new Date(sub.submitted_at).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-black ${sub.grade >= 5 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {sub.grade.toFixed(1)}
                        </span>
                        <p className="text-[10px] font-bold text-slate-300 uppercase">Nota</p>
                      </div>
                    </div>
                  ))}
                
                {submissions.filter(s => String(s.student_id) === String(student.id)).length === 0 && (
                  <div className="text-center py-20">
                    <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4"/>
                    <p className="text-slate-400 italic">Aún no has completado tareas.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* ========== TAB: LOGROS ========== */}
          {activeTab === 'achievements' && (
            <div className="max-w-5xl mx-auto">
              <div className="text-center py-20">
                <Trophy className="w-16 h-16 text-amber-200 mx-auto mb-4"/>
                <p className="text-slate-400 font-bold">Sección de Logros en construcción... 🏆</p>
              </div>
            </div>
          )}
          
          {/* ========== TAB: COMUNIDAD ========== */}
          {activeTab === 'community' && (
            <CommunityFeed materials={mockMaterials} student={student} />
          )}
        </div>
      </main>

      {/* ========== ✅ VISOR DE DETALLES (PORTAFOLIO) ========== */}
      <Dialog open={!!selectedSubmission} onOpenChange={(o) => !o && setSelectedSubmission(null)}>
        <DialogContent className="w-[95%] max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-0">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
            <DialogTitle className="text-xl font-black text-slate-800">
              {selectedSubmission?.task_title}
            </DialogTitle>
            <DialogDescription>
              Resumen de tu intento • Nota: {selectedSubmission?.grade.toFixed(1)}/10
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {selectedSubmission?.answers && selectedSubmission.answers.length > 0 ? (
              selectedSubmission.answers.map((ans: any, i: number) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="font-bold text-slate-700 text-sm mb-3">
                    {i + 1}. {ans.questionText}
                  </p>
                  
                  <div className="space-y-2">
                    {/* Respuesta del Estudiante */}
                    <div className={cn(
                      "p-3 rounded-lg text-sm border-l-4",
                      ans.isCorrect 
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900" 
                        : "bg-rose-50 border-rose-400 text-rose-900"
                    )}>
                      <span className="text-[10px] font-black opacity-60 uppercase block mb-1">
                        Tu Respuesta:
                      </span>
                      {String(ans.studentAnswer || '---')}
                    </div>
                    
                    {/* Solución Correcta (solo si es incorrecta) */}
                    {!ans.isCorrect && (
                      <div className="p-3 rounded-lg text-sm bg-slate-50 border-l-4 border-slate-300 text-slate-600">
                        <span className="text-[10px] font-black opacity-60 uppercase block mb-1">
                          Solución Correcta:
                        </span>
                        {String(ans.correctAnswer || 'Consultar profesor')}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
                <p className="text-slate-400">No hay detalles guardados para este intento.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 flex justify-end">
            <Button onClick={() => setSelectedSubmission(null)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

// ========== SIDEBAR ITEM COMPONENT ==========
interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick} 
    className={cn(
      "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-sm font-bold",
      isActive 
        ? "bg-indigo-50 text-indigo-700" 
        : "text-slate-500 hover:bg-slate-50"
    )}
  >
    <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
    {label}
  </button>
);