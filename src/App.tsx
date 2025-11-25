import React, { useState, useEffect } from 'react';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ClassSelection } from './components/ClassSelection';
import { StudentPassport } from './components/StudentPassport';
import { TaskCorrector } from './components/TaskCorrector';
import { CommentWall } from './components/CommentWall';
import { MediaViewer } from './components/MediaViewer';
import { NotificationBell } from './components/NotificationBell';
import { StudentDashboard } from './components/StudentDashboard';
import { TaskBuilder } from './components/TaskBuilder';
import { PDFAnnotator } from './components/PDFAnnotator';
import { ExercisePlayer } from './components/ExercisePlayer';
import { getSiteInfo, createMoodleTask, getMoodleTasks, getCourses, getEnrolledUsers, submitTaskResult, getUserByUsername, deleteMoodleTask, updateMoodleTask, getMoodleSubmissions, createCourse } from './lib/moodle';
import { mockClassroom, LUINGO_LEVELS } from './lib/mockData';
import { Comment, Correction, Notification, User, Task, Student, Exercise, Submission } from './types'; 
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { ArrowLeft, MessageCircle, Play, LogOut, Sparkles, Target, Home, Settings, RefreshCw } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './components/ui/dialog';
import { Toaster, toast } from 'sonner@2.0.3';

// ========== LÓGICA DE RACHA (STREAK) ==========
const checkStreak = (): number => {
  const lastLogin = localStorage.getItem('last_login_date');
  const currentStreak = parseInt(localStorage.getItem('streak_count') || '0');
  const today = new Date().toDateString();

  if (lastLogin !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastLogin === yesterday.toDateString()) {
      const newStreak = currentStreak + 1;
      localStorage.setItem('streak_count', String(newStreak));
      localStorage.setItem('last_login_date', today);
      return newStreak;
    } else {
      localStorage.setItem('streak_count', '1');
      localStorage.setItem('last_login_date', today);
      return 1;
    }
  }
  
  return currentStreak || 1;
};

// ========== HELPER: CALCULAR NIVEL DESDE XP ==========
const calculateLevelFromXP = (xp: number): number => {
  for (let i = LUINGO_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LUINGO_LEVELS[i].min_xp) {
      return LUINGO_LEVELS[i].level;
    }
  }
  return 1;
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'dashboard' | 'task-detail' | 'exercise' | 'correction' | 'pdf-viewer'>('home'); 
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [activePDFTask, setActivePDFTask] = useState<Task | null>(null); 
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  const [showTaskBuilder, setShowTaskBuilder] = useState(false); 
  const [taskBuilderMode, setTaskBuilderMode] = useState<'create' | 'edit'>('create');
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [startBuilderWithAI, setStartBuilderWithAI] = useState(false);

  const [classroom, setClassroom] = useState(mockClassroom);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ✅ ESTADO ÚNICO DE LA VERDAD (Solo datos reales de Moodle)
  const [realSubmissions, setRealSubmissions] = useState<Submission[]>([]);
  
  const [usernameInput, setUsernameInput] = useState("");

  // ========== INICIALIZACIÓN MOODLE ==========
  const initMoodle = async () => {
    setLoading(true);
    setConnectionError(null);
    
    try {
      const info = await getSiteInfo();
      if (info && !info.error) {
        toast.success(`Conectado a Moodle: ${info.sitename}`);
        
        const moodleCourses = await getCourses();
        if (Array.isArray(moodleCourses)) {
          setCourses(moodleCourses);
        }
        
        const forumTasks = await getMoodleTasks();
        setTasks(forumTasks);
      } else {
        setConnectionError("No se pudo conectar a Moodle. Verifica la configuración.");
      }
    } catch (e) {
      console.error("Error inicializando Moodle:", e);
      setConnectionError("Error crítico al conectar con Moodle.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initMoodle();
  }, []);

  // ========== INICIALIZACIÓN DE USUARIO ==========
  const initializeUser = async (username: string) => {
    setLoading(true);
    
    try {
      const moodleUser = await getUserByUsername(username);
      
      if (moodleUser) {
        const lowerName = username.toLowerCase();
        let role: 'teacher' | 'student' = 'student';
        
        if (lowerName === 'luigi' || lowerName.includes('teacher')) {
          role = 'teacher';
        } else if (lowerName === 'admin') {
          role = 'student';
        }

        const userProfile: User = {
          id: String(moodleUser.id),
          email: moodleUser.email,
          name: moodleUser.fullname,
          role: role,
          avatar_url: moodleUser.profileimageurl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        toast.loading("Cargando datos del usuario...");

        try {
          const [latestTasks, allSubs] = await Promise.all([
            getMoodleTasks(),
            getMoodleSubmissions()
          ]);

          setTasks(latestTasks);

          if (role === 'teacher') {
            setRealSubmissions(allSubs);
          } else {
            // Estudiante solo ve las suyas (match por ID o nombre)
            const mySubs = allSubs.filter((s: any) => 
              String(s.student_id) === String(moodleUser.id) || 
              s.student_name === moodleUser.fullname
            );
            setRealSubmissions(mySubs);
            
            console.log(`👨‍🎓 Submissions del estudiante "${moodleUser.fullname}":`, mySubs.length);
            
            // Calcular XP real basado en submissions
            const xp = mySubs.length * 15;
            const level = calculateLevelFromXP(xp);
            userProfile.xp_points = xp;
            userProfile.level = level;
          }
          
          setCurrentUser(userProfile);
          
          // ✅ Configurar estudiante por defecto si soy alumno
          if (role === 'student') {
            const studentProfile: Student = {
              ...userProfile,
              level: userProfile.level || 1,
              current_level_code: 'A1',
              completed_tasks: 0,
              total_tasks: latestTasks.length,
              average_grade: 0,
              materials_viewed: [],
              joined_at: new Date().toISOString()
            } as Student;
            
            setStudents([studentProfile]);
          }
          
          const streak = checkStreak();
          toast.success(`¡Hola ${userProfile.name}! 🔥 Racha: ${streak} días`);
        } catch (e) {
          console.error("Error cargando datos extra:", e);
          setCurrentUser(userProfile);
          toast.dismiss();
          toast.warning("Entraste con datos limitados");
        }
      } else {
        toast.error("Usuario no encontrado en Moodle");
      }
    } catch (error) {
      console.error("Error al inicializar usuario:", error);
      toast.error("Error al entrar");
    } finally {
      setLoading(false);
    }
  };

  // ========== GESTIÓN DE CLASES ==========
  // ✅ FIX CRÍTICO: Siempre entrar al dashboard, incluso si getEnrolledUsers falla
  const handleSelectClass = async (courseId: string) => {
    toast.loading("Entrando al aula...");
    
    try {
      const enrolled = await getEnrolledUsers(Number(courseId));
      
      if (Array.isArray(enrolled)) {
        // Filtrar solo estudiantes (excluir al profesor actual)
        const realStudents = enrolled.filter((u: any) => {
          if (String(u.id) === String(currentUser?.id)) return false;
          const roles = u.roles || [];
          return roles.some((r: any) => r.shortname === 'student');
        });

        console.log(`👥 Estudiantes encontrados: ${realStudents.length}`);

        // ✅ Mapear estudiantes con sus datos reales de entregas
        const mappedStudents: Student[] = realStudents.map((u: any) => {
          const userSubs = realSubmissions.filter(s => 
            s.student_name === u.fullname || 
            String(s.student_id) === String(u.id)
          );
          
          const xp = userSubs.length * 15;
          const level = calculateLevelFromXP(xp);
          
          return {
            id: String(u.id),
            name: u.fullname,
            email: u.email,
            avatar_url: u.profileimageurl,
            level: level,
            xp_points: xp,
            completed_tasks: userSubs.length,
            total_tasks: tasks.length,
            average_grade: 0,
            materials_viewed: [],
            current_level_code: 'A1',
            role: 'student',
            joined_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        });

        setStudents(mappedStudents);
      } else {
        console.warn("⚠️ No se pudo cargar la lista de estudiantes (falta de permisos o error)");
      }
    } catch (error) {
      console.warn("⚠️ Error al cargar estudiantes (probablemente falta de permisos Moodle):", error);
    } finally {
      // ✅ PASE LO QUE PASE, ENTRAMOS AL DASHBOARD
      setSelectedClassId(courseId);
      setView('dashboard');
      toast.dismiss();
    }
  };

  const handleCreateClass = async (name: string) => {
    const shortname = name.substring(0, 10).toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 100);
    toast.loading("Creando clase...");
    
    try {
      await createCourse(name, shortname);
      toast.success("Clase creada exitosamente");
      const updatedCourses = await getCourses();
      setCourses(updatedCourses);
    } catch (error) {
      console.error("Error al crear clase:", error);
      toast.error("Error al crear la clase");
    } finally {
      toast.dismiss();
    }
  };

  // ========== GESTIÓN DE TAREAS ==========
  const handleSaveNewTask = async (taskData: any) => {
    try {
      if (taskToEdit) {
        await updateMoodleTask(taskToEdit.postId || taskToEdit.id, taskData.title, taskData.description, taskData.content_data);
        toast.success("Tarea actualizada");
      } else {
        await createMoodleTask(taskData.title, taskData.description, taskData.content_data);
        toast.success("Tarea creada");
      }
      
      setShowTaskBuilder(false);
      setTaskToEdit(null);
      setTaskBuilderMode('create');
      setStartBuilderWithAI(false);
      
      const updatedTasks = await getMoodleTasks();
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error al guardar tarea:", error);
      toast.error("Error al guardar la tarea");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta tarea?")) return;
    
    try {
      await deleteMoodleTask(taskId);
      const updatedTasks = await getMoodleTasks();
      setTasks(updatedTasks);
      toast.success("Tarea eliminada");
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      toast.error("Error al eliminar la tarea");
    }
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setTaskBuilderMode('edit');
    setShowTaskBuilder(true);
  };

  // ========== NAVEGACIÓN ==========
  const handleGoHome = () => {
    setView('home');
    setSelectedClassId(null);
    setSelectedStudentId(null);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setView('home');
    setRealSubmissions([]);
    setStudents([]);
    setSelectedClassId(null);
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
  };

  // ========== RENDERIZADO ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">Cargando LuinGo...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border-b-4 border-rose-300 max-w-md text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Error de Conexión</h2>
          <p className="text-slate-600 mb-6">{connectionError}</p>
          <Button onClick={initMoodle} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <div className="bg-white p-8 rounded-3xl shadow-xl border-b-4 border-indigo-300 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl font-black text-white">L</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">LuinGo</h1>
            <p className="text-slate-500">Plataforma de Aprendizaje Gamificado</p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Ingresa tu usuario de Moodle"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && usernameInput && initializeUser(usernameInput)}
              className="h-12 text-lg"
            />
            <Button 
              onClick={() => usernameInput && initializeUser(usernameInput)}
              disabled={!usernameInput}
              className="w-full h-12 text-lg font-bold"
            >
              <LogOut className="w-5 h-5 mr-2 rotate-180" />
              Entrar
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Conectado a Moodle • Sistema de Gamificación Activo 🎮
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Toaster position="top-center" richColors />
      
      {/* ========== HEADER GLOBAL (Solo en Dashboard) ========== */}
      {view === 'dashboard' && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGoHome}
                className="text-slate-400 hover:text-indigo-600"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-black text-slate-800">LuinGo</h1>
                <p className="text-xs text-slate-500">
                  {currentUser.role === 'teacher' ? 'Panel del Profesor' : 'Panel del Estudiante'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right mr-2">
                <p className="text-sm font-bold text-slate-700">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.role === 'teacher' ? 'Profesor' : 'Estudiante'}</p>
              </div>
              <img 
                src={currentUser.avatar_url} 
                alt={currentUser.name}
                className="w-10 h-10 rounded-full border-2 border-indigo-200"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-500"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>
      )}

      <main>
        {/* ========== TASK BUILDER MODAL ========== */}
        {showTaskBuilder && (
          <TaskBuilder 
            onSaveTask={handleSaveNewTask}
            onCancel={() => {
              setShowTaskBuilder(false);
              setTaskToEdit(null);
              setTaskBuilderMode('create');
              setStartBuilderWithAI(false);
            }}
            initialData={taskToEdit || undefined}
            autoOpenAI={startBuilderWithAI}
          />
        )}

        {/* ========== CLASS SELECTION ========== */}
        {view === 'home' && (
          <ClassSelection 
            courses={courses}
            onSelectClass={handleSelectClass}
            onCreateClass={handleCreateClass}
          />
        )}

        {/* ========== TEACHER DASHBOARD ========== */}
        {view === 'dashboard' && currentUser.role === 'teacher' && (
          <>
            <TeacherDashboard
              classroom={classroom}
              students={students}
              tasks={tasks}
              onSelectStudent={handleSelectStudent}
              onGenerateTask={() => {
                setStartBuilderWithAI(true);
                setShowTaskBuilder(true);
              }}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
            />

            {/* ========== STUDENT PASSPORT SHEET ========== */}
            <Sheet open={!!selectedStudentId} onOpenChange={(o) => !o && setSelectedStudentId(null)}>
              <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-hidden border-l-4 border-slate-200">
                <SheetTitle className="sr-only">Passport del Estudiante</SheetTitle>
                <SheetDescription className="sr-only">Detalles y progreso del estudiante</SheetDescription>
                {selectedStudentId && (
                  <StudentPassport 
                    student={students.find(s => s.id === selectedStudentId)!}
                    tasks={tasks}
                    submissions={realSubmissions.filter(s => 
                      String(s.student_id) === String(selectedStudentId) || 
                      s.student_name === students.find(st => st.id === selectedStudentId)?.name
                    )}
                    onBack={() => setSelectedStudentId(null)}
                    onAssignTask={() => {
                      setSelectedStudentId(null);
                      setShowTaskBuilder(true);
                    }}
                  />
                )}
              </SheetContent>
            </Sheet>
          </>
        )}

        {/* ========== STUDENT DASHBOARD ========== */}
        {view === 'dashboard' && currentUser.role === 'student' && (
          <StudentDashboard 
            student={students[0] || { ...currentUser, level: 1, xp_points: 0 } as any}
            tasks={tasks}
            submissions={realSubmissions}
            onLogout={handleLogout}
            onSelectTask={(task) => {
              const exercise: Exercise = {
                title: task.title,
                level: task.level_tag || 'A1',
                banana_reward_total: 100,
                questions: task.content_data.questions || []
              };
              setActiveExercise(exercise);
              setView('exercise');
            }}
          />
        )}

        {/* ========== EXERCISE PLAYER ========== */}
        {view === 'exercise' && activeExercise && (
          <ExercisePlayer 
            exercise={activeExercise}
            studentName={currentUser?.name}
            onExit={() => {
              setActiveExercise(null);
              setView('dashboard');
            }}
            onComplete={async (score, answers) => {
              toast.success("¡Tarea finalizada!");
              
              if (currentUser) {
                const taskRef = tasks.find(t => t.title === activeExercise.title);
                
                await submitTaskResult(
                  taskRef?.id || 'unknown',
                  activeExercise.title,
                  currentUser.id,
                  currentUser.name,
                  score,
                  activeExercise.questions.length,
                  answers
                );
                
                // Recargar submissions
                const newSubs = await getMoodleSubmissions();
                const mySubs = newSubs.filter((s: any) => 
                  String(s.student_id) === String(currentUser.id) || 
                  s.student_name === currentUser.name
                );
                setRealSubmissions(mySubs);
                
                // Actualizar XP
                const xp = mySubs.length * 15;
                const level = calculateLevelFromXP(xp);
                setCurrentUser({
                  ...currentUser,
                  xp_points: xp,
                  level: level
                });
              }
              
              setActiveExercise(null);
              setView('dashboard');
            }}
          />
        )}
      </main>
    </div>
  );
}
