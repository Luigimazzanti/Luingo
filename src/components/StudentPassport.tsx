import React, { useState, useEffect, useMemo } from 'react'; // 👈 AÑADIDO useMemo
import { Student, Submission, Task } from '../types';
import { Star, Zap, Trophy, Calendar, CheckCircle2, X, Medal, Eye, XCircle, Trash2, BookOpen, Check, Edit2, Save, Leaf, Clock, Loader2 } from 'lucide-react'; // 👈 AÑADIDO Clock y Loader2
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'; // 👈 NUEVO
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';
import { deleteMoodlePost, gradeSubmission, saveUserPreferences } from '../lib/moodle';
import { toast } from 'sonner@2.0.3';
import { TextAnnotator } from './TextAnnotator';
import { PDFAnnotator } from './PDFAnnotator';
import { sendNotification, emailTemplates } from '../lib/notifications'; // ✅ AGREGADO: Sistema de notificaciones

interface StudentPassportProps {
  student: Student;
  tasks?: Task[];
  submissions?: Submission[];
  onBack: () => void;
  onAssignTask: () => void;
  isTeacher?: boolean; // ✅ NUEVA PROP: Habilita edición de calificaciones
  onRefresh?: () => Promise<void>; // ✅ NUEVA PROP: Refresco sin reload
}

export const StudentPassport: React.FC<StudentPassportProps> = ({
  student,
  tasks = [],
  submissions = [],
  onBack,
  onAssignTask,
  isTeacher = false, // ✅ Default: false (modo estudiante)
  onRefresh // ✅ RECIBIR FUNCIÓN DE REFRESCO
}) => {
  const [showAllHistory, setShowAllHistory] = useState(false);
  // ✅ CAMBIO: Ahora seleccionamos un GRUPO de intentos (Array)
  const [selectedAttempts, setSelectedAttempts] = useState<Submission[] | null>(null);
  
  // ✅ ESTADOS PARA EDICIÓN (MODO PROFESOR)
  const [editingGrade, setEditingGrade] = useState('');
  const [editingFeedback, setEditingFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentCorrections, setCurrentCorrections] = useState<any[]>([]); // ✅ NUEVO: Estado local para correcciones
  const [isEditingPdf, setIsEditingPdf] = useState(false); // ✅ NUEVO: Estado para editar PDF
  const [pdfAnnotations, setPdfAnnotations] = useState<any[]>([]); // ✅ NUEVO: Anotaciones PDF locales
  
  // ✅ NUEVO: Estados para gestión de nivel
  const [isEditingLevel, setIsEditingLevel] = useState(false);
  const [tempLevel, setTempLevel] = useState(student.current_level_code);

  // ✅ NUEVO: Función para guardar el nivel definitivo
  const handleLevelUpdate = async (newLevel: string) => {
    try {
      // 1. Guardar en BD (Supabase/Moodle)
      await saveUserPreferences(student.id, { 
        level_code: newLevel,    // Nuevo nivel oficial
        pending_level: null      // Limpiamos la solicitud pendiente
      });

      // 2. Actualizar visualmente (Optimistic UI)
      student.current_level_code = newLevel as any;
      student.pending_level = undefined;
      
      toast.success(`Nivel actualizado a ${newLevel}`);
      setIsEditingLevel(false);
      
      // ✅ NOTIFICACIÓN POR EMAIL (LÓGICA AGREGADA)
      if (student.email) {
        sendNotification({ 
          to: student.email, 
          subject: "Nivel Actualizado", 
          html: emailTemplates.levelUp(newLevel) 
        });
      }
      
      // 3. Refrescar datos globales si existe la función
      if (onRefresh) onRefresh();
      
    } catch (e) {
      toast.error("Error al guardar el nivel");
    }
  };

  // ✅ PRECARGAR DATOS AL ABRIR MODAL
  useEffect(() => {
    if (selectedAttempts) {
      // Calcular promedio de calificaciones
      const totalGrade = selectedAttempts.reduce((acc, sub) => acc + (sub.grade || 0), 0);
      const averageGrade = totalGrade / selectedAttempts.length;
      setEditingGrade(averageGrade.toString());
      
      // Combinar feedbacks
      const combinedFeedback = selectedAttempts.map(sub => sub.teacher_feedback).filter(Boolean).join('\n');
      setEditingFeedback(combinedFeedback);
      
      // Cargar correcciones
      const allCorrections = selectedAttempts.flatMap(sub => sub.corrections || []);
      setCurrentCorrections(allCorrections);
      setIsEditingPdf(false); // ✅ RESETEAR MODO EDICIÓN PDF
      
      // ✅ CARGAR ANOTACIONES PDF (combinar estudiante + profesor)
      const studentAnnotations = selectedAttempts.flatMap(sub => sub.answers || []);
      const teacherAnnotations = selectedAttempts.flatMap(sub => sub.teacher_annotations || []);
      setPdfAnnotations([...studentAnnotations, ...teacherAnnotations]);
    }
  }, [selectedAttempts]);

  // ✅ FUNCIÓN PARA BORRAR INTENTO (UI HONESTA CON VERIFICACIÓN)
  const handleDelete = async (sub: Submission, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar abrir el modal de detalles
    
    if (!window.confirm("¿Estás seguro de que quieres borrar este intento de Moodle? Esta acción no se puede deshacer.")) {
      return;
    }
    
    const toastId = toast.loading("Contactando con Moodle...");
    
    try {
      // Limpiar IDs
      const cleanPostId = sub.id || sub.postId;
      const cleanDiscussionId = sub.discussionId || sub.discussion_id;
      
      console.log("🗑️ Intentando borrar:", { postId: cleanPostId, discussionId: cleanDiscussionId });
      
      // ✅ PASAR AMBOS IDs PARA QUE LA FUNCIÓN SEA MÁS INTELIGENTE
      const success = await deleteMoodlePost(cleanPostId, cleanDiscussionId);
      
      toast.dismiss(toastId);
      
      if (success) {
        // ✅ BORRADO EXITOSO EN MOODLE
        toast.success("✅ Intento borrado correctamente de Moodle");
        
        // Recargar datos reales desde Moodle
        if (onRefresh) {
          await onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        // ❌ MOODLE RECHAZÓ EL BORRADO
        toast.error("❌ Moodle rechazó el borrado. Verifica permisos o intenta borrar desde Moodle directamente.");
        console.error("❌ deleteMoodlePost retornó false");
      }
    } catch (error) {
      console.error("❌ Error al borrar intento:", error);
      toast.dismiss(toastId);
      toast.error("Error de conexión con Moodle");
    }
  };

  // ✅ FUNCIÓN PARA GUARDAR CALIFICACIÓN Y FEEDBACK
  const handleSaveGrade = async () => {
    if (!selectedAttempts) return;
    
    const grade = parseFloat(editingGrade);
    if (isNaN(grade) || grade < 0 || grade > 10) {
      toast.error("Por favor, ingresa una calificación válida entre 0 y 10.");
      return;
    }
    
    try {
      setIsSaving(true);
      toast.loading("Guardando calificación...");
      
      // ✅ CRÍTICO: Reconstruir payload original para no perder metadatos
      const safePayload = selectedAttempts[0].original_payload || {
        taskId: selectedAttempts[0].task_id,
        taskTitle: selectedAttempts[0].task_title,
        studentId: selectedAttempts[0].student_id,
        studentName: selectedAttempts[0].student_name,
        score: selectedAttempts[0].score,
        total: selectedAttempts[0].total,
        answers: selectedAttempts[0].answers,
        textContent: selectedAttempts[0].textContent, // ✅ Incluir texto
        timestamp: selectedAttempts[0].submitted_at
      };
      
      // Usar postId o limpiar el id
      const targetId = selectedAttempts[0].postId || selectedAttempts[0].id.replace('post-', '');
      
      // ✅ Determinar qué correcciones usar (PDF o Writing)
      const relatedTask = tasks.find(t => t.id === selectedAttempts[0].task_id);
      const isPdfTask = relatedTask?.content_data?.type === 'document';
      const correctionsToSave = isPdfTask ? pdfAnnotations : currentCorrections;
      
      // ✅ PASAR EL PAYLOAD COMPLETO + CORRECCIONES ACTUALIZADAS
      await gradeSubmission(
        targetId, 
        grade, 
        editingFeedback, 
        safePayload, 
        correctionsToSave
      );
      
      toast.dismiss();
      toast.success("Calificación actualizada correctamente");
      
      // Forzar recarga de la página para actualizar datos
      if (onRefresh) {
        await onRefresh();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error al guardar calificación:", error);
      toast.dismiss();
      toast.error("Error al guardar la calificación");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ HANDLERS PARA TEXTANNOTATOR (Gestión de correcciones)
  const handleAddCorrection = (ann: any) => {
    setCurrentCorrections([...currentCorrections, ann]);
    toast.success("Corrección añadida");
  };
  
  const handleRemoveCorrection = (id: string) => {
    setCurrentCorrections(currentCorrections.filter(c => c.id !== id));
    toast.success("Corrección eliminada");
  };
  
  const handleUpdateCorrection = (ann: any) => {
    setCurrentCorrections(currentCorrections.map(c => c.id === ann.id ? ann : c));
    toast.success("Corrección actualizada");
  };
  
  // ✅ FUNCIÓN DE GUARDADO MAESTRA (Se pasa al componente hijo)
  const handleUpdateAttempt = async (attempt: Submission, newGrade: number, newFeedback: string) => {
    try {
      // 1. Llamada a la API (Moodle)
      const safePayload = {
        ...(attempt.original_payload || {}),
        grade: newGrade,
        teacher_feedback: newFeedback,
        status: 'graded',
        graded_at: new Date().toISOString(),
        taskId: attempt.task_id,
        studentId: attempt.student_id,
        answers: attempt.answers,
        textContent: attempt.textContent
      };
      
      const targetId = attempt.postId || String(attempt.id).replace('post-', '');
      await gradeSubmission(targetId, newGrade, newFeedback, safePayload, attempt.corrections);

      toast.success("✅ Calificación actualizada");
      
      // 2. Refrescar datos globales
      if (onRefresh) await onRefresh();
      
      // 3. Actualizar estado local (para ver el cambio sin cerrar el modal)
      if (selectedAttempts) {
        setSelectedAttempts(prev => prev ? prev.map(a => 
          a.id === attempt.id 
            ? { ...a, grade: newGrade, teacher_feedback: newFeedback } 
            : a
        ) : null);
      }

    } catch (error) {
      console.error(error);
      toast.error("Error al guardar");
    }
  };

  // ✅ FUNCIÓN: BORRAR UN SOLO INTENTO
  const handleDeleteAttempt = async (attempt: Submission) => {
    if (!window.confirm("¿Estás seguro de borrar este intento? Esta acción es irreversible.")) return;
    
    try {
      toast.loading("Borrando intento...");
      const targetId = attempt.postId || String(attempt.id).replace('post-', '');
      
      const success = await deleteMoodlePost(targetId);
      
      if (success) {
        toast.dismiss();
        toast.success("🗑️ Intento eliminado");
        if (onRefresh) await onRefresh();
        
        // Actualizar estado local (quitarlo del grupo seleccionado)
        if (selectedAttempts) {
            const remaining = selectedAttempts.filter(a => a.id !== attempt.id);
            if (remaining.length === 0) setSelectedAttempts(null); // Si no quedan, cerrar modal
            else setSelectedAttempts(remaining);
        }
      } else {
        throw new Error("No se pudo borrar");
      }
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Error al borrar intento");
    }
  };

  // ✅ FUNCIÓN: BORRAR TODO EL HISTORIAL DE UNA TAREA
  const handleDeleteGroup = async (attempts: Submission[], e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar abrir el modal al hacer click en borrar
    if (!window.confirm(`¿Borrar TODO el historial (${attempts.length} intentos) de esta tarea?`)) return;

    try {
      toast.loading("Borrando historial completo...");
      
      // Borrar uno por uno (en paralelo para velocidad)
      await Promise.all(attempts.map(att => {
        const targetId = att.postId || String(att.id).replace('post-', '');
        return deleteMoodlePost(targetId);
      }));

      toast.dismiss();
      toast.success("🗑️ Historial eliminado");
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Error al borrar historial");
    }
  };
  
  // ✅ 1. CÁLCULO DE XP REAL (Sincronizado con StudentDashboard)
  const calculatedXP = useMemo(() => {
    if (!submissions) return 0;
    
    // Agrupar por tarea para promediar intentos
    const attemptsByTask: Record<string, number[]> = {};
    submissions.forEach(sub => {
       // Usamos task_id como clave única
       if (!attemptsByTask[sub.task_id]) attemptsByTask[sub.task_id] = [];
       attemptsByTask[sub.task_id].push(sub.grade || 0);
    });

    let points = 0;
    Object.values(attemptsByTask).forEach(grades => {
       const average = grades.reduce((a, b) => a + b, 0) / grades.length;
       // Regla: < 6 = 2 XP, >= 6 = 5 XP
       points += (average < 6) ? 2 : 5;
    });

    return points;
  }, [submissions]);

  // ✅ 2. DETERMINAR NIVEL ACTUAL (Iconos de la Jungla)
  const currentLevelData = useMemo(() => {
    const levels = [
      { th: 300, label: 'Rey León', icon: '🦁' },
      { th: 235, label: 'Gorila Fuerte', icon: '🦍' },
      { th: 175, label: 'Jaguar Veloz', icon: '🐆' },
      { th: 125, label: 'Mono Ágil', icon: '🐵' },
      { th: 85, label: 'Tucán Colorido', icon: '🌈' },
      { th: 55, label: 'Loro Parlanchín', icon: '🦜' },
      { th: 35, label: 'Rana Curiosa', icon: '🐸' },
      { th: 25, label: 'Hormiga Obrera', icon: '🐜' },
      { th: 0,  label: 'Novato', icon: <Leaf className="w-5 h-5 text-green-500 fill-current" /> } // Nivel inicial
    ];

    // Buscar el nivel más alto alcanzado
    return levels.find(l => calculatedXP >= l.th) || levels[levels.length - 1];
  }, [calculatedXP]);

  // --- CÁLCULO DE PROMEDIO (LÓGICA UNIFICADA) ---
  const validGrades = submissions
    .map(s => (s.grade && s.grade > 0) ? s.grade : 0)
    .filter(g => g > 0);

  const averageGrade = validGrades.length > 0 
    ? validGrades.reduce((acc, curr) => acc + curr, 0) / validGrades.length 
    : 0;

  const vocabScore = Math.min(100, (averageGrade * 10) + (submissions.length * 2));
  const grammarScore = Math.min(100, (averageGrade * 10) + 10);

  const historyLimit = 5;
  // ORDENAMIENTO CRONOLÓGICO: Más reciente primero
  const sortedSubmissions = [...submissions].sort((a, b) => 
    new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime()
  );
  const visibleSubmissions = showAllHistory ? sortedSubmissions : sortedSubmissions.slice(0, historyLimit);

  // ✅ NUEVA LÓGICA: Agrupar envíos por tarea
  const groupedSubmissions = useMemo(() => {
    const groups: Record<string, Submission[]> = {};
    submissions.forEach(sub => {
       // Agrupamos por ID de tarea
       const key = sub.task_id || sub.task_title || 'unknown';
       if (!groups[key]) groups[key] = [];
       groups[key].push(sub);
    });
    
    // Convertir a array y ordenar por fecha del ÚLTIMO intento
    return Object.values(groups).sort((a, b) => {
       const dateA = Math.max(...a.map(s => new Date(s.submitted_at || 0).getTime()));
       const dateB = Math.max(...b.map(s => new Date(s.submitted_at || 0).getTime()));
       return dateB - dateA;
    });
  }, [submissions]);

  const visibleGroups = showAllHistory ? groupedSubmissions : groupedSubmissions.slice(0, historyLimit);

  return (
    <div className="h-full w-full bg-[#F0F4F8] flex flex-col overflow-hidden relative">
      
      {/* 1. HEADER DE FONDO (Color de Marca Fijo) */}
      <div className="h-32 shrink-0 w-full bg-[#6344A6] relative"> {/* 👈 COLOR FIJO */}
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white shadow-sm">
                <span className="font-black text-[10px] uppercase tracking-widest">Pasaporte Oficial</span>
            </div>
            <button onClick={onBack} className="p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-md transition-all z-50">
                <X className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* 2. CONTENIDO */}
      <div className="flex-1 overflow-y-auto -mt-8 z-10 px-4 pb-10">
         <div className="max-w-3xl mx-auto">
            
            {/* TARJETA PERFIL */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-3 md:p-6">
                <div className="flex flex-row gap-2 md:gap-5 items-center">
                    <div className="shrink-0 relative -mt-4 mb-2"> 
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white p-1 shadow-md">
                            <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover rounded-xl bg-slate-100" />
                        </div>
                        {/* ✅ ICONO DEL NIVEL ACTUAL (Animal o Hoja) */}
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shadow-md text-xl md:text-2xl border-2 border-slate-50" title={currentLevelData.label}>
                            {currentLevelData.icon}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                        {/* ✅ ETIQUETA DEL NIVEL */}
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide mb-1">
                            <Medal className="w-3 h-3 text-amber-500" /> {currentLevelData.label}
                        </div>
                        <h1 className="text-lg md:text-2xl font-black text-slate-800 truncate leading-tight mb-0.5">{student.name}</h1>
                        
                        {/* ✅ EMAIL + SELECTOR DE NIVEL INTEGRADO */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-slate-500 text-xs font-medium">{student.email}</span>
                          
                          {/* SEPARADOR */}
                          <span className="text-slate-300">•</span>

                          {/* ✅ SELECTOR DE NIVEL INTEGRADO */}
                          <div className="relative group">
                            {isTeacher ? (
                              // MODO PROFESOR: Selector Discreto
                              <select
                                value={student.current_level_code}
                                onChange={async (e) => {
                                  const newLvl = e.target.value;
                                  // Actualizar estado local visualmente
                                  student.current_level_code = newLvl as any;
                                  // Guardar en BD
                                  await saveUserPreferences(student.id, { level_code: newLvl });
                                  toast.success(`Nivel de ${student.name} cambiado a ${newLvl}`);
                                  if(onRefresh) onRefresh(); // Recargar para asegurar consistencia
                                }}
                                className="bg-indigo-50 border-none text-indigo-700 text-xs font-black uppercase py-1 px-2 pr-6 rounded-md cursor-pointer hover:bg-indigo-100 transition-colors appearance-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                            ) : (
                              // MODO ESTUDIANTE: Solo Badge
                              <span className="bg-indigo-50 text-indigo-700 text-xs font-black uppercase py-1 px-2 rounded-md border border-indigo-100">
                                Nivel {student.current_level_code}
                              </span>
                            )}
                            
                            {/* Icono de flechita para el select del profe */}
                            {isTeacher && (
                              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 md:gap-2">
                            <Button onClick={onAssignTask} className="flex-1 bg-[rgb(91,44,111)] hover:bg-indigo-700 text-white font-bold h-9 rounded-lg text-[10px] md:text-xs shadow-sm min-w-0">✨ Nueva Misión</Button>
                            <Button variant="outline" onClick={onBack} className="px-2 md:px-4 border-slate-200 text-slate-500 font-bold h-9 rounded-lg text-[10px] md:text-xs hover:bg-slate-50 shrink-0">Cerrar</Button>
                        </div>
                    </div>
                </div>
                
                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-50 bg-slate-50/50 -mx-3 md:-mx-6 -mb-3 md:-mb-6 px-3 md:px-5 py-4 rounded-b-3xl">
                    <div className="text-center">
                        {/* ✅ USA calculatedXP */}
                        <div className="text-xl font-black text-amber-500">{calculatedXP}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">XP Total</div>
                    </div>
                    <div className="text-center border-l border-slate-200"><div className="text-xl font-black text-purple-500">{submissions.length}</div><div className="text-[9px] font-bold text-slate-400 uppercase">Misiones</div></div>
                    <div className="text-center border-l border-slate-200"><div className="text-xl font-black text-emerald-500">{averageGrade.toFixed(1)}</div><div className="text-[9px] font-bold text-slate-400 uppercase">Nota</div></div>
                </div>
            </div>

            {/* SECCIONES INFERIORES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                {/* Habilidades */}
                <div className="md:col-span-1">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 h-full">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-xs uppercase tracking-wider"><Zap className="w-4 h-4 text-amber-500" /> Habilidades</h3>
                        <div className="space-y-4">
                            <SkillBar label="Vocabulario" percent={vocabScore} color="bg-emerald-500" />
                            <SkillBar label="Gramática" percent={grammarScore} color="bg-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Historial Interactivo */}
                <div className="md:col-span-2">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider"><Calendar className="w-4 h-4 text-indigo-500" /> Historial</h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{submissions.length} Total</span>
                        </div>
                        <div className="space-y-2">
                            {submissions.length === 0 ? (
                                <p className="text-center text-slate-400 py-6 text-xs">Sin actividad registrada.</p>
                            ) : (
                                <>
                                    {visibleGroups.map((group, idx) => {
                                        // ✅ CORRECCIÓN: Usamos [...group] para no mutar el original al ordenar
                                        const attempts = [...group].sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime());
                                        const latest = attempts[0];
                                        
                                        const grade = (latest.grade && latest.grade > 0) ? latest.grade : 0;
                                        
                                        return (
                                            <div 
                                                key={idx} 
                                                // ✅ CORRECCIÓN CRÍTICA: Pasamos una copia fresca del array
                                                onClick={() => setSelectedAttempts([...attempts])} 
                                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-transparent hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all group"
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 font-black text-white text-sm shadow-sm ${grade >= 6 ? 'bg-emerald-400' : 'bg-rose-400'}`}>
                                                    {grade.toFixed(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-700 text-xs truncate group-hover:text-indigo-700">{latest.task_title}</h4>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                      <span>{new Date(latest.submitted_at || Date.now()).toLocaleDateString()}</span>
                                                      {attempts.length > 1 && (
                                                        <span className="bg-slate-200 text-slate-600 px-1.5 rounded font-bold flex items-center gap-0.5">
                                                          <Clock className="w-3 h-3" /> {attempts.length} intentos
                                                        </span>
                                                      )}
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right px-2 flex flex-col items-end gap-1">
                                                    <span className="text-xs font-black text-slate-500">{latest.score || 0}/{latest.total || 10}</span>
                                                    
                                                    {/* ✅ BOTÓN DE BORRAR GRUPO (Solo Profesor) */}
                                                    {isTeacher && (
                                                        <button 
                                                            onClick={(e) => handleDeleteGroup(attempts, e)} 
                                                            className="text-slate-300 hover:text-rose-500 p-1 transition-colors hover:bg-rose-50 rounded"
                                                            title="Borrar todo el historial de esta tarea"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {submissions.length > historyLimit && (
                                        <Button variant="ghost" size="sm" onClick={() => setShowAllHistory(!showAllHistory)} className="w-full text-indigo-600 text-xs font-bold h-8 mt-2 hover:bg-indigo-50">
                                            {showAllHistory ? "Ver menos" : "Ver todo el historial"}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* ========== MODAL ROBUSTO CON TABS ========== */}
      <Dialog open={!!selectedAttempts && selectedAttempts.length > 0} onOpenChange={(o) => !o && setSelectedAttempts(null)}>
        <DialogContent className="!max-w-[100vw] !w-screen !h-screen !p-0 !m-0 !rounded-none border-none flex flex-col bg-slate-50">
          
          <div className="flex-1 overflow-y-auto">
            {/* Header Fijo */}
            <DialogHeader className="p-6 bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
                <DialogTitle className="text-xl font-black text-slate-800">
                    {selectedAttempts && selectedAttempts[0]?.task_title}
                </DialogTitle>
                <DialogDescription>
                    Historial de intentos ({selectedAttempts?.length || 0})
                </DialogDescription>
            </DialogHeader>
          
            <div className="p-6 max-w-5xl mx-auto w-full">
              {/* ✅ Renderizado Condicional Seguro */}
              {selectedAttempts && selectedAttempts.length > 0 ? (
                <Tabs defaultValue="attempt-0" className="w-full">
                  
                  {/* BARRA DE PESTAÑAS */}
                  <TabsList className="w-full justify-start overflow-x-auto mb-6 p-1 bg-slate-200/50 rounded-xl h-auto flex-wrap sm:flex-nowrap">
                    {selectedAttempts.map((_, i) => (
                      <TabsTrigger 
                        key={i} 
                        value={`attempt-${i}`}
                        className="rounded-lg px-4 py-2 font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 shadow-sm flex-shrink-0"
                      >
                        Intento {i + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* CONTENIDO DE CADA PESTAÑA */}
                  {selectedAttempts.map((att, i) => {
                    // Buscar tarea para saber si es PDF
                    const relatedTask = tasks.find(t => t.id === att.task_id);
                    const isPdfTask = relatedTask?.content_data?.type === 'document';

                    return (
                        <TabsContent key={i} value={`attempt-${i}`} className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            
                            {/* Resumen de Nota */}
                            <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Entregado el</p>
                                    <p className="text-sm font-bold text-slate-700">{new Date(att.submitted_at || '').toLocaleString()}</p>
                                </div>
                                <div className={`px-4 py-2 rounded-xl font-black text-lg border ${att.grade && att.grade >= 5 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                    {(att.grade || 0).toFixed(1)}/10
                                </div>
                            </div>

                            {/* Feedback Previo */}
                            {att.teacher_feedback && (
                                <div className="bg-indigo-50 p-5 rounded-2xl border-2 border-indigo-100">
                                    <h4 className="font-bold text-indigo-900 text-xs uppercase mb-2">Feedback del Profesor</h4>
                                    <p className="text-slate-700 text-sm italic">"{att.teacher_feedback}"</p>
                                </div>
                            )}

                            {/* --- VISOR DE CONTENIDO (Seguro) --- */}
                            {isPdfTask && relatedTask?.content_data?.pdf_url ? (
                                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden h-[500px]">
                                    <PDFAnnotator
                                        mode="student"
                                        pdfUrl={relatedTask.content_data.pdf_url}
                                        initialAnnotations={[...(att.answers || []), ...(att.teacher_annotations || [])]}
                                        readOnly={true}
                                    />
                                </div>
                            ) : att.textContent ? (
                                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200">
                                    <TextAnnotator 
                                        text={att.textContent} 
                                        annotations={att.corrections || []} 
                                        onAddAnnotation={()=>{}} 
                                        onRemoveAnnotation={()=>{}} 
                                        readOnly={true} 
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {att.answers?.map((ans: any, k: number) => (
                                        <div key={k} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <p className="font-bold text-slate-700 text-sm mb-2">{k+1}. {ans.questionText}</p>
                                            <div className={`p-3 rounded-lg text-sm border-l-4 ${ans.isCorrect ? 'bg-emerald-50 border-emerald-400' : 'bg-rose-50 border-rose-400'}`}>
                                                <span className="opacity-60 text-[10px] font-black uppercase block">Respuesta:</span>
                                                {String(ans.studentAnswer)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ✅ EDITOR DE NOTA (Solo Profesor) */}
                            {isTeacher && (
                                <div className="space-y-4">
                                    <AttemptEditor 
                                      attempt={att} 
                                      onSave={(g, f) => handleUpdateAttempt(att, g, f)} 
                                    />
                                    
                                    {/* ✅ BOTÓN DE BORRAR INTENTO INDIVIDUAL */}
                                    <div className="flex justify-center">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => handleDeleteAttempt(att)}
                                            className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 text-xs"
                                        >
                                            <Trash2 className="w-3 h-3 mr-2" />
                                            Eliminar este intento permanentemente
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    );
                  })}
                </Tabs>
              ) : (
                <div className="text-center py-10 text-slate-400">No hay intentos cargados.</div>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end sticky bottom-0 z-50">
              <Button onClick={() => setSelectedAttempts(null)} className="font-bold bg-slate-900 text-white hover:bg-slate-800">
                Cerrar Resumen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SkillBar = ({ label, percent, color }: { label: string, percent: number, color: string }) => (
    <div>
        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>{label}</span><span>{percent.toFixed(0)}%</span></div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }}></div></div>
    </div>
);

// ✅ COMPONENTE AUXILIAR PARA EDITAR CADA INTENTO
const AttemptEditor = ({ attempt, onSave }: { attempt: Submission; onSave: (grade: number, feedback: string) => Promise<void> }) => {
  const [grade, setGrade] = useState(attempt.grade?.toString() || '0');
  const [feedback, setFeedback] = useState(attempt.teacher_feedback || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado si cambian las props (ej: al guardar)
  useEffect(() => {
    setGrade(attempt.grade?.toString() || '0');
    setFeedback(attempt.teacher_feedback || '');
  }, [attempt]);

  const handleSave = async () => {
    const numGrade = parseFloat(grade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 10) {
      toast.error("Nota inválida (0-10)");
      return;
    }
    setIsSaving(true);
    await onSave(numGrade, feedback);
    setIsSaving(false);
  };

  return (
    <div className="bg-indigo-50 p-5 rounded-2xl border-2 border-indigo-200 space-y-4 mt-6 animate-in fade-in">
      <h4 className="font-bold text-indigo-900 flex items-center gap-2 text-sm uppercase">
        <Edit2 className="w-4 h-4" /> Editar Calificación de este Intento
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-1">
          <label className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Nota (0-10)</label>
          <Input 
            type="number" step="0.1" min="0" max="10" 
            value={grade} onChange={e => setGrade(e.target.value)} 
            className="bg-white border-indigo-300 font-bold text-lg text-center"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Feedback</label>
          <Textarea 
            value={feedback} onChange={e => setFeedback(e.target.value)} 
            className="bg-white border-indigo-300 h-[80px] resize-none text-sm"
            placeholder="Escribe un comentario..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
};