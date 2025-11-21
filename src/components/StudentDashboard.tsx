import React, { useState } from 'react';
import { Student, Task, Submission } from '../types';
import { TaskCard } from './TaskCard';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  LogOut, 
  Menu, 
  Zap, 
  Flame,
  Users, // NEW ICON for Community
  LucideIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CommunityFeed } from './community/CommunityFeed'; // IMPORT NEW COMPONENT
import { mockMaterials } from '../lib/mockData'; // Import mock data for demo

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'portfolio' | 'community'>('tasks');

  // Safe access helper
  const getTaskStatus = (taskId: string) => {
      if (!submissions) return 'assigned';
      const sub = submissions.find(s => s.task_id === taskId && s.student_id === student?.id);
      return sub ? sub.status : 'assigned';
  };

  // Ensure arrays
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const pendingTasks = safeTasks.filter(t => {
      const status = getTaskStatus(t.id);
      return status === 'assigned' || status === 'in_progress';
  });

  const completedTasks = safeTasks.filter(t => {
      const status = getTaskStatus(t.id);
      return status === 'submitted' || status === 'graded';
  });

  // Safe student data
  const studentName = student?.name || 'Estudiante';
  const studentAvatar = student?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=User`;
  const studentLevel = student?.level || 1;
  const studentXP = student?.xp_points || 0;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className={cn(
          "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20",
          sidebarOpen ? "w-64" : "w-20"
      )}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-black text-lg">L</span>
            </div>
            {sidebarOpen && <span className="ml-3 font-bold text-xl tracking-tight">LuinGo</span>}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-2">
            <SidebarItem 
                icon={LayoutDashboard} 
                label="Mi Espacio" 
                isActive={activeTab === 'tasks'} 
                isOpen={sidebarOpen}
                onClick={() => setActiveTab('tasks')}
            />
            <SidebarItem 
                icon={Users} 
                label="Comunidad" 
                isActive={activeTab === 'community'} 
                isOpen={sidebarOpen}
                onClick={() => setActiveTab('community')}
            />
            <SidebarItem 
                icon={BookOpen} 
                label="Portafolio" 
                isActive={activeTab === 'portfolio'} 
                isOpen={sidebarOpen}
                onClick={() => setActiveTab('portfolio')}
            />
            <SidebarItem 
                icon={Trophy} 
                label="Logros" 
                isOpen={sidebarOpen}
                // No onClick needed here, but provided to prevent errors
                onClick={() => {}}
            />
        </nav>

        {/* User Profile Snippet */}
        <div className="p-4 border-t border-slate-100">
            <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
                <img 
                    src={studentAvatar} 
                    className="w-10 h-10 rounded-full bg-slate-100" 
                    alt="Avatar"
                />
                {sidebarOpen && (
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{studentName}</p>
                        <p className="text-xs text-slate-400 truncate">Nivel {studentLevel}</p>
                    </div>
                )}
            </div>
             {sidebarOpen && (
                <Button variant="ghost" size="sm" className="w-full mt-4 text-slate-400 hover:text-rose-500" onClick={onLogout || (() => {})}>
                    <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                </Button>
             )}
        </div>
      </aside>


      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Header Mobile Toggle */}
        <div className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                    <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
                    {activeTab === 'tasks' ? 'Hola, ' + studentName.split(' ')[0] : 'Mi Portafolio'}
                </h1>
            </div>

            {/* Metrics Pill */}
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100">
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-amber-700">Racha: 5 días</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                    <Zap className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                    <span className="text-xs font-bold text-indigo-700">{studentXP} XP</span>
                </div>
            </div>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            
            {activeTab === 'tasks' && (
                <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Hero / Current Focus */}
                    {pendingTasks.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                    Para Hoy
                                </h2>
                            </div>
                             {/* Grid Principal */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pendingTasks.map(task => (
                                    <TaskCard 
                                        key={task.id} 
                                        task={task} 
                                        status={getTaskStatus(task.id)}
                                        onClick={() => onSelectTask && onSelectTask(task)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {pendingTasks.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trophy className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700">¡Todo al día!</h3>
                            <p className="text-slate-400 max-w-xs mx-auto mt-2">Has completado todas tus tareas pendientes. Relájate o explora material extra.</p>
                        </div>
                    )}

                </div>
            )}

            {activeTab === 'portfolio' && (
                 <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <h2 className="text-lg font-bold text-slate-700 mb-6">Historial de Aprendizaje</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedTasks.map(task => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                status={getTaskStatus(task.id)}
                                onClick={() => onSelectTask && onSelectTask(task)}
                            />
                        ))}
                         {completedTasks.length === 0 && (
                            <p className="text-slate-400 col-span-3 text-center py-10">Aún no has completado ninguna tarea.</p>
                        )}
                    </div>
                 </div>
            )}

            {activeTab === 'community' && (
                <CommunityFeed 
                    materials={mockMaterials} 
                    student={student}
                />
            )}

        </div>
      </main>
    </div>
  );
};

// Subcomponente Helper Simplificado y Robusto
interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    isActive?: boolean;
    isOpen: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, isActive, isOpen, onClick }: SidebarItemProps) => {
    // Handle possible missing icon or click handler
    const safeOnClick = onClick || (() => {});
    
    if (!Icon) return null; // Fail gracefully if icon is missing

    return (
        <button 
            onClick={safeOnClick}
            type="button"
            className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors focus:outline-none",
                isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                !isOpen && "justify-center px-0"
            )}
        >
            <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
            {isOpen && <span className={cn("text-sm font-bold", isActive && "font-black")}>{label}</span>}
        </button>
    );
};
