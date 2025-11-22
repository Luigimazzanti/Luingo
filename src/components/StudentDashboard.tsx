import React, { useState } from 'react';
import { Student, Task, Submission } from '../types';
import { TaskCard } from './TaskCard';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
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
  // Estado sidebar solo para desktop
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'portfolio' | 'community' | 'achievements'>('tasks');
  const [selectedCompletedTask, setSelectedCompletedTask] = useState<Task | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lógica de filtrado de tareas
  const getTaskStatus = (taskId: string) => {
    if (!submissions) return 'assigned';
    const sub = submissions.find(s => 
      (s.task_id === taskId || s.task_title === tasks.find(t => t.id === taskId)?.title) && 
      s.student_id === student?.id
    );
    return sub ? sub.status : 'assigned';
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Lógica de Intentos y Portafolio
  const getAttempts = (taskId: string) => {
    return submissions.filter(s => 
      (s.task_id === taskId || s.task_title === tasks.find(t => t.id === taskId)?.title) && 
      s.student_id === student?.id
    ).length;
  };

  const pendingTasks = safeTasks.filter(t => {
    const status = getTaskStatus(t.id);
    const attempts = getAttempts(t.id);
    const max = t.content_data?.max_attempts || t.max_attempts || 1;
    return (status === 'assigned' || status === 'in_progress') && attempts < max;
  });

  const completedTasks = safeTasks.filter(t => {
    const status = getTaskStatus(t.id);
    const attempts = getAttempts(t.id);
    const max = t.content_data?.max_attempts || t.max_attempts || 1;
    return (status === 'submitted' || status === 'graded') || attempts >= max;
  });

  const studentName = student?.name || 'Estudiante';
  const studentAvatar = student?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=User`;
  const studentLevel = student?.level || 1;
  const studentXP = student?.xp_points || 0;

  // Contenido de Navegación (Reutilizable)
  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-black text-lg">L</span>
        </div>
        <span className="ml-3 font-bold text-xl tracking-tight text-slate-800">LuinGo</span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Mi Espacio" 
          isActive={activeTab === 'tasks'} 
          onClick={() => {
            setActiveTab('tasks');
            setMobileMenuOpen(false);
          }}
        />
        <SidebarItem 
          icon={Users} 
          label="Comunidad" 
          isActive={activeTab === 'community'} 
          onClick={() => {
            setActiveTab('community');
            setMobileMenuOpen(false);
          }}
        />
        <SidebarItem 
          icon={BookOpen} 
          label="Portafolio" 
          isActive={activeTab === 'portfolio'} 
          onClick={() => {
            setActiveTab('portfolio');
            setMobileMenuOpen(false);
          }}
        />
        <SidebarItem 
          icon={Trophy} 
          label="Logros" 
          isActive={activeTab === 'achievements'} 
          onClick={() => {
            setActiveTab('achievements');
            setMobileMenuOpen(false);
          }}
        />
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <img src={studentAvatar} className="w-10 h-10 rounded-full bg-white border border-slate-200" alt="Avatar" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-slate-700">{studentName}</p>
            <p className="text-xs text-slate-500 truncate">Nivel {studentLevel}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 h-9" 
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F0F4F8] text-slate-900 font-sans overflow-hidden">
      {/* --- SIDEBAR DESKTOP (Oculto en móvil) --- */}
      <aside className={cn(
        "hidden md:flex bg-white border-r border-slate-200 flex-col transition-all duration-300 z-20",
        desktopSidebarOpen ? "w-64" : "w-20"
      )}>
        {desktopSidebarOpen ? <NavContent /> : (
          // Versión colapsada desktop
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <div className="flex-1 w-full px-2 space-y-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActiveTab('tasks')} 
                className={cn("w-full", activeTab === 'tasks' && "bg-indigo-50 text-indigo-600")}
              >
                <LayoutDashboard className="w-5 h-5"/>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActiveTab('community')} 
                className={cn("w-full", activeTab === 'community' && "bg-indigo-50 text-indigo-600")}
              >
                <Users className="w-5 h-5"/>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActiveTab('portfolio')} 
                className={cn("w-full", activeTab === 'portfolio' && "bg-indigo-50 text-indigo-600")}
              >
                <BookOpen className="w-5 h-5"/>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActiveTab('achievements')} 
                className={cn("w-full", activeTab === 'achievements' && "bg-indigo-50 text-indigo-600")}
              >
                <Trophy className="w-5 h-5"/>
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Header Sticky */}
        <div className="h-14 md:h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-3 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {/* MOBILE TRIGGER (Solo visible en móvil) */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9 -ml-2">
                    <Menu className="w-6 h-6 text-slate-600" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <NavContent />
                </SheetContent>
              </Sheet>
            </div>
            
            {/* DESKTOP TOGGLE */}
            <button 
              onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} 
              className="hidden md:block p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-base md:text-xl font-black text-slate-800 truncate">
              {activeTab === 'tasks' ? `Hola, ${studentName.split(' ')[0]}` : 
               activeTab === 'portfolio' ? 'Mi Portafolio' : 
               activeTab === 'community' ? 'Comunidad' : 'Mis Logros'}
            </h1>
          </div>

          {/* Metrics Pills (Optimizadas Móvil) */}
          <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
            <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-amber-50 rounded-full border border-amber-100">
              <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-black text-amber-700 hidden sm:inline">Racha:</span>
              <span className="text-xs font-black text-amber-700">5</span>
            </div>
            <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500 fill-indigo-500" />
              <span className="text-xs font-black text-indigo-700">{studentXP}<span className="hidden sm:inline ml-0.5">XP</span></span>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 md:p-8 scroll-smooth">
          {activeTab === 'tasks' && (
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {pendingTasks.length > 0 ? (
                <>
                  <h2 className="text-base md:text-lg font-bold text-slate-700 mb-4 md:mb-6">Tareas Pendientes</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {pendingTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        status={getTaskStatus(task.id)}
                        onClick={() => onSelectTask && onSelectTask(task)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4 md:mb-6">
                    <Trophy className="w-10 h-10 md:w-12 md:h-12 text-emerald-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800">¡Todo al día!</h3>
                  <p className="text-sm md:text-base text-slate-500 mt-2 max-w-xs px-4">
                    Has completado todas tus tareas pendientes. Relájate o explora material extra.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-base md:text-lg font-bold text-slate-700 mb-4 md:mb-6">Historial de Aprendizaje</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {completedTasks.map(task => {
                  const taskSubmission = submissions.find(s => 
                    (s.task_id === task.id || s.task_title === task.title) && 
                    s.student_id === student?.id
                  );
                  
                  return (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      status="completed"
                      onClick={() => {
                        setSelectedCompletedTask(task);
                        setShowSummaryModal(true);
                      }}
                    />
                  );
                })}
              </div>
              {completedTasks.length === 0 && (
                <p className="text-center text-slate-400 mt-10 text-sm md:text-base">
                  Aún no has completado ninguna tarea.
                </p>
              )}
            </div>
          )}

          {activeTab === 'community' && (
            <div className="max-w-5xl mx-auto">
              <CommunityFeed materials={mockMaterials} student={student} />
            </div>
          )}
          
          {activeTab === 'achievements' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-xl md:text-3xl font-black text-slate-800 mb-2">🏆 Tus Logros</h2>
                <p className="text-sm md:text-base text-slate-500">Colecciona medallas completando desafíos</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                {/* Badge Explorador - 15 XP (1 tarea) */}
                <div className={cn(
                  "bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all",
                  studentXP >= 15 ? "border-amber-200 shadow-lg" : "border-slate-100 opacity-50 grayscale"
                )}>
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl md:text-3xl">🥉</span>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-center text-slate-800 mb-1 md:mb-2">Explorador</h3>
                  <p className="text-[10px] md:text-xs text-center text-slate-500">Completa tu primera tarea (15 XP)</p>
                  <div className="mt-3 md:mt-4 text-center">
                    <span className={cn(
                      "text-[10px] md:text-xs font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full",
                      studentXP >= 15 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"
                    )}>
                      {studentXP >= 15 ? "Desbloqueado" : "Bloqueado"}
                    </span>
                  </div>
                </div>

                {/* Badge Aprendiz - 150 XP (10 tareas) */}
                <div className={cn(
                  "bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all",
                  studentXP >= 150 ? "border-slate-300 shadow-lg" : "border-slate-100 opacity-50 grayscale"
                )}>
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl md:text-3xl">🥈</span>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-center text-slate-800 mb-1 md:mb-2">Aprendiz</h3>
                  <p className="text-[10px] md:text-xs text-center text-slate-500">Acumula 150 XP (10 tareas)</p>
                  <div className="mt-3 md:mt-4 text-center">
                    <span className={cn(
                      "text-[10px] md:text-xs font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full",
                      studentXP >= 150 ? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-400"
                    )}>
                      {studentXP >= 150 ? "Desbloqueado" : `${studentXP}/150 XP`}
                    </span>
                  </div>
                </div>

                {/* Badge Maestro - 300 XP (20 tareas) */}
                <div className={cn(
                  "bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all",
                  studentXP >= 300 ? "border-yellow-200 shadow-lg" : "border-slate-100 opacity-50 grayscale"
                )}>
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl md:text-3xl">🥇</span>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-center text-slate-800 mb-1 md:mb-2">Maestro</h3>
                  <p className="text-[10px] md:text-xs text-center text-slate-500">Alcanza 300 XP (20 tareas)</p>
                  <div className="mt-3 md:mt-4 text-center">
                    <span className={cn(
                      "text-[10px] md:text-xs font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full",
                      studentXP >= 300 ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-400"
                    )}>
                      {studentXP >= 300 ? "Desbloqueado" : `${studentXP}/300 XP`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Resumen de Tarea Completada */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="w-[90%] sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-black">✅ Tarea Finalizada</DialogTitle>
            <DialogDescription className="text-sm">
              Ya has completado esta tarea. Aquí está tu resumen:
            </DialogDescription>
          </DialogHeader>
          {selectedCompletedTask && (
            <div className="space-y-4 py-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-indigo-100">
                <h3 className="font-black text-base md:text-lg text-slate-800 mb-2">{selectedCompletedTask.title}</h3>
                <p className="text-slate-600 text-xs md:text-sm mb-4">{selectedCompletedTask.description}</p>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="text-center flex-1">
                    <p className="text-3xl md:text-4xl font-black text-green-600">
                      {submissions.find(s => 
                        (s.task_id === selectedCompletedTask.id || s.task_title === selectedCompletedTask.title) && 
                        s.student_id === student?.id
                      )?.grade?.toFixed(1) || '10.0'}
                    </p>
                    <p className="text-xs md:text-sm text-slate-600 mt-1">Nota / 10</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-3xl md:text-4xl font-black text-indigo-600">✓</p>
                    <p className="text-xs md:text-sm text-slate-600 mt-1">Finalizado</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-3 md:p-4 rounded-xl border border-amber-100 text-center">
                <p className="text-xs md:text-sm font-bold text-amber-800">🎉 ¡Ya dominas este tema!</p>
                <p className="text-[10px] md:text-xs text-amber-600 mt-1">Continúa con las siguientes tareas disponibles.</p>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setShowSummaryModal(false)} className="text-sm md:text-base">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper Component
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
      isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
    )}
  >
    <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
    {label}
  </button>
);
