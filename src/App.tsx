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
import { getSiteInfo, createMoodleTask, getMoodleTasks, getCourses, getEnrolledUsers } from './lib/moodle';
import {
  mockClassroom,
  mockStudents,
  mockTasks,
  mockComments,
} from './lib/mockData';
import { Comment, Correction, Notification, User, Task, Student, Exercise, Submission } from './types'; 
import { Button } from './components/ui/button';
import { ArrowLeft, MessageCircle, Play, LogOut, Sparkles, Target, Home, Settings, RefreshCw } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './components/ui/dialog';
import { Toaster, toast } from 'sonner@2.0.3';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'dashboard' | 'task-detail' | 'exercise' | 'correction' | 'pdf-viewer'>('home'); 
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null); // Kept for legacy
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [activePDFTask, setActivePDFTask] = useState<Task | null>(null); 
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showTaskBuilder, setShowTaskBuilder] = useState(false); 
  const [targetStudentForTask, setTargetStudentForTask] = useState<string | undefined>(undefined); 
  const [mockSubmissions, setMockSubmissions] = useState<Submission[]>([]); 

  const [classroom, setClassroom] = useState(mockClassroom);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const initMoodle = async () => {
    setLoading(true);
    setConnectionError(null);
    console.log("🔌 Conectando con Moodle...");
    
    try {
      const info = await getSiteInfo();
      if (info && !info.error) {
        console.log("✅ Conectado a:", info.sitename);
        toast.success(`Conectado a Moodle: ${info.sitename}`);
        
        // 1. Cargar Cursos de Moodle
        const moodleCourses = await getCourses();
        if (Array.isArray(moodleCourses)) {
          setCourses(moodleCourses);
          console.log("✅ Cursos cargados:", moodleCourses);
        }

        // 2. Cargar tareas del foro
        const forumTasks = await getMoodleTasks();
        if (forumTasks.length > 0) {
           setTasks(forumTasks);
           console.log("✅ Tareas cargadas del Foro:", forumTasks);
           
           // Auto-assign forum tasks to students locally so they appear in dashboard
           // This is a temporary bridge since we are not managing assignments in Moodle yet
           const newAssignments: Submission[] = [];
           mockStudents.forEach(student => {
             forumTasks.forEach((task: Task) => {
                newAssignments.push({
                  id: `assign-${task.id}-${student.id}`,
                  task_id: task.id,
                  student_id: student.id,
                  status: 'assigned',
                  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                });
             });
           });
           setMockSubmissions(prev => [...prev, ...newAssignments]);
        }
      } else {
        const errorMsg = info?.error || "No se pudo conectar a Moodle.";
        console.error("Connection failed:", errorMsg);
        toast.error(errorMsg);
        setConnectionError(errorMsg);
      }
    } catch (e) {
      console.error(e);
      setConnectionError("Error crítico de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initMoodle();
  }, []);

  const initializeUser = async (roleData: { role: 'teacher' | 'student' }) => {
    setLoading(true);
    try {
      const userProfile: User = {
        id: 'user-moodle-1',
        email: 'demo@moodle.school',
        name: roleData.role === 'teacher' ? 'Profesor Moodle' : 'Estudiante Moodle',
        role: roleData.role,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${roleData.role}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCurrentUser(userProfile);
      setComments(mockComments);
      // Tasks are loaded from Moodle in initMoodle
      // Students are loaded when selecting a class now
      setNotifications([]);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setView('home');
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  const handleSelectClass = async (courseId: string) => {
    toast.loading("Cargando estudiantes...");
    
    try {
      const enrolledUsers = await getEnrolledUsers(Number(courseId));
      
      if (Array.isArray(enrolledUsers)) {
         const mappedStudents: Student[] = enrolledUsers.map((u: any) => ({
            id: String(u.id),
            name: u.fullname,
            email: u.email,
            avatar_url: u.profileimageurl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.fullname}`,
            current_level_code: 'A1', // Default fallback
            progress: Math.floor(Math.random() * 100), // Mock progress
            streak_days: 0,
            xp: 0,
            stats: {
                listening: 0,
                reading: 0,
                speaking: 0,
                writing: 0
            },
            achievements: []
         }));

         setStudents(mappedStudents);
         console.log("✅ Estudiantes cargados:", mappedStudents);
         
         setSelectedClassId(courseId);
         setView('dashboard');
         toast.dismiss();
         toast.success(`Entrando a la clase...`);
      } else {
        toast.dismiss();
        toast.error("No se pudieron cargar los estudiantes.");
      }
    } catch (error) {
        console.error("Error loading students:", error);
        toast.dismiss();
        toast.error("Error al cargar la clase.");
    }
  };

  const handleGoHome = () => {
    setView('home');
    setSelectedClassId(null);
    setSelectedStudentId(null);
  };

  const handleSaveNewTask = async (taskData: any, assignmentScope: { type: 'individual' | 'level' | 'class', targetId?: string }) => {
      // Guardar tarea en Moodle (Foro)
      await createMoodleTask(taskData.title, taskData.description, taskData.content_data);
      toast.success("Tarea guardada en Moodle exitosamente");

      setShowTaskBuilder(false);
      setTargetStudentForTask(undefined);

      // Recargar la lista desde Moodle
      const updatedTasks = await getMoodleTasks();
      setTasks(updatedTasks);

      // Actualizar asignaciones locales (Mock) para que aparezcan en la UI
      if (updatedTasks.length > 0) {
          const newestTask = updatedTasks[0]; // Asumimos que la más nueva es la primera
          
          let targetedStudents: Student[] = [];
          if (assignmentScope.type === 'individual' && assignmentScope.targetId) {
              const student = students.find(s => s.id === assignmentScope.targetId);
              if (student) targetedStudents = [student];
          } else if (assignmentScope.type === 'level' && assignmentScope.targetId) {
              targetedStudents = students.filter(s => s.current_level_code === assignmentScope.targetId);
          } else if (assignmentScope.type === 'class') {
              targetedStudents = students;
          }

          const newAssignments: Submission[] = targetedStudents.map(student => ({
              id: `assign-${Date.now()}-${student.id}`,
              task_id: newestTask.id,
              student_id: student.id,
              status: 'assigned',
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 
          }));

          setMockSubmissions(prev => [...newAssignments, ...prev]);
      }
  };

  const handleGenerateTask = async (topic: string, level: string) => {
      setShowTaskBuilder(true); 
  };

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
    setComments([...comments, newComment]);
  };

  const handleCorrectComment = async (commentId: string, corrections: Correction[]) => {
    if (!currentUser) return;
    const updatedComments = comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            corrected_by: currentUser.id,
            corrections,
            is_corrected: true,
            updated_at: new Date().toISOString(),
          };
        }
        return comment;
      });
    setComments(updatedComments);
    toast.success('Comentario corregido');
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!currentUser) return;
    setNotifications(notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
    ));
  };

  const handleClearAllNotifications = async () => {
    setNotifications([]);
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-background">Cargando LuinGo (Moodle)...</div>;
  }

  if (!currentUser) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
             <div className="w-full max-w-md text-center space-y-6">
                 <div className="mx-auto w-20 h-20 rounded-full bg-amber-400 flex items-center justify-center text-4xl shadow-lg">🐵</div>
                 <h1 className="text-3xl font-bold text-slate-800">LuinGo <span className="text-amber-500">.</span></h1>
                 <p className="text-slate-500">Conectando con tu Moodle Headless</p>
                 
                 {connectionError && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center justify-center gap-2">
                        <span>Error: {connectionError}</span>
                    </div>
                 )}

                 <div className="grid gap-4">
                    <Button className="h-12 text-lg" onClick={() => initializeUser({ role: 'teacher' })}>Soy Profesor</Button>
                    <Button variant="outline" className="h-12 text-lg" onClick={() => initializeUser({ role: 'student' })}>Soy Estudiante</Button>
                 </div>

                 <Toaster richColors />
             </div>
        </div>
      );
  }

  // Reuse the selectedTask logic for legacy detail view
  const selectedTask = tasks.find((t) => t.id === 'task-1');

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-800 selection:bg-amber-200 selection:text-amber-900">
      <Toaster richColors />
      <nav className="bg-white border-b-2 border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
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

      <main>
        {showTaskBuilder && (
            <TaskBuilder 
                onSaveTask={handleSaveNewTask}
                onCancel={() => setShowTaskBuilder(false)}
                initialStudentId={targetStudentForTask} 
                studentName={students.find(s => s.id === targetStudentForTask)?.name}
            />
        )}

        {view === 'home' && (
            <ClassSelection 
                courses={courses} 
                onSelectClass={handleSelectClass} 
            />
        )}

        {view === 'dashboard' && currentUser?.role === 'teacher' && (
           <>
            <TeacherDashboard
                classroom={classroom}
                students={students}
                tasks={tasks}
                onSelectStudent={handleSelectStudent}
                onGenerateTask={handleGenerateTask}
            />

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
                        onBack={() => setSelectedStudentId(null)}
                        onAssignTask={() => {
                            const currentStudentId = selectedStudentId;
                            setTargetStudentForTask(currentStudentId);
                            setSelectedStudentId(null);
                            setTimeout(() => {
                                setShowTaskBuilder(true);
                            }, 150);
                        }}
                    />
                )}
                </SheetContent>
            </Sheet>
           </>
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

        {view === 'exercise' && activeExercise && (
            <ExercisePlayer 
                exercise={activeExercise}
                onExit={() => setView('dashboard')}
                onComplete={(score) => {
                    toast.success(`¡Tarea enviada al Profesor!`);
                    setView('correction');
                }}
            />
        )}

        {view === 'correction' && activeExercise && (
            <TaskCorrector 
                exercise={activeExercise}
                studentName={students.find(s => s.id === selectedStudentId)?.name || "Ana García"}
                onBack={() => setView('dashboard')}
                onSaveCorrection={() => {
                    setView('dashboard');
                }}
            />
        )}

        {view === 'task-detail' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-24">
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
