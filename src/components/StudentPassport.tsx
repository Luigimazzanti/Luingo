import React, { useState, useEffect } from 'react';
import { Student, Submission, Task } from '../types';
import { Star, Zap, Trophy, Calendar, CheckCircle2, X, Medal, Eye, XCircle, Trash2, BookOpen, Check, Edit2, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { LUINGO_LEVELS } from '../lib/mockData';
import { cn } from '../lib/utils';
import { deleteMoodlePost, gradeSubmission, saveUserPreferences } from '../lib/moodle';
import { toast } from 'sonner@2.0.3';
import { TextAnnotator } from './TextAnnotator';
import { PDFAnnotator } from './PDFAnnotator';

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
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
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
      
      // 3. Refrescar datos globales si existe la función
      if (onRefresh) onRefresh();
      
    } catch (e) {
      toast.error("Error al guardar el nivel");
    }
  };

  // ✅ PRECARGAR DATOS AL ABRIR MODAL
  useEffect(() => {
    if (selectedSubmission) {
      setEditingGrade(selectedSubmission.grade?.toString() || '0');
      setEditingFeedback(selectedSubmission.teacher_feedback || '');
      setCurrentCorrections(selectedSubmission.corrections || []); // ✅ CARGAR CORRECCIONES
      setIsEditingPdf(false); // ✅ RESETEAR MODO EDICIÓN PDF
      // ✅ CARGAR ANOTACIONES PDF (combinar estudiante + profesor)
      const studentAnnotations = selectedSubmission.answers || [];
      const teacherAnnotations = selectedSubmission.teacher_annotations || [];
      setPdfAnnotations([...studentAnnotations, ...teacherAnnotations]);
    }
  }, [selectedSubmission]);

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
    if (!selectedSubmission) return;
    
    const grade = parseFloat(editingGrade);
    if (isNaN(grade) || grade < 0 || grade > 10) {
      toast.error("Por favor, ingresa una calificación válida entre 0 y 10.");
      return;
    }
    
    try {
      setIsSaving(true);
      toast.loading("Guardando calificación...");
      
      // ✅ CRÍTICO: Reconstruir payload original para no perder metadatos
      const safePayload = selectedSubmission.original_payload || {
        taskId: selectedSubmission.task_id,
        taskTitle: selectedSubmission.task_title,
        studentId: selectedSubmission.student_id,
        studentName: selectedSubmission.student_name,
        score: selectedSubmission.score,
        total: selectedSubmission.total,
        answers: selectedSubmission.answers,
        textContent: selectedSubmission.textContent, // ✅ Incluir texto
        timestamp: selectedSubmission.submitted_at
      };
      
      // Usar postId o limpiar el id
      const targetId = selectedSubmission.postId || selectedSubmission.id.replace('post-', '');
      
      // ✅ Determinar qué correcciones usar (PDF o Writing)
      const relatedTask = tasks.find(t => t.id === selectedSubmission.task_id);
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
  
  // --- LÓGICA DE DATOS ---
  const totalXP = submissions.length * 15;
  const currentLevelInfo = LUINGO_LEVELS.slice().reverse().find(l => totalXP >= l.min_xp) || LUINGO_LEVELS[0];

  const validGrades = submissions.map(s => 
    (s.grade && s.grade > 0) ? s.grade : (s.score && s.total) ? (s.score / s.total) * 10 : 0
  ).filter(g => g > 0);

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

  return (
    <div className="h-full w-full bg-[#F0F4F8] flex flex-col overflow-hidden relative">
      
      {/* 1. HEADER DE FONDO */}
      <div className={`h-32 shrink-0 w-full bg-gradient-to-r ${currentLevelInfo.color} relative`}>
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
                        <div className="absolute -bottom-2 -right-2 w-7 h-7 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shadow text-base md:text-lg border border-slate-50" title={currentLevelInfo.label}>
                            {currentLevelInfo.icon}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide mb-1`}>
                            <Medal className="w-3 h-3 text-amber-500" /> {currentLevelInfo.label}
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
                            <Button onClick={onAssignTask} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 rounded-lg text-[10px] md:text-xs shadow-sm min-w-0">✨ Nueva Misión</Button>
                            <Button variant="outline" onClick={onBack} className="px-2 md:px-4 border-slate-200 text-slate-500 font-bold h-9 rounded-lg text-[10px] md:text-xs hover:bg-slate-50 shrink-0">Cerrar</Button>
                        </div>
                    </div>
                </div>
                
                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-50 bg-slate-50/50 -mx-3 md:-mx-6 -mb-3 md:-mb-6 px-3 md:px-5 py-4 rounded-b-3xl">
                    <div className="text-center"><div className="text-xl font-black text-amber-500">{totalXP}</div><div className="text-[9px] font-bold text-slate-400 uppercase">XP Total</div></div>
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
                                    {visibleSubmissions.map((sub, idx) => {
                                        const grade = (sub.grade && sub.grade > 0) ? sub.grade : (sub.score && sub.total) ? (sub.score / sub.total) * 10 : 0;
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => setSelectedSubmission(sub)}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-transparent hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all group"
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 font-black text-white text-sm shadow-sm ${grade >= 6 ? 'bg-emerald-400' : 'bg-rose-400'}`}>
                                                    {grade.toFixed(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-700 text-xs truncate group-hover:text-indigo-700">{sub.task_title}</h4>
                                                    <p className="text-[10px] text-slate-400">{new Date(sub.submitted_at || Date.now()).toLocaleDateString()}</p>
                                                </div>
                                                {/* ✅ BOTÓN DE BORRAR Y VER */}
                                                <div className="text-right px-2 flex flex-col items-end gap-1">
                                                    <span className="text-xs font-black text-slate-500">{sub.score}/{sub.total}</span>
                                                    <button 
                                                        onClick={(e) => handleDelete(sub, e)} 
                                                        className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                                                        title="Borrar este intento"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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

      {/* ========== ✅ MODAL DE DETALLES (PROFESOR) - ALINEADO CON DASHBOARD ========== */}
      <Dialog open={!!selectedSubmission} onOpenChange={(o) => !o && setSelectedSubmission(null)}>
        <DialogContent className="!max-w-[100vw] !w-screen !h-screen !p-0 !m-0 !rounded-none border-none flex flex-col bg-slate-50">
          {/* El contenido interno debe poder hacer scroll */}
          <div className="flex-1 overflow-y-auto">
            <DialogHeader className="p-6 bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
            <DialogTitle className="text-xl font-black text-slate-800">
              {selectedSubmission?.task_title}
            </DialogTitle>
            <DialogDescription>
              Resumen del intento • Nota: {selectedSubmission?.grade?.toFixed(1) || '0.0'}/10
              <br />
              <span className="text-xs text-slate-400">
                Entregado: {new Date(selectedSubmission?.submitted_at || '').toLocaleString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {/* ✅ FEEDBACK DEL PROFESOR (Si existe) */}
            {selectedSubmission?.teacher_feedback && selectedSubmission.teacher_feedback.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border-2 border-indigo-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0">
                    ✍️
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-indigo-900 mb-2 text-sm uppercase tracking-wide">
                      Comentario del Profesor
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      {selectedSubmission.teacher_feedback}
                    </p>
                    {selectedSubmission.graded_at && (
                      <p className="text-xs text-indigo-600 mt-2 font-medium">
                        Calificado: {new Date(selectedSubmission.graded_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ✅ RENDERIZADO CONDICIONAL: PDF vs WRITING vs QUIZ */}
            {(() => {
              // Encontrar la tarea relacionada
              const relatedTask = tasks.find(t => t.id === selectedSubmission?.task_id);
              const isPdfTask = relatedTask?.content_data?.type === 'document';

              // CASO 1: Tarea de Documento PDF
              if (isPdfTask && relatedTask?.content_data?.pdf_url) {
                return (
                  <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                          Documento PDF con Anotaciones
                        </h4>
                      </div>
                      {/* ✅ BOTÓN DE EDICIÓN (Solo para profesor) */}
                      {isTeacher && (
                        <Button
                          onClick={() => setIsEditingPdf(!isEditingPdf)}
                          variant={isEditingPdf ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "text-xs font-bold",
                            isEditingPdf && "bg-indigo-600 hover:bg-indigo-700"
                          )}
                        >
                          {isEditingPdf ? "💾 Modo Edición Activo" : "✏️ Editar Corrección"}
                        </Button>
                      )}
                    </div>
                    <div className="h-[500px] rounded-xl overflow-hidden border border-slate-300">
                      <PDFAnnotator
                        mode="teacher"
                        pdfUrl={relatedTask.content_data.pdf_url}
                        initialAnnotations={pdfAnnotations}
                        readOnly={!isEditingPdf}
                        onSave={(newAnnotations) => setPdfAnnotations(newAnnotations)}
                      />
                    </div>
                  </div>
                );
              }

              // CASO 2: Tarea de Redacción (WRITING)
              if (selectedSubmission?.textContent && selectedSubmission.textContent.length > 0) {
                return (
                  <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                        Texto de Redacción {selectedSubmission.corrections && selectedSubmission.corrections.length > 0 && '(con correcciones del profesor)'}
                      </h4>
                    </div>
                    <TextAnnotator 
                      text={selectedSubmission.textContent}
                      annotations={selectedSubmission.corrections || []}
                      onAddAnnotation={handleAddCorrection}
                      onRemoveAnnotation={handleRemoveCorrection}
                      onUpdateAnnotation={handleUpdateCorrection}
                      readOnly={!isTeacher}
                    />
                    <div className="mt-4 pt-4 border-t border-slate-300 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-bold">
                        Palabras: {selectedSubmission.textContent.split(/\s+/).filter((w: string) => w.length > 0).length}
                      </span>
                      <span className="text-slate-600 font-bold">
                        Caracteres: {selectedSubmission.textContent.length}
                      </span>
                    </div>
                  </div>
                );
              }

              // CASO 3: Tarea de Cuestionario (QUIZ)
              if (selectedSubmission?.answers && selectedSubmission.answers.length > 0) {
                return (
                  <>
                    {selectedSubmission.answers.map((ans: any, i: number) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="font-bold text-slate-700 text-sm mb-3">
                          {i + 1}. {ans.questionText}
                        </p>
                        
                        <div className="space-y-2">
                          <div className={cn(
                            "p-3 rounded-lg text-sm border-l-4",
                            ans.isCorrect 
                              ? "bg-emerald-50 border-emerald-400 text-emerald-900" 
                              : "bg-rose-50 border-rose-400 text-rose-900"
                          )}>
                            <span className="text-[10px] font-black opacity-60 uppercase block mb-1">
                              Respuesta del Alumno:
                            </span>
                            {String(ans.studentAnswer || '---')}
                          </div>
                          
                          {!ans.isCorrect && (
                            <div className="p-3 rounded-lg text-sm bg-slate-50 border-l-4 border-slate-300 text-slate-600">
                              <span className="text-[10px] font-black opacity-60 uppercase block mb-1">
                                Solución Correcta:
                              </span>
                              {String(ans.correctAnswer || 'Consultar profesor')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                );
              }

              // CASO 4: Sin contenido
              return (
                <div className="text-center py-10">
                  <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
                  <p className="text-slate-400">No hay detalles guardados para este intento.</p>
                </div>
              );
            })()}
          </div>
          
          {/* ✅ SECCIÓN DE EDICIÓN (MODO PROFESOR) */}
          {isTeacher && (
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={editingGrade}
                  onChange={(e) => setEditingGrade(e.target.value)}
                  className="w-20"
                  placeholder="Nota"
                />
                <Textarea
                  value={editingFeedback}
                  onChange={(e) => setEditingFeedback(e.target.value)}
                  placeholder="Comentario del Profesor"
                  className="flex-1"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSaveGrade}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 rounded-lg text-xs shadow-sm"
                >
                  {isSaving ? "Guardando..." : "Guardar Calificación"}
                </Button>
              </div>
            </div>
            )}
            
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
              <Button onClick={() => setSelectedSubmission(null)}>
                Cerrar
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