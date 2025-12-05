import React, { useState, useEffect } from "react";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { ClassSelection } from "./components/ClassSelection";
import { StudentPassport } from "./components/StudentPassport";
import { TaskCorrector } from "./components/TaskCorrector";
import { WritingEditor } from "./components/WritingEditor";
import { CommentWall } from "./components/CommentWall";
import { MediaViewer } from "./components/MediaViewer";
import { NotificationBell } from "./components/NotificationBell";
import { StudentDashboard } from "./components/StudentDashboard";
import { TaskBuilder } from "./components/TaskBuilder";
import { PDFAnnotator } from "./components/PDFAnnotator";
import { ExercisePlayer } from "./components/ExercisePlayer";
import { ProfileEditor } from "./components/ProfileEditor";
import { ForgotPasswordModal } from "./components/ForgotPasswordModal";
import { PublicLevelTestModal } from "./components/PublicLevelTestModal"; // 👈 [LEAD MAGNET] NUEVO IMPORT
import {
  getSiteInfo,
  createMoodleTask,
  getMoodleTasks,
  getCourses,
  getEnrolledUsers,
  submitTaskResult,
  getUserByUsername,
  deleteMoodleTask,
  updateMoodleTask,
  getMoodleSubmissions,
  createCourse,
  loginToMoodle,
  getMe,
  getUserCourses,
  getUserPreferences,
  saveUserPreferences,
  getMyCourseProfile,
  setUserToken,
  clearUserToken,
} from "./lib/moodle";
import { mockClassroom, LUINGO_LEVELS } from "./lib/mockData";
import {
  Comment,
  Correction,
  Notification,
  User,
  Task,
  Student,
  Exercise,
  Submission,
} from "./types";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  ArrowLeft,
  MessageCircle,
  Play,
  LogOut,
  Sparkles,
  Target,
  Home,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./components/ui/dialog";

// ✅ ESTRATEGIA VISUAL: Usamos imports limpios para que las ventanas funcionen
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

import luingoLogo from "figma:asset/5c3aee031df4e645d2ea41499714325beb9cd4f4.png";
import { createClient } from "@supabase/supabase-js";
import {
  projectId,
  publicAnonKey,
} from "./utils/supabase/info";

// ========== LÓGICA DE RACHA (STREAK) ==========
const checkStreak = (): number => {
  const lastLogin = localStorage.getItem("last_login_date");
  const currentStreak = parseInt(
    localStorage.getItem("streak_count") || "0",
  );
  const today = new Date().toDateString();

  if (lastLogin !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastLogin === yesterday.toDateString()) {
      const newStreak = currentStreak + 1;
      localStorage.setItem("streak_count", String(newStreak));
      localStorage.setItem("last_login_date", today);
      return newStreak;
    } else {
      localStorage.setItem("streak_count", "1");
      localStorage.setItem("last_login_date", today);
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
  const [connectionError, setConnectionError] = useState<
    string | null
  >(null);

  const [currentUser, setCurrentUser] = useState<User | null>(
    null,
  );
  const [view, setView] = useState<
    | "home"
    | "dashboard"
    | "task-detail"
    | "exercise"
    | "correction"
    | "pdf-viewer"
    | "writing"
    | "pdf-annotator"
  >("home");

  const [selectedStudentId, setSelectedStudentId] = useState<
    string | null
  >(null);
  const [activeExercise, setActiveExercise] =
    useState<Exercise | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(
    null,
  );
  const [selectedClassId, setSelectedClassId] = useState<
    string | null
  >(null);

  const [activeWritingTask, setActiveWritingTask] =
    useState<Task | null>(null);
  const [activeWritingSubmission, setActiveWritingSubmission] =
    useState<Submission | null>(null);

  const [showTaskBuilder, setShowTaskBuilder] = useState(false);
  const [taskBuilderMode, setTaskBuilderMode] = useState<
    "create" | "edit"
  >("create");
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(
    null,
  );
  const [startBuilderWithAI, setStartBuilderWithAI] =
    useState(false);

  const [showProfileEditor, setShowProfileEditor] =
    useState(false);

  const [classroom, setClassroom] = useState(mockClassroom);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [realSubmissions, setRealSubmissions] = useState<
    Submission[]
  >([]);

  const [usernameInput, setUsernameInput] = useState("");

  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [
    showPasswordChangeRequired,
    setShowPasswordChangeRequired,
  ] = useState(false);

  // ✅ [INYECCIÓN 1] Estado para el email del profesor
  const [teacherEmail, setTeacherEmail] = useState<string>("");

  // ✅ [LEAD MAGNET] Estado para el test público
  const [showPublicTest, setShowPublicTest] = useState(false);

  const loadSubmissions = async () => {
    try {
      console.log("🔄 Recargando submissions...");
      const updatedSubs = await getMoodleSubmissions();

      if (currentUser?.role === "teacher") {
        setRealSubmissions(updatedSubs);
      } else if (currentUser) {
        // Filtrar mis entregas
        const mySubs = updatedSubs.filter(
          (s: any) =>
            String(s.student_id) === String(currentUser.id) ||
            s.student_name === currentUser.name,
        );
        setRealSubmissions(mySubs);

        // 🔥 NUEVA LÓGICA DE XP (Promedio de intentos)
        // 1. Agrupar por Tarea
        const tasksAttempts: Record<string, number[]> = {};
        mySubs.forEach((sub: any) => {
           // Usamos task_id para agrupar. Si el profe borró la tarea, ignoramos.
           if (!tasksAttempts[sub.task_id]) tasksAttempts[sub.task_id] = [];
           // Guardamos la nota (0-10)
           tasksAttempts[sub.task_id].push(sub.grade || 0);
        });

        // 2. Calcular XP basado en promedios
        let totalXP = 0;
        Object.values(tasksAttempts).forEach((grades) => {
           // Calcular promedio de intentos
           const average = grades.reduce((a, b) => a + b, 0) / grades.length;
           
           // Regla de Negocio:
           // 0 a 5.99 -> 2 XP
           // 6 a 10   -> 5 XP
           if (average < 6) {
              totalXP += 2;
           } else {
              totalXP += 5;
           }
        });

        // 3. Recalcular Nivel LuinGo basado en XP
        const level = calculateLevelFromXP(totalXP);
        
        setCurrentUser({
          ...currentUser,
          xp_points: totalXP, // ✅ XP REAL CALCULADO
          level: level,
        });
      }
    } catch (error) {
      console.error("❌ Error al recargar submissions:", error);
      throw error;
    }
  };

  const initMoodle = async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      console.log("✅ LuinGo listo para autenticación");
    } catch (e) {
      console.error("Error inicializando app:", e);
      setConnectionError(
        "Error crítico al inicializar la aplicación.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ [SEO] CONFIGURACIÓN DEL TÍTULO DE LA PESTAÑA
  useEffect(() => {
    document.title = "LuinGo | Campus Virtual";
  }, []);

  // ✅ FIX QUIRÚRGICO: Restaurar sesión para evitar logout repentino
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem(
        "moodle_user_token",
      );
      if (savedToken) {
        setLoading(true);
        try {
          // 1. Validar token
          const meData = await getMe(savedToken);
          if (meData && meData.userid) {
            setUserToken(savedToken);
            // 2. Recuperar preferencias (incluyendo la bandera del test)
            const userPrefs = await getUserPreferences(
              meData.userid,
            );

            // 3. ✅ [DETECCIÓN INTELIGENTE DE ROL EN RESTAURACIÓN] 🚀
            let finalRole: "teacher" | "student" = "student";
            
            if (meData.userissiteadmin) {
              finalRole = "teacher";
            } else {
              // Escanear cursos para detectar rol de profesor
              try {
                const myCourses = await getUserCourses(meData.userid);
                if (myCourses && myCourses.length > 0) {
                  const coursesToCheck = myCourses.slice(0, 3);
                  
                  for (const course of coursesToCheck) {
                    try {
                      const profile = await getMyCourseProfile(meData.userid, course.id);
                      if (profile?.roles?.some((r: any) => 
                        ["editingteacher", "teacher", "manager"].includes(r.shortname)
                      )) {
                        finalRole = "teacher";
                        break;
                      }
                    } catch (e) {
                      console.warn(`⚠️ No se pudo verificar rol en curso ${course.id} (restauración)`);
                    }
                  }
                }
              } catch (e) {
                console.warn("⚠️ No se pudieron cargar cursos para verificar rol (restauración)");
              }
            }

            // 4. Reconstruir usuario
            const restoredUser: any = {
              id: String(meData.userid),
              username: meData.username, // ✅ FIX: Guardar Username Real en la sesión
              name: meData.fullname,
              email: meData.email,
              role: finalRole, // ✅ Rol inteligentemente detectado
              avatar_url:
                userPrefs?.avatar_url || meData.userpictureurl,
              current_level_code: userPrefs?.level_code || "A1",
              pending_level_test:
                userPrefs?.pending_level_test || false, // 🚩 Bandera crítica
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setCurrentUser(restoredUser);

            // 5. Cargar datos según el rol detectado
            if (finalRole === "student") {
              // Lógica de estudiante
              const courses = await getUserCourses(
                meData.userid,
              );
              setCourses(courses || []);
              if (courses && courses.length > 0) {
                // Buscar al profesor en el primer curso
                getEnrolledUsers(courses[0].id)
                  .then((users) => {
                    const teacher = users.find((u: any) =>
                      u.roles?.some(
                        (r: any) =>
                          r.shortname === "editingteacher" ||
                          r.shortname === "teacher",
                      ),
                    );
                    if (teacher?.email) {
                      console.log(
                        "✅ Email del profesor encontrado (restauración):",
                        teacher.email,
                      );
                      setTeacherEmail(teacher.email);
                    }
                  })
                  .catch(() => {});
              }
              const [t, s] = await Promise.all([
                getMoodleTasks(),
                getMoodleSubmissions(),
              ]);
              setTasks(t);
              const mySubs = s.filter(
                (sub: any) =>
                  String(sub.student_id) ===
                  String(meData.userid),
              );
              setRealSubmissions(mySubs);
            } else {
              // Lógica profesor (obtener cursos según permisos)
              const courses = meData.userissiteadmin 
                ? await getCourses() 
                : await getUserCourses(meData.userid);
              setCourses(courses || []);
              const [t, s] = await Promise.all([
                getMoodleTasks(),
                getMoodleSubmissions(),
              ]);
              setTasks(t);
              setRealSubmissions(s);
            }
            toast.success("Sesión restaurada ✨");
          } else {
            clearUserToken();
          }
        } catch (e) {
          console.error("Error restaurando sesión:", e);
          clearUserToken();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ✅ DEEP LINKING: Detectar parámetro URL para abrir Test Público automáticamente
  // Efecto para detectar invitación por URL
  useEffect(() => {
    // Solo ejecutar si la carga inicial ha terminado
    if (!loading) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "open_test") {
        console.log("🔗 Enlace de invitación detectado. Abriendo test...");
        // Pequeño delay para asegurar que la UI de Login ya está montada
        setTimeout(() => {
          setShowPublicTest(true);
          // Opcional: Limpiar la URL para que no se reabra al refrescar
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 500);
      }
    }
  }, [loading]); // <--- IMPORTANTE: Dependencia 'loading' añadida

  // ========== LOGIN HÍBRIDO (Velocidad + Precisión de Rol) ==========
  const handleRealLogin = async () => {
    if (!usernameInput || !passwordInput) {
      toast.error("Faltan datos", { description: "Por favor ingresa usuario y contraseña" });
      return;
    }
    setLoading(true);

    try {
      // 1. AUTENTICACIÓN (Rápida)
      const token = await loginToMoodle(usernameInput, passwordInput);
      if (!token) throw new Error("Wrong password");

      setUserToken(token);

      // 2. OBTENER PERFIL BÁSICO
      let meData;
      try {
        meData = await getMe(token);
      } catch (e) {
        if (e instanceof Error && e.message === "FORCE_PASSWORD_CHANGE") throw e;
        throw new Error("No se pudo cargar el perfil");
      }

      if (!meData || !meData.userid) throw new Error("No se pudo cargar el perfil");

      // ✅ CORRECCIÓN DE USUARIO: Usamos el username real de Moodle (ej. 'juan.perez')
      // en lugar de lo que escribiste en el input (ej. 'Juan.Perez' o email).
      const realUsername = meData.username || usernameInput;

      // 3. DETECCIÓN DE ROL INTELIGENTE 🧠
      // Aquí es donde invertimos un poco de tiempo para asegurar la identidad correcta.
      let finalRole: "teacher" | "student" = meData.userissiteadmin ? "teacher" : "student";
      let moodleCourses: any[] = [];

      try {
        // Traemos los cursos
        moodleCourses = await getUserCourses(meData.userid);
        
        // Si NO es Super Admin, investigamos si es Profe en algún curso REAL.
        if (finalRole !== "teacher" && moodleCourses && moodleCourses.length > 0) {
           
           // A. LA REGLA DE ORO: Filtramos cursos "basura" o administrativos
           const academicCourses = moodleCourses.filter((c: any) => 
              c.id !== 1 && 
              c.shortname !== "LuinGo" && 
              c.format !== "site" && 
              // Bloqueamos variantes de nombre para asegurar
              !c.fullname.toUpperCase().includes("CAMPUS VIRTUAL") &&
              !c.fullname.toUpperCase().includes("CAMPOS VIRTUAL") &&
              c.shortname !== "campus_global"
           );

           // B. ESCANEO PARALELO (Rápido)
           // Solo revisamos los primeros 10 cursos académicos para no perder tiempo.
           if (academicCourses.length > 0) {
               console.log("🕵️‍♂️ Verificando roles en cursos académicos...");
               const coursesToCheck = academicCourses.slice(0, 10);
               
               // Promise.all hace que las 10 peticiones ocurran A LA VEZ (tarda lo que tarda 1 sola)
               const profiles = await Promise.all(
                  coursesToCheck.map(c => getMyCourseProfile(meData.userid, c.id).catch(e => null))
               );

               // C. DECISIÓN FINAL
               // Si tiene CUALQUIER rol de autoridad en un curso académico -> ES PROFESOR
               const isRealTeacher = profiles.some(p => 
                  p?.roles?.some((r: any) => 
                    ['editingteacher', 'teacher', 'manager', 'coursecreator'].includes(r.shortname)
                  )
               );

               if (isRealTeacher) {
                  finalRole = "teacher";
               }
           }
        }
      } catch (e) {
        console.warn("Error verificando roles, manteniendo rol por defecto", e);
      }

      // 4. EMAIL Y PREFERENCIAS
      let realEmail = meData.email;
      if (!realEmail || realEmail.includes("nomail")) {
           try {
              const fullProfile = await getUserByUsername(realUsername);
              if (fullProfile?.email) realEmail = fullProfile.email;
           } catch (e) { console.warn("Usando email básico"); }
      }

      const userPrefs = await getUserPreferences(meData.userid).catch(() => null);

      // 5. CREAR USUARIO (CON ROL CONFIRMADO)
      const userProfile: any = {
        id: String(meData.userid),
        username: realUsername, // ✅ FIX: Guardar Username Real al loguearse
        email: realEmail || `${realUsername}@sin-email.com`,
        name: meData.fullname,
        role: finalRole, // 👈 ROL CORRECTO
        avatar_url: userPrefs?.avatar_url || meData.userpictureurl,
        current_level_code: userPrefs?.level_code || "A1",
        pending_level_test: userPrefs?.pending_level_test || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCurrentUser(userProfile);

      // 6. PREPARAR CURSOS PARA MOSTRAR
      if (Array.isArray(moodleCourses)) {
          // Filtramos también la vista visual para que no salga el Campus Virtual
          const displayCourses = moodleCourses.filter(
            (c: any) =>
              c.id !== 1 &&
              c.shortname !== "LuinGo" &&
              c.format !== "site" &&
              !c.fullname.toUpperCase().includes("CAMPUS VIRTUAL") &&
              !c.fullname.toUpperCase().includes("CAMPOS VIRTUAL") &&
              c.shortname !== "campus_global"
          );
          setCourses(displayCourses);

          // Si resulta ser estudiante, buscamos el email de su profesor en background
          if (displayCourses.length > 0 && finalRole === 'student') {
            getEnrolledUsers(displayCourses[0].id)
              .then((users) => {
                if (Array.isArray(users)) {
                  const teacher = users.find((u: any) =>
                    u.roles?.some((r: any) => r.shortname === "editingteacher" || r.shortname === "teacher")
                  );
                  if (teacher?.email) setTeacherEmail(teacher.email);
                }
              }).catch(() => {});
          }
      }

      // ⚡ 7. LA CLAVE DE LA VELOCIDAD: CARGA EN SEGUNDO PLANO ⚡
      // Ya te dejamos entrar (setCurrentUser arriba), ahora cargamos "el peso" sin bloquearte.
      Promise.all([
          getMoodleTasks(),
          getMoodleSubmissions()
      ]).then(([tasksData, subsData]) => {
          console.log("📦 Contenido cargado en segundo plano");
          setTasks(tasksData || []);
          if (finalRole === "teacher") {
            setRealSubmissions(subsData || []);
          } else {
            const mySubs = (subsData || []).filter((s: any) => String(s.student_id) === String(userProfile.id));
            setRealSubmissions(mySubs);
            setStudents(prev => prev.length > 0 ? [{...prev[0], completed_tasks: mySubs.length, total_tasks: tasksData?.length || 0}] : []);
          }
      }).catch(e => console.warn("Background load info:", e));

      // 🎉 ¡ADENTRO!
      toast.success(`¡Hola ${meData.firstname}!`, { 
          description: `Sesión iniciada como ${finalRole === 'teacher' ? 'Profesor' : 'Estudiante'}` 
      });

    } catch (e) {
      console.error("🚨 LOGIN ERROR:", e);
      const errorMsg = e instanceof Error ? e.message : String(e);

      if (errorMsg === "FORCE_PASSWORD_CHANGE" || errorMsg.includes("forcepasswordchange")) {
        toast.warning("⚠️ Cambio de Contraseña Requerido", { description: "Por seguridad, debes cambiar tu clave en Moodle.", duration: 10000 });
        setShowPasswordChangeRequired(true);
        setLoading(false);
        return;
      }

      toast.error("Error de Acceso", { description: "Credenciales incorrectas o fallo de red.", duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (courseId: string) => {
    toast.loading("Entrando al aula...");
    try {
      const enrolled = await getEnrolledUsers(Number(courseId));
      if (Array.isArray(enrolled)) {
        const realStudents = enrolled.filter((u: any) => {
          if (String(u.id) === String(currentUser?.id))
            return false;
          const roles = u.roles || [];
          return roles.some(
            (r: any) => r.shortname === "student",
          );
        });
        const studentsWithPrefs = await Promise.all(
          realStudents.map(async (u: any) => {
            const prefs = await getUserPreferences(u.id);
            const userSubs = realSubmissions.filter(
              (s) =>
                s.student_name === u.fullname ||
                String(s.student_id) === String(u.id),
            );
            const xp = userSubs.length * 15;
            const calculatedLevel = calculateLevelFromXP(xp);
            const languageLevel = prefs?.level_code || "A1";
            return {
              id: String(u.id),
              name: u.fullname,
              email: u.email,
              avatar_url:
                prefs?.avatar_url || u.profileimageurl,
              level: calculatedLevel,
              xp_points: xp,
              completed_tasks: userSubs.length,
              total_tasks: tasks.length,
              average_grade: 0,
              materials_viewed: [],
              current_level_code: languageLevel,
              role: "student",
              joined_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Student;
          }),
        );
        setStudents(studentsWithPrefs);
      }
    } catch (error) {
      console.warn("Error estudiantes:", error);
    } finally {
      setSelectedClassId(courseId);
      setView("dashboard");
      toast.dismiss();
    }
  };

  const handleCreateClass = async (name: string) => {
    const shortname =
      name.substring(0, 10).toLowerCase().replace(/\s/g, "") +
      Math.floor(Math.random() * 100);
    toast.loading("Creando clase...");
    try {
      await createCourse(name, shortname);
      toast.success("Clase creada");
      setCourses(await getCourses());
    } catch (error) {
      toast.error("Error al crear clase");
    } finally {
      toast.dismiss();
    }
  };

  const handleSaveNewTask = async (taskData: any) => {
    try {
      // 1. OBTENER EL CÓDIGO DEL CURSO ACTUAL (Namespace)
      const currentCourse = courses.find(c => String(c.id) === selectedClassId);
      const coursePrefix = currentCourse ? currentCourse.shortname : 'GLOBAL';
      
      // 2. DETERMINAR EL SUFIJO (¿Es para Nivel o para Persona?)
      let suffix = 'ALL';
      const scope = taskData.content_data?.assignment_scope;

      if (scope?.type === 'individual') {
         // Si es individual, el sufijo es el ID del estudiante (Ej: "154")
         suffix = scope.targetId; 
      } else if (scope?.type === 'level') {
         // Si es por nivel, el sufijo es el nivel (Ej: "A1")
         suffix = scope.targetId || taskData.level_tag || 'ALL';
      }

      // 3. CREAR LA ETIQUETA FINAL (Ej: "CE1-154" o "CE1-A1")
      const namespacedTag = `${coursePrefix}-${suffix}`;

      // 4. INYECTAR LA ETIQUETA EN LOS DATOS
      taskData.level_tag = namespacedTag;
      if (taskData.content_data) {
        taskData.content_data.level = namespacedTag;
        // OJO: En el scope interno NO cambiamos el ID, solo la etiqueta externa
        // Mantenemos scope.targetId original para lógica interna si es necesario
      }

      // 5. GUARDAR (Igual que antes)
      if (taskToEdit)
        await updateMoodleTask(
          taskToEdit.postId || taskToEdit.id,
          taskData.title,
          taskData.description,
          taskData.content_data,
        );
      else
        await createMoodleTask(
          taskData.title,
          taskData.description,
          taskData.content_data,
        );
        
      toast.success(taskToEdit ? "Tarea actualizada" : "Tarea creada");
      setShowTaskBuilder(false);
      setTaskToEdit(null);
      setTaskBuilderMode("create");
      setStartBuilderWithAI(false);
      setTasks(await getMoodleTasks()); 
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar tarea");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("¿Eliminar tarea?")) return;
    try {
      await deleteMoodleTask(taskId);
      setTasks(await getMoodleTasks());
      toast.success("Eliminada");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setTaskBuilderMode("edit");
    setShowTaskBuilder(true);
  };
  const handleGoHome = () => {
    setView("home");
    setSelectedClassId(null);
    setSelectedStudentId(null);
  };
  const handleLogout = async () => {
    clearUserToken();
    setCurrentUser(null);
    setView("home");
    setRealSubmissions([]);
    setStudents([]);
    setSelectedClassId(null);
  };
  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Toaster position="top-center" />{" "}
        {/* <--- AÑADIDO AQUÍ */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">
            Cargando LuinGo...
          </p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center p-4">
        <Toaster position="top-center" />{" "}
        {/* <--- AÑADIDO AQUÍ */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border-b-4 border-rose-300 max-w-md text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            Error de Conexión
          </h2>
          <p className="text-slate-600 mb-6">
            {connectionError}
          </p>
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
        {/* ✅ FIX: Usar el Toaster local con estilos */}
        <Toaster position="top-center" />

        <div className="bg-white p-8 rounded-3xl shadow-xl border-b-4 border-indigo-300 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img
                src={luingoLogo}
                alt="LuinGo Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">
              LuinGo
            </h1>
            <p className="text-slate-500">
              Plataforma de Aprendizaje Gamificado
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Usuario"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleRealLogin()
              }
              className="h-12 text-lg"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={passwordInput}
                onChange={(e) =>
                  setPasswordInput(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && handleRealLogin()
                }
                className="h-12 text-lg pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <Button
              onClick={handleRealLogin}
              disabled={!usernameInput || !passwordInput}
              className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Entrar al Campus"
              )}
            </Button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-indigo-500 hover:text-indigo-700 hover:underline font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <KeyRound className="w-3 h-3" /> ¿Olvidaste tu
                contraseña?
              </button>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Conectado a Moodle • Sistema de Gamificación
              Activo 🎮
            </p>
            {/* ✅ [LEAD MAGNET] Botón para Test Público */}
            <div className="mt-2 flex justify-center">
              <button
                onClick={() => setShowPublicTest(true)}
                className="text-xs font-bold text-indigo-500 hover:text-indigo-700 hover:underline transition-all uppercase tracking-widest"
              >
                ¿No tienes cuenta? Haz un Test de Nivel
              </button>
            </div>
          </div>
          <ForgotPasswordModal
            isOpen={showForgotModal}
            onClose={() => setShowForgotModal(false)}
            initialValue={usernameInput}
          />

          {/* ✅ [LEAD MAGNET] Renderizado del Modal Nuevo */}
          <PublicLevelTestModal
            isOpen={showPublicTest}
            onClose={() => setShowPublicTest(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Toaster position="top-center" />

      {view === "dashboard" && (
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
                <h1 className="text-lg font-black text-slate-800">
                  LuinGo
                </h1>
                <p className="text-xs text-slate-500">
                  {currentUser.role === "teacher"
                    ? "Panel del Profesor"
                    : "Panel del Estudiante"}
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
                  <p className="text-sm font-bold text-slate-700 leading-none">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    {currentUser.role === "teacher"
                      ? "Profesor"
                      : "Estudiante"}
                  </p>
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
        {showTaskBuilder && (
          <TaskBuilder
            onSaveTask={handleSaveNewTask}
            onCancel={() => {
              setShowTaskBuilder(false);
              setTaskToEdit(null);
              setTaskBuilderMode("create");
              setStartBuilderWithAI(false);
            }}
            initialData={taskToEdit || undefined}
            autoOpenAI={startBuilderWithAI}
            students={students}
          />
        )}
        {view === "home" && (
          <ClassSelection
            courses={courses}
            onSelectClass={handleSelectClass}
            onCreateClass={handleCreateClass}
            onLogout={handleLogout}
            role={currentUser.role} // 👈 Pasamos el rol correcto
            userName={currentUser.name.split(" ")[0]} // 👈 Pasamos el primer nombre para un saludo amigable
          />
        )}

        {view === "dashboard" &&
          currentUser.role === "teacher" && (
            <>
              <TeacherDashboard
                classroom={classroom}
                // 👇 NUEVA PROP: Pasamos el código del curso
                courseCode={courses.find(c => String(c.id) === selectedClassId)?.shortname || 'GLOBAL'}
                students={students}
                tasks={tasks.filter(t => {
                    const currentCourse = courses.find(c => String(c.id) === selectedClassId);
                    const prefix = currentCourse ? currentCourse.shortname : 'GLOBAL';
                    // Filtramos todo lo que no empiece por "CE1-"
                    return !t.level_tag || t.level_tag.startsWith(prefix + '-');
                })}
                currentUser={currentUser}
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
                    const updatedSubs =
                      await getMoodleSubmissions();
                    setRealSubmissions(updatedSubs);
                    toast.success("📥 Entregas actualizadas");
                  } catch (error) {
                    toast.error("Error al actualizar entregas");
                  }
                }}
                onLogout={handleLogout}
              />
              <Sheet
                open={!!selectedStudentId}
                onOpenChange={(o) =>
                  !o && setSelectedStudentId(null)
                }
              >
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-2xl p-0 overflow-hidden border-l-4 border-slate-200"
                >
                  <SheetTitle className="sr-only">
                    Passport del Estudiante
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Detalles y progreso del estudiante
                  </SheetDescription>
                  {selectedStudentId && (
                    <StudentPassport
                      student={
                        students.find(
                          (s) => s.id === selectedStudentId,
                        )!
                      }
                      tasks={tasks}
                      submissions={realSubmissions.filter(
                        (s) =>
                          String(s.student_id) ===
                            String(selectedStudentId) ||
                          s.student_name ===
                            students.find(
                              (st) =>
                                st.id === selectedStudentId,
                            )?.name,
                      )}
                      onBack={() => setSelectedStudentId(null)}
                      onAssignTask={() => {
                        setSelectedStudentId(null);
                        setShowTaskBuilder(true);
                      }}
                      isTeacher={true}
                      onRefresh={loadSubmissions}
                    />
                  )}
                </SheetContent>
              </Sheet>
            </>
          )}

        {view === "dashboard" &&
          currentUser.role === "student" && (
            <StudentDashboard
              student={
                students[0] ||
                ({
                  ...currentUser,
                  level: 1,
                  xp_points: 0,
                } as any)
              }
              // 👇 NUEVA PROP
              courseCode={courses.find(c => String(c.id) === selectedClassId)?.shortname || 'GLOBAL'}
              tasks={tasks.filter(t => {
                  const currentCourse = courses.find(c => String(c.id) === selectedClassId);
                  const prefix = currentCourse ? currentCourse.shortname : 'GLOBAL';
                  return !t.level_tag || t.level_tag.startsWith(prefix + '-');
              })}
              submissions={realSubmissions}
              teacherEmail={teacherEmail} // 👈 [INYECCIÓN 3] Pasamos el email del profesor aquí
              onLogout={handleLogout}
              onSelectTask={(task) => {
                if (task.content_data?.type === "writing") {
                  setActiveWritingTask(task);
                  const existing = realSubmissions.find(
                    (s) =>
                      s.task_id === task.id &&
                      (String(s.student_id) ===
                        String(currentUser.id) ||
                        s.student_name === currentUser.name),
                  );
                  setActiveWritingSubmission(existing || null);
                  setView("writing");
                } else if (
                  task.content_data?.type === "document"
                ) {
                  setSelectedTask(task);
                  setView("pdf-annotator");
                } else {
                  const exercise: Exercise = {
                    title: task.title,
                    level: task.level_tag || "A1",
                    banana_reward_total: 100,
                    questions:
                      task.content_data.questions || [],
                  };
                  setActiveExercise(exercise);
                  setView("exercise");
                }
              }}
            />
          )}

        {view === "writing" &&
          activeWritingTask &&
          currentUser && (
            <WritingEditor
              task={activeWritingTask}
              initialText={
                activeWritingSubmission?.textContent ||
                activeWritingSubmission?.text_content ||
                ""
              }
              onBack={() => {
                setActiveWritingTask(null);
                setActiveWritingSubmission(null);
                setView("dashboard");
              }}
              onSaveDraft={async (text) => {
                await submitTaskResult(
                  activeWritingTask.id,
                  activeWritingTask.title,
                  currentUser.id,
                  currentUser.name,
                  0,
                  10,
                  [],
                  text,
                  "draft",
                  [],
                  [],
                );
                await loadSubmissions();
              }}
              onSubmit={async (text) => {
                await submitTaskResult(
                  activeWritingTask.id,
                  activeWritingTask.title,
                  currentUser.id,
                  currentUser.name,
                  0,
                  10,
                  [],
                  text,
                  "submitted",
                  [],
                  [],
                );
                await loadSubmissions();
                setActiveWritingTask(null);
                setActiveWritingSubmission(null);
                setView("dashboard");
              }}
            />
          )}
        {view === "exercise" && activeExercise && (
          <ExercisePlayer
            exercise={activeExercise}
            studentName={currentUser?.name}
            onExit={() => {
              setActiveExercise(null);
              setView("dashboard");
            }}
            onComplete={async (score, answers) => {
              toast.success("¡Tarea finalizada!");
              if (currentUser) {
                const taskRef = tasks.find(
                  (t) => t.title === activeExercise.title,
                );
                await submitTaskResult(
                  taskRef?.id || "unknown",
                  activeExercise.title,
                  currentUser.id,
                  currentUser.name,
                  score,
                  activeExercise.questions.length,
                  answers,
                );
                const newSubs = await getMoodleSubmissions();
                const mySubs = newSubs.filter(
                  (s: any) =>
                    String(s.student_id) ===
                      String(currentUser.id) ||
                    s.student_name === currentUser.name,
                );
                setRealSubmissions(mySubs);
                const xp = mySubs.length * 15;
                const level = calculateLevelFromXP(xp);
                setCurrentUser({
                  ...currentUser,
                  xp_points: xp,
                  level: level,
                });
              }
              setActiveExercise(null);
              setView("dashboard");
            }}
          />
        )}
        {view === "pdf-annotator" &&
          selectedTask &&
          selectedTask.content_data?.type === "document" &&
          (() => {
            const userSubmissions = realSubmissions.filter(
              (s) =>
                s.task_id === selectedTask.id &&
                (String(s.student_id) ===
                  String(currentUser?.id) ||
                  s.student_name === currentUser?.name),
            );
            const lastAttempt =
              userSubmissions.find(
                (s) => s.status === "draft",
              ) ||
              userSubmissions.find(
                (s) =>
                  s.status === "submitted" ||
                  s.status === "graded",
              );
            const recoveredAnnotations =
              lastAttempt?.pdf_annotations ||
              lastAttempt?.answers ||
              [];
            return (
              <div className="h-screen flex flex-col">
                <div className="bg-white border-b border-slate-200 p-4">
                  <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedTask(null);
                          setView("dashboard");
                        }}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                      </Button>
                      <div>
                        <h1 className="font-black text-xl text-slate-800">
                          {selectedTask.title}
                        </h1>
                        <p className="text-sm text-slate-500">
                          {
                            selectedTask.content_data
                              .instructions
                          }
                        </p>
                        {lastAttempt && (
                          <p className="text-xs text-indigo-600 font-bold mt-1">
                            ✨ Borrador recuperado
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <PDFAnnotator
                    mode="student"
                    pdfUrl={
                      selectedTask.content_data.pdf_url || ""
                    }
                    initialAnnotations={recoveredAnnotations}
                    onSaveDraft={async (annotations) => {
                      if (currentUser && selectedTask) {
                        if (annotations.length === 0) {
                          toast.warning(
                            "⚠️ Añade anotaciones primero.",
                          );
                          return;
                        }
                        await submitTaskResult(
                          selectedTask.id,
                          selectedTask.title,
                          currentUser.id,
                          currentUser.name,
                          0,
                          10,
                          annotations as any,
                          "",
                          "draft",
                          [],
                          annotations as any,
                        );
                        await loadSubmissions();
                        toast.success("✅ Avance guardado.");
                      }
                    }}
                    onSave={async (annotations) => {
                      if (currentUser && selectedTask) {
                        if (annotations.length === 0) {
                          toast.error(
                            "❌ Añade anotaciones primero.",
                          );
                          return;
                        }
                        if (
                          !window.confirm(
                            "¿Entregar tarea final?",
                          )
                        )
                          return;
                        await submitTaskResult(
                          selectedTask.id,
                          selectedTask.title,
                          currentUser.id,
                          currentUser.name,
                          0,
                          10,
                          annotations as any,
                          "",
                          "submitted",
                          [],
                          annotations as any,
                        );
                        await loadSubmissions();
                        setSelectedTask(null);
                        setView("dashboard");
                        toast.success("🚀 Tarea entregada");
                      }
                    }}
                  />
                </div>
              </div>
            );
          })()}

        {showProfileEditor && currentUser && (
          <ProfileEditor
            user={currentUser}
            isOpen={showProfileEditor}
            onClose={() => setShowProfileEditor(false)}
            onUpdate={(updatedData) => {
              setCurrentUser({
                ...currentUser,
                ...updatedData,
              });
              if (currentUser.role === "student")
                setStudents((prev) =>
                  prev.map((s) =>
                    s.id === currentUser.id
                      ? { ...s, ...updatedData }
                      : s,
                  ),
                );
            }}
          />
        )}

        <Dialog
          open={showPasswordChangeRequired}
          onOpenChange={setShowPasswordChangeRequired}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <KeyRound className="w-5 h-5" />
                Cambio de Contraseña Requerido
              </DialogTitle>
              <DialogDescription className="text-slate-600 space-y-3 pt-2">
                <p>
                  🔐 Por políticas de seguridad, debes cambiar
                  tu contraseña.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <p className="font-bold text-amber-800 mb-2">
                    📋 Instrucciones:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-amber-700">
                    <li>Ve a luingo.moodiy.com</li>
                    <li>Inicia sesión y cambia tu clave</li>
                    <li>Vuelve aquí con la nueva clave</li>
                  </ol>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowPasswordChangeRequired(false);
                  window.open(
                    "https://luingo.moodiy.com",
                    "_blank",
                  );
                }}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Abrir Moodle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ✅ [LEAD MAGNET] Modal de Prueba de Nivel Público */}
        <PublicLevelTestModal
          isOpen={currentUser?.pending_level_test || false}
          onClose={() => {
            if (currentUser) {
              const updatedUser = {
                ...currentUser,
                pending_level_test: false,
              };
              setCurrentUser(updatedUser);
              if (currentUser.role === "student")
                setStudents((prev) =>
                  prev.map((s) =>
                    s.id === currentUser.id
                      ? { ...s, ...updatedUser }
                      : s,
                  ),
                );
            }
          }}
          onTestCompleted={(newLevel) => {
            if (currentUser) {
              const updatedUser = {
                ...currentUser,
                current_level_code: newLevel,
              };
              setCurrentUser(updatedUser);
              if (currentUser.role === "student")
                setStudents((prev) =>
                  prev.map((s) =>
                    s.id === currentUser.id
                      ? { ...s, ...updatedUser }
                      : s,
                  ),
                );
            }
          }}
        />
      </main>
    </div>
  );
}