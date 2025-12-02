import React, { useState, useEffect } from 'react';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ClassSelection } from './components/ClassSelection';
import { StudentPassport } from './components/StudentPassport';
import { TaskCorrector } from './components/TaskCorrector';
import { WritingEditor } from './components/WritingEditor'; // ✅ NUEVO IMPORT
import { CommentWall } from './components/CommentWall';
import { MediaViewer } from './components/MediaViewer';
import { NotificationBell } from './components/NotificationBell';
import { StudentDashboard } from './components/StudentDashboard';
import { TaskBuilder } from './components/TaskBuilder';
import { PDFAnnotator } from './components/PDFAnnotator';
import { ExercisePlayer } from './components/ExercisePlayer';
import { ProfileEditor } from './components/ProfileEditor'; // ✅ NUEVO: Editor de perfil
import { ForgotPasswordModal } from './components/ForgotPasswordModal'; // ✅ NUEVO: Modal de recuperación de contraseña
import { getSiteInfo, createMoodleTask, getMoodleTasks, getCourses, getEnrolledUsers, submitTaskResult, getUserByUsername, deleteMoodleTask, updateMoodleTask, getMoodleSubmissions, createCourse, loginToMoodle, getMe, getUserCourses, getUserPreferences, saveUserPreferences, getMyCourseProfile, setUserToken, clearUserToken } from './lib/moodle';
import { mockClassroom, LUINGO_LEVELS } from './lib/mockData';
import { Comment, Correction, Notification, User, Task, Student, Exercise, Submission } from './types'; 
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { ArrowLeft, MessageCircle, Play, LogOut, Sparkles, Target, Home, Settings, RefreshCw, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './components/ui/dialog';
import { Toaster, toast } from 'sonner@2.0.3';
import luingoLogo from 'figma:asset/5c3aee031df4e645d2ea41499714325beb9cd4f4.png';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';

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
  const [view, setView] = useState<'home' | 'dashboard' | 'task-detail' | 'exercise' | 'correction' | 'pdf-viewer' | 'writing' | 'pdf-annotator'>('home'); // ✅ Añadida vista 'pdf-annotator'
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // ✅ RENOMBRADO: activePDFTask → selectedTask (para unificar con handlers)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // ✅ NUEVOS ESTADOS PARA WRITING
  const [activeWritingTask, setActiveWritingTask] = useState<Task | null>(null);
  const [activeWritingSubmission, setActiveWritingSubmission] = useState<Submission | null>(null);
  
  const [showTaskBuilder, setShowTaskBuilder] = useState(false); 
  const [taskBuilderMode, setTaskBuilderMode] = useState<'create' | 'edit'>('create');
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [startBuilderWithAI, setStartBuilderWithAI] = useState(false);
  
  // ✅ NUEVO: Estado para el editor de perfil
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  
  const [classroom, setClassroom] = useState(mockClassroom);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ✅ ESTADO ÚNICO DE LA VERDAD (Solo datos reales de Moodle)
  const [realSubmissions, setRealSubmissions] = useState<Submission[]>([]);
  
  const [usernameInput, setUsernameInput] = useState("");
  
  // ✅ NUEVO: Estados para login real
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showPasswordChangeRequired, setShowPasswordChangeRequired] = useState(false); // ✅ NUEVO

  // ========== FUNCIÓN HELPER: RECARGAR ENTREGAS SIN PÉRDIDA DE ESTADO ==========
  const loadSubmissions = async () => {
    try {
      console.log('🔄 Recargando submissions...');
      const updatedSubs = await getMoodleSubmissions();
      
      if (currentUser?.role === 'teacher') {
        // Profesor ve todas las entregas
        setRealSubmissions(updatedSubs);
        console.log('✅ Submissions del profesor actualizadas:', updatedSubs.length);
      } else if (currentUser) {
        // Estudiante solo ve las suyas
        const mySubs = updatedSubs.filter((s: any) => 
          String(s.student_id) === String(currentUser.id) || 
          s.student_name === currentUser.name
        );
        setRealSubmissions(mySubs);
        console.log('✅ Submissions del estudiante actualizadas:', mySubs.length);
        
        // Actualizar XP y nivel del estudiante
        const xp = mySubs.length * 15;
        const level = calculateLevelFromXP(xp);
        setCurrentUser({
          ...currentUser,
          xp_points: xp,
          level: level
        });
      }
    } catch (error) {
      console.error('❌ Error al recargar submissions:', error);
      throw error; // Re-lanzar para que el componente lo maneje
    }
  };

  // ========== INICIALIZACIÓN MOODLE ==========
  const initMoodle = async () => {
    setLoading(true);
    setConnectionError(null);
    
    try {
      // ✅ NO HACER LLAMADAS SIN TOKEN
      // Solo marcamos la app como lista para recibir credenciales
      console.log('✅ LuinGo listo para autenticación');
      // La verificación de conexión se hará DESPUÉS del login con token válido
    } catch (e) {
      console.error("Error inicializando app:", e);
      setConnectionError("Error crítico al inicializar la aplicación.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initMoodle();
  }, []);

  // ========== INICIALIZACIÓN DE USUARIO ==========
  const handleRealLogin = async () => {
    if (!usernameInput || !passwordInput) return toast.error("Faltan credenciales");
    setLoading(true);

    try {
        // 1. Autenticación (Token Personal)
        const token = await loginToMoodle(usernameInput, passwordInput);
        if (!token) {
            // ⚠️ Fallback de seguridad (no debería llegar aquí con el nuevo loginToMoodle)
            setLoading(false);
            return toast.error("❌ Usuario o contraseña incorrectos");
        }

        // ✅ GUARDAR EL TOKEN DEL USUARIO
        setUserToken(token);

        // 2. Identidad Básica (ID y Nombre)
        let meData;
        try {
          meData = await getMe(token);
        } catch (e) {
          // ✅ DETECCIÓN TEMPRANA: Si getMe falla con forcepasswordchange, parar aquí
          if (e instanceof Error && e.message === "FORCE_PASSWORD_CHANGE") {
            throw e; // Re-lanzar para el catch principal
          }
          throw new Error("No se pudo cargar el perfil");
        }
        
        if (!meData || !meData.userid) throw new Error("No se pudo cargar el perfil");

        // 3. 🔥 RECUPERAR DATOS REALES (EMAIL) USANDO LLAVE MAESTRA
        let realEmail = meData.email;
        try {
          // Intentamos obtener datos extra con el token maestro
          // ⚠️ DEGRADACIÓN SUAVE: Si falla, NO bloqueamos el login del usuario
          const fullProfile = await getUserByUsername(usernameInput);
          if (fullProfile?.email) {
            realEmail = fullProfile.email;
          }
        } catch (e) {
          // 🛡️ CRÍTICO: Si el token maestro tiene problemas (ej: forcepasswordchange),
          // NO re-lanzamos el error porque NO es culpa del usuario.
          // Permitimos que entre con los datos básicos (meData)
          console.warn("⚠️ Advertencia no crítica: No se pudo obtener perfil completo (posible error de token maestro).");
          console.warn("   Usando email básico:", meData.email);
          // NO hacemos throw - Degradación suave
        }

        if (!realEmail) {
            console.warn("⚠️ Usando email de fallback.");
        }

        console.log("👤 Usuario:", meData.fullname, "| Email:", realEmail);

        // 4. Roles (Lógica Moodle-First)
        let finalRole: 'teacher' | 'student' = 'student';
        try {
            const myCourses = await getUserCourses(meData.userid);
            if (myCourses?.length > 0) {
                const roleChecks = await Promise.all(myCourses.map(async (course: any) => {
                    const profile = await getMyCourseProfile(meData.userid, course.id);
                    return profile?.roles?.some((r: any) => 
                        ['editingteacher', 'teacher', 'manager'].includes(r.shortname)
                    );
                }));
                if (roleChecks.includes(true)) finalRole = 'teacher';
            }
            // Fallback para admin global
            if (meData.userissiteadmin) finalRole = 'teacher';
        } catch (e) {
          // 🛡️ DEGRADACIÓN SUAVE: Si falla la detección de rol, usamos el rol por defecto
          // NO bloqueamos el login - el usuario puede entrar como estudiante
          console.warn("⚠️ No se pudo detectar rol, usando rol por defecto: student");
        }

        // 5. Preferencias (Avatar/Nivel)
        let userPrefs = null;
        let savedLevel = 'A1';
        try {
          userPrefs = await getUserPreferences(meData.userid);
          savedLevel = userPrefs?.level_code || 'A1';
        } catch (e) {
          console.warn("No se pudieron cargar preferencias, usando valores por defecto");
        }

        // 6. Crear Perfil de Sesión
        const userProfile: any = {
            id: String(meData.userid),
            email: realEmail || `${usernameInput}@sin-email.com`, // ✅ Usamos el email real
            name: meData.fullname,
            role: finalRole,
            avatar_url: userPrefs?.avatar_url || meData.userpictureurl,
            current_level_code: savedLevel,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        setCurrentUser(userProfile);
        
        // ✅ CARGAR DATOS DE MOODLE CON EL TOKEN DEL USUARIO
        console.log('📚 Cargando cursos y tareas con token de usuario...');
        
        // Cargar cursos
        try {
          // ✅ FIX: Estudiantes usan getUserCourses (solo sus cursos matriculados)
          // Profesores/admins usan getCourses (todos los cursos del campus)
          let moodleCourses = [];
          if (finalRole === 'student') {
            console.log('👨‍🎓 Usuario estudiante: cargando solo cursos matriculados...');
            moodleCourses = await getUserCourses(meData.userid);
          } else {
            console.log('👨‍🏫 Usuario profesor/admin: cargando todos los cursos...');
            moodleCourses = await getCourses();
          }
          
          if (Array.isArray(moodleCourses)) {
            // Filtrar cursos (excluir Site Home y plantillas)
            const cleanCourses = moodleCourses.filter((c: any) => 
              c.id !== 1 && c.shortname !== 'LuinGo' && c.format !== 'site'
            );
            setCourses(cleanCourses);
            console.log(`✅ ${cleanCourses.length} cursos cargados`);
          }
        } catch (e) {
          // 🛡️ DEGRADACIÓN SUAVE: Si falla la carga de cursos, continuamos con lista vacía
          // NO bloqueamos el login - el usuario puede entrar sin ver cursos inicialmente
          console.warn("⚠️ No se pudieron cargar cursos, usando lista vacía:", e);
          setCourses([]);
        }
        
        // Cargar tareas
        let tasksData = [];
        try {
          tasksData = await getMoodleTasks();
          setTasks(tasksData);
          console.log(`✅ ${tasksData.length} tareas cargadas`);
        } catch (e) {
          // 🛡️ DEGRADACIÓN SUAVE: Si falla la carga de tareas, continuamos con lista vacía
          console.warn("⚠️ No se pudieron cargar tareas, usando lista vacía");
          setTasks([]);
        }
        
        // Cargar submissions
        let subsData = [];
        try {
          subsData = await getMoodleSubmissions();
        } catch (e) {
          // 🛡️ DEGRADACIÓN SUAVE: Si falla la carga de submissions, continuamos con lista vacía
          console.warn("⚠️ No se pudieron cargar submissions, usando lista vacía");
        }

        if (finalRole === 'teacher') {
            setRealSubmissions(subsData);
        } else {
            const mySubs = subsData.filter((s: any) => String(s.student_id) === String(userProfile.id));
            setRealSubmissions(mySubs);
            setStudents([{
                ...userProfile,
                level: 1, 
                xp_points: mySubs.length * 50, 
                completed_tasks: mySubs.length,
                total_tasks: tasksData.length, 
                materials_viewed: []
            } as Student]);
        }

        toast.success(`¡Hola ${meData.firstname}!`);

    } catch (e) {
        console.error("Login Error:", e);
        
        const errorMessage = e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();

        // ✅ CASO 1: CAMBIO DE CONTRASEÑA REQUERIDO
        // Detectamos si el error contiene palabras clave de Moodle sobre cambio de password
        if (
          errorMessage.includes("forcepasswordchange") || 
          errorMessage.includes("password change") ||
          errorMessage.includes("must change your password") ||
          errorMessage === "force_password_change"
        ) {
          setLoading(false);
          setShowPasswordChangeRequired(true); // ✅ Abre el modal automáticamente
          return;
        }
        
        // ✅ CASO 2: CONTRASEÑA INCORRECTA
        // Detectamos errores típicos de login fallido
        if (
          errorMessage.includes("invalid login") || 
          errorMessage.includes("credenciales inválidas") ||
          errorMessage.includes("credenciales invalidas") ||
          errorMessage.includes("incorrect") ||
          errorMessage.includes("wrong password") ||
          errorMessage.includes("authentication failed")
        ) {
           toast.error("❌ Usuario o contraseña incorrectos");
           setLoading(false);
           return;
        }
        
        // ✅ CASO 3: ERROR GENÉRICO O DE CONEXIÓN
        toast.error("⚠️ Error de conexión con el Campus.");
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

        // ✅ CARGA PARALELA DE PREFERENCIAS (AVATAR Y NIVEL)
        const studentsWithPrefs = await Promise.all(realStudents.map(async (u: any) => {
          // Obtener preferencias guardadas (Avatar y Nivel)
          const prefs = await getUserPreferences(u.id);
          
          const userSubs = realSubmissions.filter(s => 
            s.student_name === u.fullname || 
            String(s.student_id) === String(u.id)
          );
          
          const xp = userSubs.length * 15;
          const calculatedLevel = calculateLevelFromXP(xp); // Nivel de juego (RPG)
          
          // Nivel de Idioma: Prioridad a la preferencia guardada, fallback a A1
          const languageLevel = prefs?.level_code || 'A1';

          return {
            id: String(u.id),
            name: u.fullname,
            email: u.email,
            avatar_url: prefs?.avatar_url || u.profileimageurl, // ✅ Usar avatar guardado también
            level: calculatedLevel,
            xp_points: xp,
            completed_tasks: userSubs.length,
            total_tasks: tasks.length,
            average_grade: 0,
            materials_viewed: [],
            current_level_code: languageLevel, // ✅ AQUÍ SE ASIGNA EL NIVEL REAL
            role: 'student',
            joined_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Student;
        }));

        setStudents(studentsWithPrefs);
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
      // ✅ NUEVO: Buscar la tarea para verificar si tiene PDF adjunto
      const taskToDelete = tasks.find(t => t.id === taskId);
      
      // ✅ BORRADO FÍSICO DEL PDF EN SUPABASE
      if (taskToDelete?.content_data?.type === 'document' && taskToDelete.content_data.pdf_url) {
        try {
          const fileUrl = taskToDelete.content_data.pdf_url;
          // Extraer la ruta relativa después de '/assignments/'
          const path = fileUrl.split('/assignments/')[1];
          
          if (path) {
            const supabase = createClient(
              `https://${projectId}.supabase.co`,
              publicAnonKey
            );
            
            const { error: storageError } = await supabase.storage
              .from('assignments')
              .remove([path]);
            
            if (storageError) {
              console.warn("⚠️ Error al borrar PDF de Supabase:", storageError);
            } else {
              console.log("🗑️ PDF eliminado de Supabase:", path);
            }
          }
        } catch (e) {
          console.error("❌ Error al intentar borrar archivo de Supabase:", e);
          // No bloqueamos la eliminación de la tarea si falla el borrado del archivo
        }
      }
      
      // Continuar con el borrado de la tarea en Moodle
      await deleteMoodleTask(taskId);
      const updatedTasks = await getMoodleTasks();
      setTasks(updatedTasks);
      toast.success("Tarea eliminada correctamente");
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
    clearUserToken(); // ✅ LIMPIAR TOKEN DEL USUARIO
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
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src={luingoLogo} alt="LuinGo Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">LuinGo</h1>
            <p className="text-slate-500">Plataforma de Aprendizaje Gamificado</p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Usuario (ej: alumno1)"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRealLogin()}
              className="h-12 text-lg"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRealLogin()}
                className="h-12 text-lg pr-10"
              />
              <button 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <Button 
              onClick={handleRealLogin}
              disabled={!usernameInput || !passwordInput}
              className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar al Campus"}
            </Button>

            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-indigo-500 hover:text-indigo-700 hover:underline font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <KeyRound className="w-3 h-3" /> ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Conectado a Moodle • Sistema de Gamificación Activo 🎮
            </p>
          </div>

          {/* ========== FORGOT PASSWORD MODAL ========== */}
          <ForgotPasswordModal 
            isOpen={showForgotModal} 
            onClose={() => setShowForgotModal(false)}
            initialValue={usernameInput} 
          />
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
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 p-1.5 pr-3 rounded-full transition-all border border-transparent hover:border-slate-200"
                onClick={() => setShowProfileEditor(true)}
                title="Editar mi perfil"
              >
                <div className="text-right mr-1 hidden sm:block">
                  <p className="text-sm font-bold text-slate-700 leading-none">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{currentUser.role === 'teacher' ? 'Profesor' : 'Estudiante'}</p>
                </div>
                <img 
                  src={currentUser.avatar_url} 
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full border-2 border-white shadow-sm bg-indigo-50"
                />
              </div>
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
            students={students} // ✅ PASAR LA LISTA DE ESTUDIANTES
          />
        )}

        {/* ========== CLASS SELECTION ========== */}
        {view === 'home' && (
          <ClassSelection 
            courses={courses}
            onSelectClass={handleSelectClass}
            onCreateClass={handleCreateClass}
            onLogout={handleLogout} // ✅ AGREGADO: Conectamos la función de salir
          />
        )}

        {/* ========== TEACHER DASHBOARD ========== */}
        {view === 'dashboard' && currentUser.role === 'teacher' && (
          <>
            <TeacherDashboard
              classroom={classroom}
              students={students}
              tasks={tasks}
              currentUser={currentUser} // ✅ NUEVO: Pasar el usuario logueado para firmar comentarios
              submissions={realSubmissions}
              onSelectStudent={handleSelectStudent}
              onGenerateTask={() => {
                setStartBuilderWithAI(true);
                setShowTaskBuilder(true);
              }}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
              onRefreshSubmissions={async () => {
                try {
                  const updatedSubs = await getMoodleSubmissions();
                  setRealSubmissions(updatedSubs);
                  toast.success('📥 Entregas actualizadas');
                } catch (error) {
                  console.error('Error al refrescar entregas:', error);
                  toast.error('Error al actualizar entregas');
                }
              }}
              onLogout={handleLogout} // ✅ NUEVO: Pasar logout también
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
                    isTeacher={true} // ✅ MODO PROFESOR: Habilita edición de calificaciones
                    onRefresh={loadSubmissions} // ✅ REFRESCO SIN PÉRDIDA DE ESTADO
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
              // ✅ DETECTAR TIPO DE TAREA: Writing vs Document vs Quiz
              if (task.content_data?.type === 'writing') {
                // ✅ TAREA TIPO WRITING
                console.log('📝 Abriendo tarea de redacción:', task.title);
                setActiveWritingTask(task);
                
                // ✅ Buscar borrador o submission existente
                const existing = realSubmissions.find(s => 
                  s.task_id === task.id && 
                  (String(s.student_id) === String(currentUser.id) || s.student_name === currentUser.name)
                );
                
                // ✅ Si existe, recuperar el texto del borrador/submission
                // El texto se guarda en text_content
                const draftText = existing?.text_content || '';
                const draftStatus = existing?.status || 'assigned';
                
                console.log('📄 Borrador encontrado:', { draftText, draftStatus, existing });
                
                setActiveWritingSubmission(existing || null);
                setView('writing');
              } else if (task.content_data?.type === 'document') {
                // ✅ TAREA TIPO DOCUMENT PDF
                console.log('📄 Abriendo tarea de documento PDF:', task.title);
                setSelectedTask(task);
                setView('pdf-annotator');
              } else {
                // ✅ TAREA TIPO QUIZ (EXISTENTE)
                const exercise: Exercise = {
                  title: task.title,
                  level: task.level_tag || 'A1',
                  banana_reward_total: 100,
                  questions: task.content_data.questions || []
                };
                setActiveExercise(exercise);
                setView('exercise');
              }
            }}
          />
        )}

        {/* ========== ✅ WRITING EDITOR (ACTUALIZADO CON BORRADORES) ========== */}
        {view === 'writing' && activeWritingTask && currentUser && (
          <WritingEditor
            task={activeWritingTask}
            initialText={activeWritingSubmission?.textContent || activeWritingSubmission?.text_content || ''} // ✅ RECUPERAR TEXTO DEL BORRADOR
            onBack={() => {
              setActiveWritingTask(null);
              setActiveWritingSubmission(null);
              setView('dashboard');
            }}
            onSaveDraft={async (text) => {
              // ✅ GUARDAR BORRADOR (status: 'draft')
              console.log('💾 Guardando borrador de redacción...');
              
              await submitTaskResult(
                activeWritingTask.id,
                activeWritingTask.title,
                currentUser.id,
                currentUser.name,
                0, // Score 0 para borradores
                10,
                [], // No hay answers en writing
                text, // ✅ textContent
                'draft', // ✅ status
                [] // ✅ corrections vacío
              );
              
              // ✅ Recargar submissions para actualizar el borrador
              await loadSubmissions();
              console.log('✅ Borrador guardado correctamente');
            }}
            onSubmit={async (text) => {
              // ✅ ENVÍO FINAL (status: 'submitted')
              console.log('📤 Enviando redacción final...');
              
              await submitTaskResult(
                activeWritingTask.id,
                activeWritingTask.title,
                currentUser.id,
                currentUser.name,
                0, // Score 0, esperando corrección del profesor
                10,
                [],
                text, // ✅ textContent
                'submitted', // ✅ status
                [] // ✅ corrections vacío
              );
              
              // ✅ Recargar submissions y volver al dashboard
              await loadSubmissions();
              setActiveWritingTask(null);
              setActiveWritingSubmission(null);
              setView('dashboard');
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

        {/* ========== PDF ANNOTATOR (DOCUMENTO PDF) ========== */}
        {view === 'pdf-annotator' && selectedTask && selectedTask.content_data?.type === 'document' && (() => {
          // ✅ RECUPERACIÓN ROBUSTA DE BORRADORES: Buscar el último intento (draft o submitted)
          const userSubmissions = realSubmissions.filter(s => 
            s.task_id === selectedTask.id && 
            (String(s.student_id) === String(currentUser?.id) || s.student_name === currentUser?.name)
          );
          
          // Priorizar draft, si no existe buscar el último submitted
          const lastDraft = userSubmissions.find(s => s.status === 'draft');
          const lastSubmitted = userSubmissions.find(s => s.status === 'submitted' || s.status === 'graded');
          const lastAttempt = lastDraft || lastSubmitted;
          
          // ✅ RECUPERAR ANOTACIONES: Prioridad pdf_annotations, fallback a answers (por compatibilidad)
          const recoveredAnnotations = lastAttempt?.pdf_annotations || lastAttempt?.answers || [];
          
          console.log('📂 Recuperando borrador PDF:', {
            total_submissions: userSubmissions.length,
            last_draft: !!lastDraft,
            last_submitted: !!lastSubmitted,
            annotations_count: recoveredAnnotations.length,
            status: lastAttempt?.status
          });
          
          return (
            <div className="h-screen flex flex-col">
              {/* Header */}
              <div className="bg-white border-b border-slate-200 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setSelectedTask(null);
                        setView('dashboard');
                      }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver
                    </Button>
                    <div>
                      <h1 className="font-black text-xl text-slate-800">{selectedTask.title}</h1>
                      <p className="text-sm text-slate-500">{selectedTask.content_data.instructions}</p>
                      {lastAttempt && (
                        <p className="text-xs text-indigo-600 font-bold mt-1">
                          ✨ Borrador recuperado ({recoveredAnnotations.length} anotaciones)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Annotator */}
              <div className="flex-1">
                <PDFAnnotator
                  mode="student"
                  pdfUrl={selectedTask.content_data.pdf_url || ''}
                  initialAnnotations={recoveredAnnotations}
                  onSaveDraft={async (annotations) => {
                    if (currentUser && selectedTask) {
                      // ✅ VALIDACIÓN: No guardar si está vacío (evitar "intentos vacíos")
                      if (annotations.length === 0) {
                        toast.warning('⚠️ No hay anotaciones para guardar. Añade notas al documento primero.');
                        return;
                      }
                      
                      console.log('💾 Guardando borrador con', annotations.length, 'anotaciones');
                      
                      await submitTaskResult(
                        selectedTask.id,
                        selectedTask.title,
                        currentUser.id,
                        currentUser.name,
                        0, // Score 0, esperando corrección
                        10,
                        annotations as any,
                        '', // No hay text_content
                        'draft', // <--- IMPORTANTE: Status 'draft' activa la lógica de actualización en el backend
                        [], // No hay corrections
                        annotations as any
                      );
                      
                      // 🔥 RECARGAR DATOS PARA QUE LA APP SEPA QUE EXISTE EL BORRADOR
                      await loadSubmissions();
                      toast.success('✅ Avance guardado. Puedes continuar más tarde.')
                    }
                  }}
                  onSave={async (annotations) => {
                    if (currentUser && selectedTask) {
                      // ✅ VALIDACIÓN: No enviar si está vacío
                      if (annotations.length === 0) {
                        toast.error('❌ No puedes entregar una tarea vacía. Añade anotaciones primero.');
                        return;
                      }
                      
                      // ✅ CONFIRMACIÓN: Prevenir entregas accidentales
                      if (!window.confirm('¿Estás seguro de entregar la tarea final? Ya no podrás editarla.')) {
                        return;
                      }
                      
                      console.log('🚀 Entregando tarea con', annotations.length, 'anotaciones');
                      
                      await submitTaskResult(
                        selectedTask.id,
                        selectedTask.title,
                        currentUser.id,
                        currentUser.name,
                        0, // Score 0, esperando corrección
                        10,
                        annotations as any,
                        '', // No hay text_content
                        'submitted', // <--- IMPORTANTE: Status 'submitted' cierra la tarea
                        [], // No hay corrections
                        annotations as any
                      );
                      
                      await loadSubmissions(); // Refrescar datos
                      setSelectedTask(null);
                      setView('dashboard'); // Salir
                      toast.success('🚀 Tarea entregada con éxito');
                    }
                  }}
                />
              </div>
            </div>
          );
        })()}
      </main>
      
      {/* ========== PROFILE EDITOR MODAL ========== */}
      {showProfileEditor && currentUser && (
        <ProfileEditor 
          user={currentUser}
          isOpen={showProfileEditor}
          onClose={() => setShowProfileEditor(false)}
          onUpdate={(updatedData) => {
             setCurrentUser({ ...currentUser, ...updatedData });
             // Actualizar también la lista de estudiantes si soy uno
             if (currentUser.role === 'student') {
                setStudents(prev => prev.map(s => s.id === currentUser.id ? { ...s, ...updatedData } : s));
             }
          }}
        />
      )}
      
      {/* ========== PASSWORD CHANGE REQUIRED MODAL ========== */}
      <Dialog open={showPasswordChangeRequired} onOpenChange={setShowPasswordChangeRequired}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <KeyRound className="w-5 h-5" />
              Cambio de Contraseña Requerido
            </DialogTitle>
            <DialogDescription className="text-slate-600 space-y-3 pt-2">
              <p>
                🔐 Por políticas de seguridad de Moodle, debes cambiar tu contraseña antes de poder acceder a LuinGo.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <p className="font-bold text-amber-800 mb-2">📋 Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-700">
                  <li>Abre <a href="https://luingo.moodiy.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900">luingo.moodiy.com</a> en otra pestaña</li>
                  <li>Inicia sesión con tus credenciales actuales</li>
                  <li>Moodle te pedirá cambiar la contraseña</li>
                  <li>Elige una nueva contraseña segura</li>
                  <li>Regresa aquí e inicia sesión con la nueva contraseña</li>
                </ol>
              </div>
              <p className="text-xs text-slate-500">
                💡 Si necesitas ayuda, contacta al administrador del campus.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowPasswordChangeRequired(false);
                window.open('https://luingo.moodiy.com', '_blank');
              }}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Abrir Moodle para Cambiar Contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}