import React, { useState, useMemo, useEffect } from 'react'; // 👈 Añadir useEffect
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
  FileText,
  Mic,
  Filter,
  ChevronDown,
  Sparkles,
  Eye
} from 'lucide-react'; // 👈 AÑADIDOS Filter, ChevronDown, Sparkles, Eye
import { cn } from '../lib/utils';
import { CommunityFeed } from './community/CommunityFeed';
import { TextAnnotator } from './TextAnnotator';
import { PDFAnnotator } from './PDFAnnotator';
import { LevelTestCard } from './LevelTestCard'; // ✅ NUEVO
import { LevelTestPlayer } from './LevelTestPlayer'; // ✅ NUEVO
import { ImageWithFallback } from './figma/ImageWithFallback'; // 👈 NUEVO IMPORT PARA IMÁGENES
import { sendTrophyEmailNotification } from '../lib/notifications'; // 👈 [NUEVO] IMPORT DEL SISTEMA DE EMAILS

// ✅ CONFIGURACIÓN DE FILTROS
const FILTER_OPTIONS = [
  { id: 'all', label: 'Todo', icon: null },
  { id: 'grammar', label: 'Gramática', icon: '🧩' },
  { id: 'vocabulary', label: 'Vocabulario', icon: '🗣️' },
  { id: 'listening', label: 'Listening', icon: '🎧' },
  { id: 'speaking', label: 'Speaking', icon: '🎙️' },
  { id: 'reading', label: 'Reading', icon: '📖' },
];

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

  // ✅ ESTADOS DE UI (Filtros y Portafolio)
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAllPortfolio, setShowAllPortfolio] = useState(false);

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
    // 1. FILTRO DE ETIQUETAS (NUEVO)
    if (activeFilter !== 'all') {
       const tags = t.content_data?.tags || [];
       if (!tags.includes(activeFilter)) return false;
    }

    const status = getTaskStatus(t.id);
    
    // 2. DOCUMENTOS PDF (Se queda igual: Borrador=Visible, Enviado=Oculto)
    if (t.content_data?.type === 'document') {
      if (status === 'draft' || status === 'assigned' || !status) return true;
      return false; 
    }

    // 3. CUESTIONARIOS Y AUDIOS (Lógica de intentos)
    if (['form', 'quiz', 'audio'].includes(t.content_data?.type || '')) {
       const attempts = getAttemptsCount(t.id);
       const max = t.content_data?.max_attempts ?? (t.content_data?.type === 'audio' ? 2 : 3);
       
       if (attempts >= max) return false;
       return true;
    }
    
    // 4. OTRAS TAREAS (Writing) (Se queda igual)
    // Si ya se envió o calificó, se oculta.
    if (status === 'submitted' || status === 'graded') return false;
    
    return true;
  });

  const completedTasks = visibleTasks.filter(t => {
    const status = getTaskStatus(t.id);
    return status === 'submitted' || status === 'graded';
  });

  // ✅ [NUEVO] TRIGGER DE NOTIFICACIÓN POR TROFEO DESBLOQUEADO 🏆
  // Este efecto monitorea el XP y detecta cuando se desbloquea un nuevo trofeo
  useEffect(() => {
    // Lista de trofeos (misma estructura que el render)
    const TROPHIES = [
      { th: 25, label: 'Hormiga Obrera', img: '/assets/trophies/trofeo_1.png' },
      { th: 35, label: 'Rana Curiosa', img: '/assets/trophies/trofeo_2.png' },
      { th: 55, label: 'Loro Parlanchín', img: '/assets/trophies/trofeo_3.png' },
      { th: 85, label: 'Tucán Colorido', img: '/assets/trophies/trofeo_4.png' },
      { th: 125, label: 'Mono Ágil', img: '/assets/trophies/trofeo_5.png' },
      { th: 175, label: 'Jaguar Veloz', img: '/assets/trophies/trofeo_6.png' },
      { th: 235, label: 'Gorila Fuerte', img: '/assets/trophies/trofeo_7.png' },
      { th: 300, label: 'Rey León', img: '/assets/trophies/trofeo_8.png' },
    ];

    // Clave única por estudiante y curso para evitar duplicados entre cursos
    const storageKey = `luingo_trophies_${student.id}_${courseCode}`;
    
    // Obtener trofeos ya desbloqueados guardados en localStorage
    const unlockedTrophies = JSON.parse(localStorage.getItem(storageKey) || '[]') as number[];

    // Detectar qué trofeos están desbloqueados ahora según el XP actual
    const currentlyUnlocked = TROPHIES.filter(t => courseXP >= t.th).map(t => t.th);

    // Comparar: ¿Hay algún trofeo nuevo que no estaba antes?
    const newTrophies = currentlyUnlocked.filter(threshold => !unlockedTrophies.includes(threshold));

    // Si hay trofeos nuevos, enviar email por cada uno y actualizar localStorage
    if (newTrophies.length > 0) {
      newTrophies.forEach(threshold => {
        const trophy = TROPHIES.find(t => t.th === threshold);
        if (trophy) {
          console.log(`🏆 ¡Nuevo trofeo desbloqueado! ${trophy.label} (${threshold} XP)`);
          
          // Enviar email de notificación (Fire and forget)
          sendTrophyEmailNotification(
            student.email,
            student.name,
            trophy.label,
            trophy.img,
            courseXP
          ).catch(err => console.warn('⚠️ Fallo al enviar email de trofeo:', err));
        }
      });

      // Actualizar localStorage para marcar estos trofeos como ya notificados
      localStorage.setItem(storageKey, JSON.stringify(currentlyUnlocked));
    }
  }, [courseXP, student.id, student.email, student.name, courseCode]); // Se ejecuta cuando cambia el XP

  // ✅ CÁLCULO DE LAS 6 HABILIDADES (VERSIÓN PRO)
  const skillsStats = useMemo(() => {
    // 1. Calcular nota promedio real (0-10)
    const validGrades = submissions
      .map(s => (s.grade && s.grade > 0) ? s.grade : 0)
      .filter(g => g > 0);

    const avg = validGrades.length > 0 
      ? validGrades.reduce((acc, curr) => acc + curr, 0) / validGrades.length 
      : 0;

    // 2. Calcular porcentaje base (0-100%)
    // Fórmula: (Nota Promedio * 10) + (Bonus por cantidad de misiones)
    const basePercent = Math.min(100, Math.round((avg * 10) + (submissions.length * 1.5)));

    // 3. Retornar las 6 Habilidades sincronizadas
    return [
      { label: 'Gramática', icon: '🧩', percent: basePercent },
      { label: 'Vocabulario', icon: '🗣️', percent: basePercent },
      { label: 'Comprensión Oral', icon: '🎧', percent: basePercent },
      { label: 'Comprensión Lectora', icon: '📖', percent: basePercent },
      { label: 'Expresión Oral', icon: '🎙️', percent: basePercent },
      { label: 'Cultura', icon: '🌍', percent: basePercent },
    ];
  }, [submissions]);

  // ✅ NUEVA FUNCIÓN: Obtener todos los intentos para el resumen
  const openSummary = (task: Task) => {
    const attempts = submissions
      .filter(s => s.task_id === task.id && String(s.student_id) === String(student.id))
      // Ordenar cronológicamente (Intento 1, 2, 3...)
      .sort((a, b) => new Date(a.submitted_at || '').getTime() - new Date(b.submitted_at || '').getTime());
    
    if (attempts.length > 0) setSelectedAttempts(attempts);
  };

  // ✅ DETECTOR DE AUDIO MEJORADO
  const renderAudioPlayer = (text: string) => {
    if (!text) return null;
    const vocarooMatch = text.match(/https?:\/\/(?:www\.)?(?:vocaroo\.com|voca\.ro)\/([\w-]+)/); // 👈 Regex corregido
    if (vocarooMatch) {
      const id = vocarooMatch[1];
      return (
        <div className="bg-rose-50 p-4 rounded-2xl border-2 border-rose-100 shadow-sm mb-4">
           <div className="flex items-center gap-2 mb-3 text-rose-800 font-bold text-xs uppercase tracking-wider">
              <Mic className="w-4 h-4" /> Audio del Alumno
           </div>
           <iframe 
             width="100%" height="60" 
             src={`https://vocaroo.com/embed/${id}?autoplay=0`}
             frameBorder="0" className="rounded-lg shadow-sm bg-white" title="Vocaroo Audio"
           />
        </div>
      );
    }
    return null;
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
              
              {/* ✅ BARRA DE FILTROS */}
              <div className="flex flex-wrap gap-2 pb-2">
                {FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setActiveFilter(opt.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5",
                      activeFilter === opt.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105"
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                    )}
                  >
                    {opt.icon && <span>{opt.icon}</span>}
                    {opt.label}
                  </button>
                ))}
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
                {/* Mostramos solo 8 si está colapsado, o todos si está expandido */}
                {(showAllPortfolio ? completedTasks : completedTasks.slice(0, 8)).map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    status="graded" 
                    attemptsUsed={getAttemptsCount(task.id)} 
                    onClick={() => openSummary(task)} 
                  />
                ))}

                {/* ✅ CARD "VER MÁS" (Solo si hay más de 8 y está colapsado) */}
                {!showAllPortfolio && completedTasks.length > 8 && (
                  <button 
                    onClick={() => setShowAllPortfolio(true)}
                    className="group relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-all min-h-[180px]"
                  >
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                       <Sparkles className="w-5 h-5 text-indigo-500" />
                    </div>
                    <span className="font-black text-indigo-700 text-sm">Ver {completedTasks.length - 8} más</span>
                    <span className="text-xs text-indigo-400 font-medium mt-1">Explorar historial completo</span>
                  </button>
                )}

                {/* Botón para colapsar (Opcional, al final de la lista si está expandido) */}
                {showAllPortfolio && completedTasks.length > 8 && (
                   <button 
                    onClick={() => setShowAllPortfolio(false)}
                    className="col-span-full py-4 text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center justify-center gap-2"
                  >
                    Ver menos <ChevronDown className="w-4 h-4 rotate-180" />
                  </button>
                )}

                {completedTasks.length === 0 && (
                  <p className="col-span-full text-center text-slate-400 italic py-10">Tu historial de aprendizaje aparecerá aquí.</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'achievements' && (
            <div className="animate-in fade-in zoom-in duration-500 py-4">
              
              <div className="flex flex-col md:flex-row gap-6 items-start">
                
                {/* COLUMNA 1: TROFEOS (Se lleva el 70% del espacio) */}
                <div className="flex-1 w-full">
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            🏆 Sala de Trofeos
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">Colecciona todos los emblemas.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                          { th: 25, label: 'Hormiga Obrera', img: '/assets/trophies/trofeo_1.png', color: 'bg-stone-100' },
                          { th: 35, label: 'Rana Curiosa', img: '/assets/trophies/trofeo_2.png', color: 'bg-emerald-100' },
                          { th: 55, label: 'Loro Parlanchín', img: '/assets/trophies/trofeo_3.png', color: 'bg-red-100' },
                          { th: 85, label: 'Tucán Colorido', img: '/assets/trophies/trofeo_4.png', color: 'bg-orange-100' },
                          { th: 125, label: 'Mono Ágil', img: '/assets/trophies/trofeo_5.png', color: 'bg-amber-100' },
                          { th: 175, label: 'Jaguar Veloz', img: '/assets/trophies/trofeo_6.png', color: 'bg-yellow-100' },
                          { th: 235, label: 'Gorila Fuerte', img: '/assets/trophies/trofeo_7.png', color: 'bg-slate-200' },
                          { th: 300, label: 'Rey León', img: '/assets/trophies/trofeo_8.png', color: 'bg-purple-100' },
                        ].map((trophy, idx) => {
                          const isUnlocked = courseXP >= trophy.th;
                          return (
                            <div 
                              key={idx} 
                              className={cn(
                                "aspect-square rounded-2xl p-3 flex flex-col items-center justify-center text-center border-2 transition-all duration-500 relative overflow-hidden group", 
                                isUnlocked 
                                  ? "bg-white border-white shadow-lg hover:-translate-y-1" 
                                  : "bg-slate-50 border-transparent opacity-60 grayscale"
                              )}
                            >
                              {/* Imagen del Trofeo */}
                              <div className={cn("mb-2 transition-transform relative z-10", isUnlocked ? "scale-105 group-hover:scale-110 drop-shadow-md" : "scale-90 opacity-50")}>
                                {isUnlocked ? (
                                  <ImageWithFallback src={trophy.img} alt={trophy.label} className="w-16 h-16 object-cover rounded-full mx-auto" />
                                ) : (
                                  <span className="text-4xl">🔒</span>
                                )}
                              </div>
                              <h3 className="font-bold text-xs leading-tight mb-1 truncate relative z-10 w-full text-slate-700">
                                {trophy.label}
                              </h3>
                              <span className="text-[9px] font-bold text-slate-400 block relative z-10">{isUnlocked ? 'CONSEGUIDO' : `${trophy.th} XP`}</span>
                            </div>
                          );
                        })}
                    </div>
                </div>

                {/* COLUMNA 2: HABILIDADES (Panel Lateral Fijo) */}
                <div className="w-full md:w-72 shrink-0 space-y-5">
                    
                    {/* Tarjeta de Resumen XP */}
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-24 h-24" /></div>
                        <div className="relative z-10">
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Nivel Actual</p>
                            <h3 className="text-3xl font-black mb-4">{courseXP} XP</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-medium text-indigo-100">
                                    <span>Misiones</span>
                                    <span className="text-white font-bold">{submissions.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium text-indigo-100">
                                    <span>Trofeos</span>
                                    <span className="text-white font-bold">
                                        {[25,35,55,85,125,175,235,300].filter(th => courseXP >= th).length} / 8
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ TARJETA DE HABILIDADES (VERSIÓN PRO 6 ICONOS) */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
                            <Zap className="w-4 h-4 text-amber-500" /> Habilidades
                        </h3>
                        
                        {/* Grid de 6 Habilidades */}
                        <div className="grid grid-cols-2 gap-3">
                            {skillsStats.map((skill, i) => (
                                <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-lg">{skill.icon}</span>
                                        <span className="text-[10px] font-black text-slate-600">{skill.percent}%</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight mb-1.5">
                                        {skill.label}
                                    </p>
                                    {/* Mini Barra de Progreso */}
                                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                                            style={{ width: `${skill.percent}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-50 text-center">
                            <p className="text-[10px] font-bold text-indigo-500 bg-indigo-50 inline-block px-3 py-1 rounded-full">
                                ¡Completa misiones (nota 5+) para subir nivel!
                            </p>
                        </div>
                    </div>

                </div>

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
                                // ✅ LÓGICA EXCLUSIVA AQUÍ TAMBIÉN
                                renderAudioPlayer(att.textContent) || (
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
                                )
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

                            {/* CASO 4: Audio */}
                            {att.textContent && renderAudioPlayer(att.textContent)}
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