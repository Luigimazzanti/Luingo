import React, { useState, useMemo } from 'react'; // 👈 Añadir useMemo
import { Student, Task, Submission } from '../types';
import { TaskCard } from './TaskCard';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'; // 👈 NUEVO IMPORT
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  Users, 
  Zap, 
  Flame,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CommunityFeed } from './community/CommunityFeed';
import { TextAnnotator } from './TextAnnotator';
import { PDFAnnotator } from './PDFAnnotator';
import { LevelTestCard } from './LevelTestCard'; // ✅ NUEVO
import { LevelTestPlayer } from './LevelTestPlayer'; // ✅ NUEVO
import { ImageWithFallback } from './figma/ImageWithFallback'; // 👈 NUEVO IMPORT PARA IMÁGENES

interface StudentDashboardProps {
  courseCode: string; // 👈 NUEVO
  student: Student;
  tasks: Task[];
  submissions: Submission[];
  teacherEmail?: string; // 👈 [NUEVO] Añadir teacherEmail
  onSelectTask: (task: Task) => void;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  courseCode, // 👈 Recibir prop
  student, tasks = [], submissions = [], teacherEmail, onSelectTask, onLogout // 👈 [NUEVO] Añadir teacherEmail
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'portfolio' | 'community' | 'achievements'>('tasks');
  // ✅ CAMBIO: Ahora guardamos un ARRAY de intentos para ver el historial completo
  const [selectedAttempts, setSelectedAttempts] = useState<Submission[] | null>(null);
  
  // ✅ NUEVO: Estado para el Level Test Player
  const [activeLevelTest, setActiveLevelTest] = useState<Task | null>(null);

  // ✅ CÁLCULO DE XP INTELIGENTE (POR CURSO Y CON REGLAS)
  const courseXP = useMemo(() => {
    if (!tasks || !submissions) return 0;

    // 1. Obtener IDs de las tareas de ESTE curso (ya vienen filtradas desde App.tsx)
    const courseTaskIds = new Set(tasks.map(t => t.id));

    // 2. Agrupar intentos por tarea
    const attemptsByTask: Record<string, number[]> = {};
    
    submissions.forEach(sub => {
      // Solo contamos intentos de tareas de este curso
      if (courseTaskIds.has(sub.task_id)) {
         if (!attemptsByTask[sub.task_id]) attemptsByTask[sub.task_id] = [];
         // Guardamos la nota (si no tiene nota aún, es 0)
         attemptsByTask[sub.task_id].push(sub.grade || 0);
      }
    });

    // 3. Aplicar Reglas de Negocio
    let points = 0;
    Object.values(attemptsByTask).forEach(grades => {
       // A. Promediar intentos
       const average = grades.reduce((a, b) => a + b, 0) / grades.length;
       
       // B. Asignar XP según nota promedio
       // Regla: 0 a 5.99 -> 2 XP | 6 a 10 -> 5 XP
       points += (average < 6) ? 2 : 5;
    });

    return points;
  }, [tasks, submissions]);

  // --- PROTECCIÓN CONTRA CRASH ---
  if (!student) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400">Cargando perfil...</div>;
  }

  // --- LÓGICA DE NEGOCIO (INTACTA) ---
  const getAttemptsCount = (taskId: string) => {
    if (!submissions) return 0;
    return submissions.filter(s => 
      s.task_id === taskId && 
      String(s.student_id) === String(student.id)
    ).length;
  };

  const getTaskStatus = (taskId: string) => {
    const sub = submissions
      .filter(s => s.task_id === taskId && String(s.student_id) === String(student.id))
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
    
    return sub ? (sub.status || 'submitted') : 'assigned';
  };

  // ✅ FILTRO VISIBILIDAD (LÓGICA SCOPE ROBUSTA + NAMESPACING)
  const visibleTasks = tasks.filter(t => {
    // Si la tarea ya viene filtrada por curso desde App.tsx, aquí afinamos por usuario.
    const scope = t.content_data?.assignment_scope;
    
    // Recuperar la parte final de la etiqueta (Quitamos "CE1-")
    let suffix = 'ALL';
    const tag = t.level_tag || t.content_data?.level || '';
    if (tag.includes('-')) {
        suffix = tag.split('-')[1]; // "A1" o "12345"
    }

    const myId = String(student.id);
    const myLevel = student.current_level_code || 'A1';

    // CASO 1: Asignación Individual (Comprobamos si el sufijo es MI ID)
    if (scope?.type === 'individual') {
       return suffix === myId || String(scope.targetId) === myId;
    }

    // CASO 2: Asignación por Nivel (Comprobamos si el sufijo es MI NIVEL)
    if (scope?.type === 'level') {
       return suffix === 'ALL' || suffix === myLevel;
    }

    // Fallback para tareas antiguas sin scope
    return suffix === 'ALL' || suffix === myLevel;
  });

  const pendingTasks = visibleTasks.filter(t => {
    const status = getTaskStatus(t.id);
    
    // 1. DOCUMENTOS PDF (Se queda igual: Borrador=Visible, Enviado=Oculto)
    if (t.content_data?.type === 'document') {
      if (status === 'draft' || status === 'assigned' || !status) return true;
      return false; 
    }

    // 2. CUESTIONARIOS (FIX: Respetar Intentos Múltiples)
    // Si es tipo form/quiz, verificamos intentos PRIMERO.
    if (t.content_data?.type === 'form' || t.content_data?.type === 'quiz' || !t.content_data?.type) {
       const attempts = getAttemptsCount(t.id);
       const max = t.content_data?.max_attempts ?? 3;
       
       // Si ya llegó al límite, se oculta.
       if (attempts >= max) return false;

       // Si NO ha llegado al límite, se muestra SIEMPRE (aunque esté submitted)
       // Esto permite hacer el intento 2, 3, etc.
       return true;
    }
    
    // 3. OTRAS TAREAS (Writing) (Se queda igual)
    // Si ya se envió o calificó, se oculta.
    if (status === 'submitted' || status === 'graded') return false;
    
    return true;
  });

  const completedTasks = visibleTasks.filter(t => {
    const status = getTaskStatus(t.id);
    return status === 'submitted' || status === 'graded';
  });

  // ✅ NUEVA FUNCIÓN: Obtener todos los intentos para el resumen
  const openSummary = (task: Task) => {
    const attempts = submissions
      .filter(s => s.task_id === task.id && String(s.student_id) === String(student.id))
      // Ordenar cronológicamente (Intento 1, 2, 3...)
      .sort((a, b) => new Date(a.submitted_at || '').getTime() - new Date(b.submitted_at || '').getTime());
    
    if (attempts.length > 0) setSelectedAttempts(attempts);
  };

  // --- COMPONENTE NAV DOCK (DISEÑO MODERNO) ---
  const NavDock = () => (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500 w-[90%] md:w-auto max-w-md md:max-w-none">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full p-2 md:p-2 grid grid-cols-4 gap-1 bg-[rgba(50,50,50,0.9)]">
        <DockItem 
          icon={LayoutDashboard} 
          label="Misiones" 
          active={activeTab === 'tasks'} 
          onClick={() => setActiveTab('tasks')} 
        />
        <DockItem 
          icon={BookOpen} 
          label="Portafolio" 
          active={activeTab === 'portfolio'} 
          onClick={() => setActiveTab('portfolio')} 
        />
        <DockItem 
          icon={Users} 
          label="Comunidad" 
          active={activeTab === 'community'} 
          onClick={() => setActiveTab('community')} 
        />
        <DockItem 
          icon={Trophy} 
          label="Logros" 
          active={activeTab === 'achievements'} 
          onClick={() => setActiveTab('achievements')} 
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 font-sans overflow-x-hidden">
      {/* CONTENEDOR PRINCIPAL CON SCROLL */}
      <div className="h-screen overflow-y-auto pb-32 scroll-smooth">
        
        {/* HEADER ESTADÍSTICAS (TRANSPARENTE) */}
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              Hola, <span className="text-indigo-600 whitespace-nowrap">{student.name.split(' ')[0]} 👋</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">¡Sigue aprendiendo!</p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-bold text-xs border border-amber-200 shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 
              <span>5 Días</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full font-bold text-xs border border-indigo-200 shadow-sm whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" /> 
              <span>{courseXP} XP</span> {/* 👈 USAMOS LA VARIABLE CALCULADA */}
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          
          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-700 flex items-center gap-2">
                  🚀 Misiones Disponibles
                  <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingTasks.length}</span>
                </h2>
              </div>
              
              {pendingTasks.length > 0 || (student as any).pending_level_test ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* ✅ INYECCIÓN QUIRÚRGICA: Tarjeta de Test basada en la bandera */}
                  {/* Usamos (student as any) para acceder a la propiedad dinámica sin romper tipos */}
                  {(student as any).pending_level_test && (
                     <LevelTestCard 
                       key="level-test-system"
                       onClick={() => setActiveLevelTest({ 
                         id: 'level-test-system', 
                         title: 'Test de Nivel',
                         content_data: { type: 'level_test' }
                       } as any)} 
                     />
                  )}

                  {/* Tareas normales de Moodle */}
                  {pendingTasks.map(task => {
                    // ✅ DETECTAR SI ES LEVEL TEST
                    if (task.content_data?.type === 'level_test' || (task.content_data as any)?.content_data?.type === 'level_test') {
                      return (
                        <LevelTestCard 
                          key={task.id} 
                          onClick={() => setActiveLevelTest(task)} 
                        />
                      );
                    }

                    // Renderizado normal de TaskCard
                    return (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        status={getTaskStatus(task.id)} 
                        attemptsUsed={getAttemptsCount(task.id)} 
                        onClick={() => onSelectTask(task)} 
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-200 shadow-sm">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">¡Misión Cumplida!</h3>
                  <p className="text-slate-400 text-sm mt-1">Has completado todas tus tareas pendientes.</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'portfolio' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-black text-slate-700 flex items-center gap-2">
                📚 Tu Portafolio
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    status="graded" 
                    attemptsUsed={getAttemptsCount(task.id)} 
                    onClick={() => openSummary(task)} 
                  />
                ))}
                {completedTasks.length === 0 && (
                  <p className="col-span-full text-center text-slate-400 italic py-10">Tu historial de aprendizaje aparecerá aquí.</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'achievements' && (
            <div className="animate-in fade-in zoom-in duration-500 py-6">
              
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-800 mb-2">🏆 Sala de Trofeos</h2>
                <p className="text-slate-500 font-medium">
                  Tu evolución en este curso: <span className="text-indigo-600 font-bold">{courseXP} XP</span>
                </p>
              </div>

              {/* GRID DE IMÁGENES DE LA JUNGLA */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                  // ✅ ACTUALIZADO: Usamos las imágenes personalizadas del usuario desde ImgBB
                  { th: 25, label: 'Hormiga Obrera', img: 'https://i.ibb.co/gZ0zY1Gm/trophy1.png', color: 'bg-stone-100' },
                  { th: 35, label: 'Rana Curiosa', img: 'https://i.ibb.co/4wCtPzng/trophy2.png', color: 'bg-emerald-100' },
                  { th: 55, label: 'Loro Parlanchín', img: 'https://i.ibb.co/jZ8hRVDc/trophy3.png', color: 'bg-red-100' },
                  { th: 85, label: 'Tucán Colorido', img: 'https://i.ibb.co/spD4JSCb/trophy4.png', color: 'bg-orange-100' },
                  { th: 125, label: 'Mono Ágil', img: 'https://i.ibb.co/9mcM14DJ/trophy5.png', color: 'bg-amber-100' },
                  { th: 175, label: 'Jaguar Veloz', img: 'https://i.ibb.co/tMCc0PL9/trophy6.png', color: 'bg-yellow-100' },
                  { th: 235, label: 'Gorila Fuerte', img: 'https://i.ibb.co/Gf8d6CJQ/trophy7.png', color: 'bg-slate-200' },
                  { th: 300, label: 'Rey León', img: 'https://i.ibb.co/1thgYP0M/trophy8.png', color: 'bg-purple-100' },
                ].map((trophy, idx) => {
                  const isUnlocked = courseXP >= trophy.th;
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "aspect-square rounded-3xl p-4 flex flex-col items-center justify-center text-center border-4 transition-all duration-500 relative overflow-hidden group", 
                        isUnlocked 
                          ? "bg-white border-white shadow-xl hover:-translate-y-2" 
                          : "bg-slate-50 border-transparent opacity-50 grayscale"
                      )}
                    >
                      {/* Fondo sutil de color al desbloquear */}
                      {isUnlocked && <div className={cn("absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30", trophy.color)} />}
                      
                      {/* ✅ CONTENEDOR DE IMAGEN CONTROLADO */}
                      <div className={cn("mb-3 transition-transform relative z-10", isUnlocked ? "scale-105 group-hover:scale-110 drop-shadow-md" : "scale-90 opacity-50")}>
                        {isUnlocked ? (
                          // Renderiza la imagen real
                          <ImageWithFallback 
                            src={trophy.img} 
                            alt={trophy.label} 
                            className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-full mx-auto" 
                          />
                        ) : (
                          // Renderiza el candado si está bloqueado
                          <span className="text-5xl md:text-6xl">🔒</span>
                        )}
                      </div>

                      <div className="relative z-10">
                        <h3 className={cn("font-black text-sm leading-tight mb-1", isUnlocked ? "text-slate-800" : "text-slate-400")}>
                          {trophy.label}
                        </h3>
                        {isUnlocked ? (
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">CONSEGUIDO</span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400">{trophy.th} XP</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'community' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CommunityFeed student={student} courseCode={courseCode} />
            </div>
          )}
        </div>
      </div>

      {/* NAVEGACIÓN FLOTANTE */}
      <NavDock />

      {/* ✅ NUEVO: LEVEL TEST PLAYER */}
      {activeLevelTest && (
        <LevelTestPlayer
          studentName={student.name}
          studentId={student.id}
          studentEmail={student.email}
          teacherEmail={teacherEmail} // 👈 [NUEVO] Pasar el email del profesor
          taskId={activeLevelTest.id}
          initialData={submissions.find(s => s.task_id === activeLevelTest.id && String(s.student_id) === String(student.id))} // ✅ PASAR DATOS PREVIOS
          onExit={() => {
            setActiveLevelTest(null);
            // Recargar la página para actualizar el estado
            window.location.reload();
          }}
        />
      )}

      {/* ✅ VISOR DE DETALLES CON PESTAÑAS (TABS) */}
      <Dialog open={!!selectedAttempts} onOpenChange={(o) => !o && setSelectedAttempts(null)}>
        <DialogContent className="!max-w-[100vw] !w-screen !h-screen !p-0 !m-0 !rounded-none border-none flex flex-col bg-slate-50">
          <div className="flex-1 overflow-y-auto">
            <DialogHeader className="p-6 bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
                {/* Título de la tarea (común para todos los intentos) */}
                <DialogTitle className="text-xl font-black text-slate-800">
                    {selectedAttempts?.[0]?.task_title}
                </DialogTitle>
                <DialogDescription>
                    Revisa el historial completo de tus intentos y calificaciones.
                </DialogDescription>
            </DialogHeader>
          
            <div className="p-6">
              {selectedAttempts && (
                <Tabs defaultValue={`attempt-${selectedAttempts.length - 1}`}>
                  <TabsList className="w-full justify-start overflow-x-auto mb-6 p-1 bg-slate-200/50 rounded-xl">
                    {selectedAttempts.map((_, i) => (
                      <TabsTrigger 
                        key={i} 
                        value={`attempt-${i}`}
                        className="rounded-lg px-4 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                      >
                        Intento {i + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {selectedAttempts.map((att, i) => {
                    const relatedTask = tasks.find(t => t.id === att.task_id);
                    const isPdfTask = relatedTask?.content_data?.type === 'document';

                    return (
                        <TabsContent key={i} value={`attempt-${i}`} className="space-y-6">
                            
                            {/* Tarjeta de Resumen del Intento */}
                            <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 p-2 rounded-xl text-slate-500">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Fecha de Entrega</p>
                                        <p className="text-sm font-bold text-slate-700">{new Date(att.submitted_at || '').toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Calificación</p>
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-xl font-black text-lg inline-block shadow-sm border",
                                        (att.grade ?? 0) >= 5 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                    )}>
                                        {(att.grade || 0).toFixed(1)}/10
                                    </div>
                                </div>
                            </div>

                            {/* Feedback del Profesor */}
                            {att.teacher_feedback && (
                                <div className="bg-indigo-50 p-5 rounded-2xl border-2 border-indigo-100 flex gap-4 items-start">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-2xl">👨‍🏫</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-indigo-900 text-xs uppercase mb-1">Comentario del Profesor</h4>
                                        <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                            {att.teacher_feedback}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* --- CONTENIDO ESPECÍFICO --- */}
                            
                            {/* CASO 1: PDF */}
                            {isPdfTask && relatedTask?.content_data?.pdf_url && (
                                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden h-[500px]">
                                    <PDFAnnotator
                                        mode="student"
                                        pdfUrl={relatedTask.content_data.pdf_url}
                                        initialAnnotations={[...(att.answers || []), ...(att.teacher_annotations || [])]}
                                        readOnly={true}
                                    />
                                </div>
                            )}

                            {/* CASO 2: Redacción */}
                            {att.textContent && att.textContent.length > 0 && (
                                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm">
                                    <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                                        <FileText className="w-4 h-4 text-indigo-500" /> Tu Redacción
                                    </h4>
                                    <TextAnnotator 
                                        text={att.textContent} 
                                        annotations={att.corrections || []} 
                                        onAddAnnotation={()=>{}} 
                                        onRemoveAnnotation={()=>{}} 
                                        readOnly={true} 
                                    />
                                </div>
                            )}

                            {/* CASO 3: Quiz (Respuestas detalladas) */}
                            {att.answers && att.answers.length > 0 && !isPdfTask && (
                                <div className="space-y-3">
                                    <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Respuestas Detalladas
                                    </h4>
                                    {att.answers.map((ans: any, k: number) => (
                                        <div key={k} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                            <p className="font-bold text-slate-700 text-sm mb-3 flex gap-2">
                                                <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded flex items-center justify-center text-xs shrink-0">{k+1}</span>
                                                {ans.questionText || "Pregunta"}
                                            </p>
                                            <div className="space-y-3">
                                                <div className={cn(
                                                    "p-3 rounded-xl text-sm border-l-4",
                                                    ans.isCorrect ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-rose-50 border-rose-400 text-rose-900'
                                                )}>
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
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end sticky bottom-0 z-50">
              <Button onClick={() => setSelectedAttempts(null)} className="font-bold px-8 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                Cerrar Resumen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// COMPONENTE DE BOTÓN DEL DOCK
const DockItem = ({ icon: Icon, label, active, onClick }: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex flex-col items-center justify-center gap-1 px-3 py-4 md:px-4 md:py-3 rounded-full transition-all duration-300 group w-full min-h-[68px] md:min-h-0",
      active 
        ? "bg-white text-indigo-600 shadow-lg scale-110" 
        : "hover:bg-white/10 text-slate-300 hover:text-white hover:scale-105"
    )}
  >
    <Icon className={cn("w-7 h-7 md:w-5 md:h-5 transition-all", active && "stroke-[2.5px]")} />
    <span className={cn(
      "text-[9px] font-bold transition-all whitespace-nowrap hidden md:block",
      active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
    )}>
      {label}
    </span>
    {active && (
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
    )}
  </button>
);