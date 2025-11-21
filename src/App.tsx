import React, { useState, useEffect } from 'react';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ClassSelection } from './components/ClassSelection';
import { StudentPassport } from './components/StudentPassport';
import { TaskCorrector } from './components/TaskCorrector';
import { CommentWall } from './components/CommentWall';
import { MediaViewer } from './components/MediaViewer';
import { NotificationBell } from './components/NotificationBell';
import { AuthPage } from './components/AuthPage';
import { StudentDashboard } from './components/StudentDashboard';
import { TaskBuilder } from './components/TaskBuilder';
import { PDFAnnotator } from './components/PDFAnnotator';
import { ExercisePlayer } from './components/ExercisePlayer';
import { supabase, db } from './lib/db';
import {
  mockClassroom,
  mockStudents,
  mockTasks,
  mockMaterials,
  mockComments,
} from './lib/mockData';
import { Comment, Correction, Notification, User, Task, Student, Exercise, TaskContent, Submission } from './types'; 
import { Button } from './components/ui/button';
import { ArrowLeft, MessageCircle, Play, LogOut, Sparkles, Target, Home } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from './components/ui/sheet';
import { Toaster } from 'sonner@2.0.3';
import { toast } from 'sonner@2.0.3';

/**
 * 🐵 LUINGO - PLATAFORMA LMS EDTECH
 */
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // VIEW ROUTER STATE
  // Eliminado 'student-passport' como vista completa
  const [view, setView] = useState<'home' | 'dashboard' | 'task-detail' | 'exercise' | 'correction' | 'pdf-viewer'>('home'); 
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [activePDFTask, setActivePDFTask] = useState<Task | null>(null); // NEW
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showTaskBuilder, setShowTaskBuilder] = useState(false); // NEW
  const [mockSubmissions, setMockSubmissions] = useState<Submission[]>([]); // NEW state for demo


  const [classroom, setClassroom] = useState(mockClassroom);
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Initialize Session
  useEffect(() => {
    const initSession = async () => {
      try {
        // Timeout promise to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        // Race between session fetch and timeout
        const result: any = await Promise.race([sessionPromise, timeoutPromise]);
        
        const { data: { session }, error } = result;
        
        if (error) throw error;
        
        setSession(session);
        if (session) await initializeUser(session.user);
        else setLoading(false);
      } catch (error) {
        console.error("Session initialization error:", error);
        setLoading(false); // Ensure loading stops even on error
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) initializeUser(session.user);
      else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize User & Data
  const initializeUser = async (authUser: any) => {
    setLoading(true);
    try {
      const userProfile: User = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata.name || 'Usuario',
        role: authUser.user_metadata.role || 'student',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.email}`,
        created_at: authUser.created_at,
        updated_at: authUser.created_at,
      };
      setCurrentUser(userProfile);

      // Load or Seed Data
      
      // 1. Comments
      const savedComments = await db.get('comments:material-1');
      if (savedComments) {
        setComments(savedComments);
      } else {
        await db.set('comments:material-1', mockComments);
        setComments(mockComments);
      }

      // 2. Notifications
      const savedNotifications = await db.get(`notifications:${authUser.id}`);
      if (savedNotifications) {
        setNotifications(savedNotifications);
      } else {
        // Start empty or with welcome notification
        const welcomeNotif: Notification = {
            id: `notif-${Date.now()}`,
            user_id: authUser.id,
            type: 'level_up',
            title: '¡Bienvenido a LuinGo! 🐵',
            message: 'Tu aventura de aprendizaje comienza ahora.',
            is_read: false,
            created_at: new Date().toISOString(),
        };
        await db.set(`notifications:${authUser.id}`, [welcomeNotif]);
        setNotifications([welcomeNotif]);
      }

      // 3. Tasks
      const savedTasks = await db.get('tasks:classroom-1');
      
      // MIGRATION / SANITIZATION LOGIC
      const sanitizedTasks = savedTasks ? savedTasks.map((t: any) => ({
          ...t,
          // Ensure content_data exists (migration for old data)
          content_data: t.content_data || {
              type: 'form',
              questions: []
          },
          // Ensure category is valid
          category: t.category || 'homework'
      })) : null;

      if (sanitizedTasks) setTasks(sanitizedTasks);
      else {
          await db.set('tasks:classroom-1', mockTasks); // Seed
          setTasks(mockTasks);
      }

      // 4. Students
      const savedStudents = await db.get('students:classroom-1');
      let currentStudents: Student[] = savedStudents || [];
      
      if (!savedStudents && currentStudents.length === 0) {
        // Initial seed only if DB is empty
        currentStudents = mockStudents;
        await db.set('students:classroom-1', mockStudents);
      }

      // Auto-join logic for new students
      if (userProfile.role === 'student') {
          const existingStudent = currentStudents.find(s => s.email === userProfile.email);
          if (!existingStudent) {
            const newStudent: Student = {
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                avatar_url: userProfile.avatar_url,
                joined_at: new Date().toISOString(),
                total_tasks: 0,
                completed_tasks: 0,
                average_grade: 0,
                xp_points: 0,
                level: 1,
                materials_viewed: []
            };
            currentStudents = [...currentStudents, newStudent];
            await db.set('students:classroom-1', currentStudents);
            toast.success('¡Te has unido a la clase!');
          }
      }
      
      setStudents(currentStudents);

    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  // Realtime Subscriptions
  useEffect(() => {
    if (!session) return;

    // Subscribe to Comments
    const unsubComments = db.subscribe('comments:material-1', (newComments) => {
      if (newComments) setComments(newComments);
    });

    // Subscribe to Notifications
    const unsubNotifs = db.subscribe(`notifications:${session.user.id}`, (newNotifs) => {
        if (newNotifs) {
            setNotifications(newNotifs);
        }
    });
    
    // Subscribe to Students (so teacher sees new students immediately)
    const unsubStudents = db.subscribe('students:classroom-1', (newStudents) => {
        if (newStudents) setStudents(newStudents);
    });
    
    // Subscribe to Tasks
    const unsubTasks = db.subscribe('tasks:classroom-1', (newTasks) => {
        if (newTasks) setTasks(newTasks);
    });

    return () => {
        unsubComments();
        unsubNotifs();
        unsubStudents();
        unsubTasks();
    };
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
  };

  // Manejar selección de estudiante (MODIFIED: Abre Drawer en lugar de cambiar vista)
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    console.log('Opening passport drawer for:', studentId);
  };

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    setView('dashboard');
    toast.success(`Entrando a la clase...`);
  };

  const handleGoHome = () => {
    setView('home');
    setSelectedClassId(null);
    setSelectedStudentId(null);
  };


  // --- GESTOR DE TAREAS (NUEVO - SCENARIO A & B) ---
  const handleSaveNewTask = (taskData: any, assignmentScope: { type: 'individual' | 'level' | 'class', targetId?: string }) => {
      // 1. Crear la Tarea en la Biblioteca (Template)
      const newTemplate: Task = {
          id: `template-${Date.now()}`,
          teacher_id: currentUser?.id || 'teacher-1',
          title: taskData.title,
          description: taskData.description,
          content_data: taskData.content_data, // Guardamos el JSON polimórfico
          level_tag: assignmentScope.type === 'level' ? (assignmentScope.targetId as any) : 'A1', // Default if not specified
          category: taskData.category,
          created_at: new Date().toISOString(),
          rubric: { criteria: [], total_points: 100 }
      };

      // Guardar en estado local (simulando DB Tasks_Library)
      setTasks(prev => [newTemplate, ...prev]);
      setShowTaskBuilder(false);

      // 2. Generar Asignaciones (Assignments Table)
      let targetedStudents: Student[] = [];

      if (assignmentScope.type === 'individual' && assignmentScope.targetId) {
          // Escenario A: Individual
          const student = students.find(s => s.id === assignmentScope.targetId);
          if (student) targetedStudents = [student];
      } else if (assignmentScope.type === 'level' && assignmentScope.targetId) {
          // Escenario B: Por Nivel (Smart Filtering)
          targetedStudents = students.filter(s => s.current_level_code === assignmentScope.targetId);
      } else if (assignmentScope.type === 'class') {
          // Escenario C: Toda la clase
          targetedStudents = students;
      }

      // Crear filas en tabla Assignments
      const newAssignments: Submission[] = targetedStudents.map(student => ({
          id: `assign-${Date.now()}-${student.id}`,
          task_id: newTemplate.id,
          student_id: student.id,
          status: 'assigned',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 días default
      }));

      // Guardar asignaciones (simulando DB)
      // Nota: En una app real, haríamos un POST a /assignments
      setMockSubmissions(prev => [...newAssignments, ...prev]);

      toast.success(`Tarea creada y asignada a ${targetedStudents.length} alumnos.`);

      // Lógica de enrutamiento para Demo inmediata (si soy el profe probando)
      if (taskData.content_data.type === 'pdf') {
          setActivePDFTask(newTemplate);
          setView('pdf-viewer');
      } else {
          // Demo Quiz
           const exercise: Exercise = {
            title: newTemplate.title,
            level: newTemplate.level_tag || 'A1',
            banana_reward_total: 50,
            questions: taskData.content_data.questions || []
          };
          setActiveExercise(exercise);
          // No cambiamos la vista automáticamente para que el profe vea el dashboard, 
          // a menos que quiera probarlo explícitamente.
          // setView('exercise'); 
      }
  };

  // --- SIMULACIÓN IA DE LENGUAJE (MEGA PROMPT) - DEPRECATED IN FAVOR OF BUILDER BUT KEPT FOR LEGACY CALLS ---
  const handleGenerateTask = async (topic: string, level: string) => {
      setShowTaskBuilder(true); // Abrimos el modal nuevo en lugar de generar directo
  };

  // Manejar agregar comentario
  const handleAddComment = async (content: string, parentId?: string) => {
    if (!currentUser) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      material_id: 'material-1',
      user_id: currentUser.id,
      user: currentUser,
      content,
      is_corrected: false,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    // Persist
    await db.set('comments:material-1', updatedComments);
  };

  // Manejar corrección de comentario (solo profesores)
  const handleCorrectComment = async (commentId: string, corrections: Correction[]) => {
    if (!currentUser) return;

    const updatedComments = comments.map((comment) => {
        if (comment.id === commentId) {
          let correctedContent = comment.content;
          // No modificamos el contenido original en el string para mantener la referencia visual,
          // pero guardamos las correcciones en el objeto.
          // En un sistema real, quizás querramos guardar un HTML procesado o mantener los metadatos.
          
          return {
            ...comment,
            content: correctedContent, 
            original_content: comment.content,
            corrected_by: currentUser.id,
            corrections,
            is_corrected: true,
            updated_at: new Date().toISOString(),
          };
        }
        return comment;
      });
    
    setComments(updatedComments);
    // Persist
    await db.set('comments:material-1', updatedComments);
    toast.success('Comentario corregido');
  };

  // Manejar selección de material
  const handleSelectMaterial = (materialId: string) => {
    console.log('Selected material:', materialId);
  };

  // 🔔 Manejar notificaciones
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!currentUser) return;
    const updatedNotifications = notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
    );
    setNotifications(updatedNotifications);
    await db.set(`notifications:${currentUser.id}`, updatedNotifications);
  };

  const handleClearAllNotifications = async () => {
    if (!currentUser) return;
    setNotifications([]);
    await db.set(`notifications:${currentUser.id}`, []);
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-background">Cargando LuinGo...</div>;
  }

  if (!session || !currentUser) {
      return (
        <>
          <AuthPage onSuccess={() => {}} />
          <Toaster position="top-center" richColors />
        </>
      );
  }

  const selectedTask = tasks.find((t) => t.id === 'task-1'); // Mock selection logic

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-800 selection:bg-amber-200 selection:text-amber-900">
      {/* Barra de navegación SUPER PLAYFUL */}
      <nav className="bg-white border-b-2 border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Logo LuinGo - Mono saltarín */}
              <div 
                onClick={handleGoHome}
                className="relative group cursor-pointer shrink-0 hover:-rotate-6 hover:scale-110 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-400 border-b-4 border-amber-600 flex items-center justify-center">
                  <span className="text-2xl drop-shadow-sm filter">🐵</span>
                </div>
              </div>
              <div>
                <h1 className="text-slate-800 font-black text-2xl tracking-tight flex items-center gap-2 cursor-pointer" onClick={handleGoHome}>
                    LuinGo <span className="text-amber-500 hidden sm:inline-block">.</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              {view !== 'home' && (
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleGoHome}
                    className="hidden md:flex text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-100 rounded-xl"
                 >
                    <Home className="w-4 h-4 mr-2" />
                    Mis Clases
                 </Button>
              )}

              {/* 🔔 Campana de notificaciones */}
              <div className="relative group">
                 <NotificationBell
                    notifications={notifications}
                    onMarkAsRead={handleMarkNotificationAsRead}
                    onClearAll={handleClearAllNotifications}
                  />
              </div>
              
              <div className="h-8 w-0.5 bg-slate-100 hidden md:block rounded-full"></div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-700">{currentUser.name}</p>
                    <div className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block">
                        {currentUser.role}
                    </div>
                </div>
                <div className="p-1 rounded-full bg-indigo-100 border-2 border-white ring-2 ring-indigo-50">
                    <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-full object-cover"
                    />
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                title="Cerrar Sesión" 
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                  <LogOut className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main>
        {/* MODAL BUILDER */}
        {showTaskBuilder && (
            <TaskBuilder 
                onSaveTask={handleSaveNewTask}
                onCancel={() => setShowTaskBuilder(false)}
                initialStudentId={selectedStudentId || undefined} // Use currently selected student from drawer if open
            />
        )}

        {/* 1. VISTA HOME (Selección de Clase) */}
        {view === 'home' && (
            <ClassSelection onSelectClass={handleSelectClass} />
        )}

        {/* 2. VISTA DASHBOARD (Grid Estudiantes o Dashboard Alumno) */}
        {view === 'dashboard' && currentUser?.role === 'teacher' && (
          <TeacherDashboard
            classroom={classroom}
            students={students}
            tasks={tasks}
            onSelectStudent={handleSelectStudent}
            onGenerateTask={handleGenerateTask}
          />
        )}

        {view === 'dashboard' && currentUser?.role === 'student' && (
            <StudentDashboard 
                student={students.find(s => s.id === currentUser.id) as Student || mockStudents[0]}
                tasks={tasks.filter(t => mockSubmissions.some(sub => sub.student_id === currentUser.id && sub.task_id === t.id))}
                submissions={mockSubmissions.filter(sub => sub.student_id === currentUser.id)}
                onLogout={handleLogout}
                onSelectTask={(task) => {
                    if (task.content_data.type === 'pdf') {
                        setActivePDFTask(task);
                        setView('pdf-viewer');
                    } else {
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

        {/* 
            SHEET / DRAWER PARA PASAPORTE ESTUDIANTE 
            (Reemplaza la vista completa 'student-passport')
        */}
        <Sheet open={!!selectedStudentId} onOpenChange={(open) => !open && setSelectedStudentId(null)}>
            <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto p-0">
                <SheetHeader className="hidden">
                    <SheetTitle>Perfil del Estudiante</SheetTitle>
                    <SheetDescription>Ver detalles y asignar tareas</SheetDescription>
                </SheetHeader>
                {/* Nota: Pasamos onBack como cierre del drawer */}
                {selectedStudentId && (
                    <StudentPassport 
                        student={students.find(s => s.id === selectedStudentId) || students[0]}
                        onBack={() => setSelectedStudentId(null)}
                        onAssignTask={() => {
                            // Mantenemos el drawer abierto Y abrimos el TaskBuilder encima
                            setShowTaskBuilder(true);
                        }}
                    />
                )}
            </SheetContent>
        </Sheet>
        
        {/* VISTA PDF VIEWER (NUEVA) */}
        {view === 'pdf-viewer' && activePDFTask && (
            <div className="p-4 h-screen bg-slate-100 flex flex-col">
                 <div className="mb-4 flex justify-between items-center">
                    <Button variant="ghost" onClick={() => setView('dashboard')}>
                        <ArrowLeft className="w-5 h-5 mr-2"/> Salir
                    </Button>
                    <h2 className="font-black text-xl">{activePDFTask.title}</h2>
                    <div className="w-20"></div>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    <PDFAnnotator 
                        bgUrl={activePDFTask.content_data.resource_url || 'https://placehold.co/600x800/png'}
                        mode="student"
                        onSave={(strokes) => {
                            console.log('Saved strokes:', strokes);
                            toast.success('Anotaciones guardadas');
                            setView('dashboard');
                        }}
                    />
                 </div>
            </div>
        )}

        {/* 4. VISTA ALUMNO (Haciendo la tarea) */}
        {view === 'exercise' && activeExercise && (
            <ExercisePlayer 
                exercise={activeExercise}
                onExit={() => setView('dashboard')}
                onComplete={(score) => {
                    // Al terminar, vamos a la vista de corrección (simulando que el profe entra después)
                    // En producción, esto iría a la DB y el profe recibiría notificación.
                    // Para la DEMO, saltamos directo a Scene 4.
                    toast.success(`¡Tarea enviada al Profesor!`);
                    setView('correction');
                }}
            />
        )}

        {/* 5. VISTA PROFESOR (Corrigiendo) */}
        {view === 'correction' && activeExercise && (
            <TaskCorrector 
                exercise={activeExercise}
                studentName={students.find(s => s.id === selectedStudentId)?.name || "Ana García"}
                onBack={() => setView('dashboard')}
                onSaveCorrection={() => {
                    // Final del ciclo
                    setView('dashboard');
                }}
            />
        )}

        {/* 6. VISTA DETALLE (Legacy - Materiales) */}
        {view === 'task-detail' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-24">
            {/* Breadcrumb / Navegación */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => setView('dashboard')}
                className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold -ml-2"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Dashboard
              </Button>
            </div>

            {/* Detalles de la tarea */}
            {selectedTask && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border-b-4 border-slate-200 mb-8">
                <div className="flex flex-col md:flex-row md:items-start gap-6 mb-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div
                        className="w-4 h-4 rounded-full ring-2 ring-offset-2 ring-slate-100"
                        style={{ backgroundColor: selectedTask.color_tag }}
                      />
                      <span className="text-xs font-black px-3 py-1 bg-slate-100 rounded-lg text-slate-600 uppercase tracking-wider">
                        {selectedTask.category}
                      </span>
                      {selectedTask.ai_generated && (
                        <span className="text-xs font-black px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg text-purple-700 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          IA GENERATED
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 leading-tight">{selectedTask.title}</h2>
                    <p className="text-slate-600 text-lg leading-relaxed font-medium">{selectedTask.description}</p>
                  </div>
                  {selectedTask.due_date && (
                    <div className="shrink-0 bg-amber-50 p-4 rounded-2xl border-2 border-amber-100 text-center min-w-[140px]">
                      <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">Entrega</p>
                      <p className="text-xl font-black text-amber-900">
                        {new Date(selectedTask.due_date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-sm font-bold text-amber-700/70">
                         {new Date(selectedTask.due_date).getFullYear()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Rúbrica de evaluación */}
                {selectedTask.rubric && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border-2 border-indigo-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <Target className="w-5 h-5" />
                        </div>
                        <h4 className="text-xl font-black text-indigo-900">Rúbrica de Evaluación</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedTask.rubric.criteria.map((criterion: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                              <p className="font-bold text-indigo-800">{criterion.name}</p>
                              <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-1 rounded-lg">{criterion.points} pts</span>
                          </div>
                          <p className="text-sm text-slate-500">{criterion.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contenido incrustado (Preview) */}
                <div className="mt-8 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                     <p className="text-slate-400 font-bold mb-4">Contenido de la Tarea</p>
                     {selectedTask.content_data?.type === 'form' ? (
                         <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600">
                             <MessageCircle className="w-4 h-4" />
                             <span>Cuestionario ({selectedTask.content_data.questions?.length || 0} preguntas)</span>
                         </div>
                     ) : (
                         <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600">
                             <Play className="w-4 h-4" />
                             <span>Recurso Externo / PDF</span>
                         </div>
                     )}
                </div>
              </div>
            )}
            
            {/* Sección de Comentarios */}
            <CommentWall 
                comments={comments} 
                currentUser={currentUser}
                onAddComment={handleAddComment}
                onCorrectComment={handleCorrectComment}
            />
          </div>
        )}
      </main>
    </div>
  );
}
