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

        // ✅ Cargar tareas una sola vez - REEMPLAZAR, NO APPEND
        const forumTasks = await getMoodleTasks();
        setTasks(forumTasks);
        
        console.log("✅ Moodle inicializado correctamente");
      } else {
        setConnectionError("No se pudo conectar a Moodle.");
      }
    } catch (e) {
      console.error("Error al conectar con Moodle:", e);
      setConnectionError("Error crítico al inicializar Moodle.");
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
        
        // Lógica de roles
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

        // ✅ CARGAR DATOS REALES Y LIMPIOS - REEMPLAZAR, NO APPEND
        const [latestTasks, allSubs] = await Promise.all([
          getMoodleTasks(),
          getMoodleSubmissions()
        ]);
        
        console.log("📊 Datos cargados:", {
          tareas: latestTasks.length,
          submissions: allSubs.length
        });
        
        setTasks(latestTasks); // ✅ Reemplazar completamente
        
        // ✅ Filtrar submissions según rol
        if (role === 'teacher') {
          // Profesor ve todas las submissions
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
  const handleSelectClass = async (courseId: string) => {
    toast.loading("Cargando clase...");
    
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
        setSelectedClassId(courseId);
        setView('dashboard');
        toast.dismiss();
        toast.success("Clase cargada correctamente");
      }
    } catch (error) {
      console.error("Error al cargar clase:", error);
      toast.dismiss();
      toast.error("Error al cargar clase");
    }
  };

  // ========== GESTIÓN DE TAREAS ==========
  const handleGenerateTask = () => {
    setTaskToEdit(null);
    setTaskBuilderMode('create');
    setStartBuilderWithAI(true);
    setShowTaskBuilder(true);
  };

  const handleSaveNewTask = async (taskData: any) => {
    try {
      if (taskToEdit) {
        // Editar tarea existente
        await updateMoodleTask(
          taskToEdit.postId || taskToEdit.id,
          taskData.title,
          taskData.description,
          taskData.content_data
        );
        toast.success("Tarea actualizada correctamente");
      } else {
        // Crear nueva tarea
        await createMoodleTask(
          taskData.title,
          taskData.description,
          taskData.content_data
        );
        toast.success("Tarea creada correctamente");
      }

      setShowTaskBuilder(false);
      setTaskToEdit(null);
      setStartBuilderWithAI(false);

      // ✅ RECARGAR TAREAS LIMPIAMENTE - REEMPLAZAR
      const updated = await getMoodleTasks();
      setTasks(updated);
      
      console.log("✅ Tareas actualizadas:", updated.length);
    } catch (error) {
      console.error("Error al guardar tarea:", error);
      toast.error("Error al guardar tarea");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("¿Seguro que quieres borrar esta tarea?")) return;
    
    try {
      await deleteMoodleTask(taskId);
      
      // ✅ RECARGAR TAREAS - REEMPLAZAR
      const updated = await getMoodleTasks();
      setTasks(updated);
      
      toast.success("Tarea borrada");
    } catch (error) {
      console.error("Error al borrar tarea:", error);
      toast.error("Error al borrar tarea");
    }
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setTaskBuilderMode('edit');
    setStartBuilderWithAI(false);
    setShowTaskBuilder(true);
  };

  // ========== GESTIÓN DE SUBMISSIONS ==========
  const loadSubmissions = async () => {
    try {
      const allSubs = await getMoodleSubmissions();
      
      if (currentUser?.role === 'teacher') {
        setRealSubmissions(allSubs);
      } else {
        const mySubs = allSubs.filter((s: any) => 
          s.student_name === currentUser?.name || 
          String(s.student_id) === String(currentUser?.id)
        );
        setRealSubmissions(mySubs);
      }
      
      console.log("✅ Submissions recargadas");
    } catch (error) {
      console.error("Error al cargar submissions:", error);
    }
  };

  // ========== GESTIÓN DE EJERCICIOS ==========
  const handleSelectTask = (task: Task) => {
    if (task.content_data?.type === 'pdf') {
      setActivePDFTask(task);
      setView('pdf-viewer');
    } else {
      const exercise: Exercise = {
        title: task.title,
        level: task.level_tag || 'A1',
        banana_reward_total: 100,
        questions: task.content_data?.questions || []
      };
      setActiveExercise(exercise);
      setView('exercise');
    }
  };

  const handleExerciseComplete = async (score: number, answers: any[]) => {
    toast.success("¡Tarea finalizada!");
    
    if (currentUser && activeExercise) {
      try {
        // Buscar ID de la tarea
        const taskRef = tasks.find(t => t.title === activeExercise.title);
        
        if (taskRef) {
          await submitTaskResult(
            taskRef.id,
            activeExercise.title,
            currentUser.id,
            currentUser.name,
            score,
            activeExercise.questions.length,
            answers
          );
          
          console.log("✅ Resultado enviado a Moodle");
          
          // ✅ RECARGA FORZADA DE SUBMISSIONS - REEMPLAZAR
          await loadSubmissions();
          
          // Actualizar XP del usuario
          const newSubs = await getMoodleSubmissions();
          const mySubs = newSubs.filter((s: any) => 
            s.student_name === currentUser.name || 
            String(s.student_id) === String(currentUser.id)
          );
          
          const newXP = mySubs.length * 15;
          const newLevel = calculateLevelFromXP(newXP);
          
          setCurrentUser(prev => ({
            ...prev!,
            xp_points: newXP,
            level: newLevel
          }));
          
          toast.success(`+15 XP | Total: ${newXP} XP`);
        }
      } catch (error) {
        console.error("Error al enviar resultado:", error);
        toast.error("Error al guardar resultado");
      }
    }
    
    // ✅ VUELTA DIRECTA AL DASHBOARD (Sin pasar por 'correction')
    setView('dashboard');
    setActiveExercise(null);
  };

  const handleExerciseExit = () => {
    // ✅ VUELTA DIRECTA AL DASHBOARD
    setView('dashboard');
    setActiveExercise(null);
  };

  // ========== GESTIÓN DE ESTUDIANTES ==========
  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home');
    setRealSubmissions([]);
    setTasks([]);
    setStudents([]);
    toast.info("Sesión cerrada");
  };

  // ========== CREAR NUEVA CLASE ==========
  const handleCreateClass = async (courseName: string, shortName: string) => {
    try {
      const result = await createCourse(courseName, shortName);
      if (result) {
        toast.success("Clase creada correctamente");
        const moodleCourses = await getCourses();
        if (Array.isArray(moodleCourses)) {
          setCourses(moodleCourses);
        }
      }
    } catch (error) {
      console.error("Error al crear clase:", error);
      toast.error("Error al crear clase");
    }
  };

  // ========== RENDER ==========
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      <Toaster position="top-right" richColors />

      {/* TASK BUILDER MODAL */}
      {showTaskBuilder && (
        <TaskBuilder 
          onSaveTask={handleSaveNewTask}
          onCancel={() => {
            setShowTaskBuilder(false);
            setTaskToEdit(null);
            setStartBuilderWithAI(false);
          }}
          initialData={taskToEdit || undefined}
          autoOpenAI={startBuilderWithAI}
        />
      )}

      {/* PANTALLA DE CARGA */}
      {loading && (
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-600 font-medium">Conectando con Moodle...</p>
          </div>
        </div>
      )}

      {/* ERROR DE CONEXIÓN */}
      {connectionError && !loading && (
        <div className="h-full w-full flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border-2 border-red-200 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Error de Conexión</h2>
            <p className="text-slate-600 mb-6">{connectionError}</p>
            <Button onClick={initMoodle} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {/* PANTALLA DE LOGIN */}
      {!loading && !connectionError && !currentUser && view === 'home' && (
        <div className="h-full w-full flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-100">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white font-black text-3xl">L</span>
              </div>
              <h1 className="text-3xl font-black text-slate-800 mb-2">LuinGo</h1>
              <p className="text-slate-500">Plataforma LMS con IA</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Usuario de Moodle
                </label>
                <Input
                  type="text"
                  placeholder="Ingresa tu username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && usernameInput && initializeUser(usernameInput)}
                  className="w-full h-12 text-lg"
                />
              </div>

              <Button
                onClick={() => usernameInput && initializeUser(usernameInput)}
                disabled={!usernameInput}
                className="w-full h-12 text-lg font-black"
              >
                Entrar
              </Button>

              <div className="text-xs text-slate-400 text-center mt-4">
                <p>👨‍🏫 Profesor: <code className="bg-slate-100 px-2 py-1 rounded">luigi</code></p>
                <p>👨‍🎓 Estudiante: <code className="bg-slate-100 px-2 py-1 rounded">admin</code></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SELECCIÓN DE CLASE */}
      {!loading && !connectionError && currentUser && view === 'home' && (
        <ClassSelection
          courses={courses}
          onSelectClass={handleSelectClass}
          onCreateClass={handleCreateClass}
          userName={currentUser.name}
          userRole={currentUser.role}
        />
      )}

      {/* DASHBOARD DEL PROFESOR */}
      {view === 'dashboard' && currentUser?.role === 'teacher' && (
        <>
          <TeacherDashboard
            classroom={classroom}
            students={students}
            tasks={tasks}
            submissions={realSubmissions}
            onSelectStudent={handleSelectStudent}
            onGenerateTask={handleGenerateTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onRefreshSubmissions={loadSubmissions}
          />

          {/* SHEET: PERFIL DEL ESTUDIANTE */}
          <Sheet 
            open={!!selectedStudentId} 
            onOpenChange={(open) => !open && setSelectedStudentId(null)}
          >
            <SheetContent side="right" className="w-full sm:max-w-2xl p-0 border-l-4 border-slate-200 bg-[#F0F4F8] overflow-y-auto">
              <SheetHeader className="hidden">
                <SheetTitle>Perfil del Estudiante</SheetTitle>
                <SheetDescription>Detalles y asignación de tareas</SheetDescription>
              </SheetHeader>

              {selectedStudentId && (
                <StudentPassport 
                  student={students.find(s => s.id === selectedStudentId) || students[0]}
                  tasks={tasks}
                  submissions={realSubmissions.filter(s => 
                    s.student_name === (students.find(st => st.id === selectedStudentId)?.name) ||
                    s.student_id === selectedStudentId
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

      {/* DASHBOARD DEL ESTUDIANTE */}
      {view === 'dashboard' && currentUser?.role === 'student' && (
        <StudentDashboard 
          student={students[0]}
          tasks={tasks}
          submissions={realSubmissions}
          onLogout={handleLogout}
          onSelectTask={handleSelectTask}
        />
      )}

      {/* REPRODUCTOR DE EJERCICIOS */}
      {view === 'exercise' && activeExercise && (
        <ExercisePlayer 
          exercise={activeExercise}
          studentName={currentUser?.name}
          onExit={handleExerciseExit}
          onComplete={handleExerciseComplete}
        />
      )}

      {/* VISOR DE PDF */}
      {view === 'pdf-viewer' && activePDFTask && (
        <PDFAnnotator
          pdfUrl={activePDFTask.content_data?.pdf_url || ''}
          taskTitle={activePDFTask.title}
          onBack={() => setView('dashboard')}
          onSubmit={() => {
            toast.success("PDF anotado guardado");
            setView('dashboard');
          }}
        />
      )}
    </div>
  );
}
