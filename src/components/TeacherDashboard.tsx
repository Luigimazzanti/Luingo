import React, { useState } from 'react';
import { Student, Task, Classroom, Submission } from '../types';
import { StudentCard } from './StudentCard';
import { Users, QrCode, Sparkles, Trash2, Edit2, List, GraduationCap, Eye, CheckCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { gradeSubmission } from '../lib/moodle';
import { toast } from 'sonner@2.0.3';

interface TeacherDashboardProps {
  classroom: Classroom;
  students: Student[];
  tasks: Task[];
  submissions?: Submission[];
  onSelectStudent: (studentId: string) => void;
  onGenerateTask: () => void;
  onDeleteTask: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onRefreshSubmissions?: () => void;
  onLogout?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  classroom,
  students,
  tasks,
  submissions = [],
  onSelectStudent,
  onGenerateTask,
  onDeleteTask,
  onEditTask,
  onRefreshSubmissions,
  onLogout
}) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'students' | 'tasks' | 'grades'>('students');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  // ========== LOG DE DEPURACIÓN ==========
  console.log('👨‍🏫 TeacherDashboard recibió:', submissions?.length || 0, 'entregas');
  console.log('📊 Datos de entregas:', submissions);

  // ========== LÓGICA DE AGRUPACIÓN ROBUSTA CON FALLBACKS ==========
  const groupedSubmissions = submissions.reduce((acc: any, sub) => {
    // Clave robusta: Si falta ID, usamos nombre/título como fallback
    const studentKey = sub.student_id || sub.student_name || 'unknown-student';
    const taskKey = sub.task_id && sub.task_id !== 'unknown' 
      ? sub.task_id 
      : sub.task_title || 'unknown-task';
    
    const key = `${studentKey}-${taskKey}`;
    
    if (!acc[key]) {
      acc[key] = {
        key,
        student_name: sub.student_name || 'Estudiante Desconocido',
        student_id: sub.student_id || 'unknown',
        task_title: sub.task_title || 'Tarea Sin Título',
        task_id: sub.task_id || 'unknown',
        attempts: []
      };
    }
    
    // Añadir intento a la lista
    acc[key].attempts.push(sub);
    return acc;
  }, {});

  // Convertir a array y ordenar intentos por fecha
  const submissionList = Object.values(groupedSubmissions).map((group: any) => {
    group.attempts.sort((a: any, b: any) => 
      new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    );
    return group;
  });

  // ========== LOG DE RESULTADO DE AGRUPACIÓN ==========
  console.log('📋 Entregas agrupadas:', submissionList.length, 'grupos');
  console.log('🔍 Detalle de grupos:', submissionList);

  // ========== HANDLER CALIFICAR ==========
  const handleGrade = async (attempt: any) => {
    const newGrade = parseFloat(gradeInput);
    
    if (isNaN(newGrade) || newGrade < 0 || newGrade > 10) {
      toast.error('La nota debe estar entre 0 y 10');
      return;
    }

    setIsGrading(true);
    
    try {
      // Usamos postId o id (limpiando 'post-')
      const targetId = attempt.postId || attempt.id.replace('post-', '');
      await gradeSubmission(targetId, newGrade, feedbackInput);

      toast.success('✅ Calificación guardada');
      
      if (onRefreshSubmissions) {
        onRefreshSubmissions();
      }
      
      setSelectedGroup(null);
      setGradeInput('');
      setFeedbackInput('');
    } catch (error) {
      console.error('Error al calificar:', error);
      toast.error('Error al guardar la calificación');
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-800">{classroom.name}</h1>
              <p className="text-sm text-slate-500">{classroom.subject} • {classroom.level}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowInviteDialog(true)}
                variant="outline"
                className="gap-2 rounded-xl border-slate-200 hover:border-indigo-300"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Código de Invitación</span>
              </Button>
              
              <Button
                onClick={onGenerateTask}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Generar con IA</span>
                <span className="sm:hidden">IA</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Tabs Navegación */}
          <div className="flex gap-2 mb-8 bg-white p-1 rounded-xl w-fit shadow-sm border border-slate-200">
            <Button
              variant={viewMode === 'students' ? 'default' : 'ghost'}
              onClick={() => setViewMode('students')}
              className="rounded-lg gap-2"
            >
              <Users className="w-4 h-4" />
              Estudiantes
            </Button>
            <Button
              variant={viewMode === 'tasks' ? 'default' : 'ghost'}
              onClick={() => setViewMode('tasks')}
              className="rounded-lg gap-2"
            >
              <List className="w-4 h-4" />
              Misiones
            </Button>
            <Button
              variant={viewMode === 'grades' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grades')}
              className="rounded-lg gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Calificar
              {submissionList.length > 0 && (
                <span className="ml-2 bg-slate-100 text-slate-600 px-2 rounded-full text-xs font-bold">
                  {submissionList.length}
                </span>
              )}
            </Button>
          </div>

          {/* Vista Estudiantes */}
          {viewMode === 'students' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map(s => (
                <StudentCard
                  key={s.id}
                  student={s}
                  onClick={() => onSelectStudent(s.id)}
                />
              ))}
              {students.length === 0 && (
                <div className="col-span-full text-center py-20">
                  <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">No hay estudiantes inscritos</p>
                  <p className="text-slate-400 text-sm">Comparte el código de invitación para que se unan</p>
                </div>
              )}
            </div>
          )}

          {/* Vista Tareas */}
          {viewMode === 'tasks' && (
            <div className="space-y-4">
              {tasks.map(t => (
                <div
                  key={t.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-slate-800 text-lg">{t.title}</h3>
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-xs font-bold uppercase">
                        {t.category || 'Tarea'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{t.description}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditTask && onEditTask(t)}
                      className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                    >
                      <Edit2 className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteTask(t.id)}
                      className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-20">
                  <List className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">No hay tareas creadas</p>
                  <p className="text-slate-400 text-sm mb-6">Crea una tarea con IA o manualmente</p>
                  <Button onClick={onGenerateTask} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generar con IA
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Vista Calificar */}
          {viewMode === 'grades' && (
            <div className="space-y-4">
              {submissionList.length === 0 ? (
                <div className="text-center py-20">
                  <GraduationCap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">No hay entregas pendientes</p>
                  <p className="text-slate-400 text-sm">Las entregas de los estudiantes aparecerán aquí</p>
                </div>
              ) : (
                submissionList.map((group: any, idx: number) => {
                  const lastAttempt = group.attempts[group.attempts.length - 1];
                  
                  return (
                    <div
                      key={idx}
                      className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 text-lg">
                          {group.student_name}
                        </h3>
                        <p className="text-sm text-indigo-600 font-medium">
                          {group.task_title}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {group.attempts.length} intento{group.attempts.length > 1 ? 's' : ''}
                          </span>
                          <span>
                            Último: {new Date(lastAttempt.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="text-right">
                          <p className="text-2xl font-black text-emerald-600">
                            {lastAttempt.grade.toFixed(1)}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Nota Actual
                          </p>
                        </div>
                        
                        <Button
                          onClick={() => {
                            setSelectedGroup(group);
                            setGradeInput(lastAttempt.grade.toString());
                            setFeedbackInput('');
                          }}
                          className="h-10 px-6 rounded-xl font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Revisar
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========== MODAL DE CORRECCIÓN ========== */}
      <Dialog open={!!selectedGroup} onOpenChange={(o) => !o && setSelectedGroup(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800">
              Calificar: {selectedGroup?.student_name}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              {selectedGroup?.task_title}
            </p>
          </DialogHeader>

          {selectedGroup && (
            <Tabs defaultValue={`attempt-${selectedGroup.attempts.length - 1}`}>
              <TabsList className="w-full justify-start overflow-x-auto">
                {selectedGroup.attempts.map((_: any, i: number) => (
                  <TabsTrigger key={i} value={`attempt-${i}`} className="gap-2">
                    <span className="hidden sm:inline">Intento</span>
                    {i + 1}
                  </TabsTrigger>
                ))}
              </TabsList>

              {selectedGroup.attempts.map((att: any, i: number) => (
                <TabsContent
                  key={i}
                  value={`attempt-${i}`}
                  className="space-y-6 mt-4"
                >
                  {/* Información del Intento */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                          Fecha de Entrega
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {new Date(att.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                          Nota Actual
                        </p>
                        <p className="text-3xl font-black text-emerald-600">
                          {att.grade.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Respuestas del Estudiante */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Respuestas del Estudiante
                    </h4>
                    
                    {att.answers && att.answers.length > 0 ? (
                      att.answers.map((ans: any, k: number) => (
                        <div
                          key={k}
                          className={`p-4 rounded-xl border-2 ${
                            ans.isCorrect
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-rose-50 border-rose-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="bg-white text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                              {k + 1}
                            </span>
                            <div className="flex-1">
                              <p className="font-bold text-sm text-slate-700 mb-2">
                                {ans.questionText}
                              </p>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                                    Respuesta del Estudiante:
                                  </p>
                                  <p
                                    className={`font-bold ${
                                      ans.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                                    }`}
                                  >
                                    {String(ans.studentAnswer)}
                                  </p>
                                </div>
                                {!ans.isCorrect && ans.correctAnswer && (
                                  <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                                      Respuesta Correcta:
                                    </p>
                                    <p className="text-slate-600 font-medium">
                                      {ans.correctAnswer}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {ans.isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-rose-600" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        No hay respuestas detalladas para este intento
                      </div>
                    )}
                  </div>

                  {/* Formulario de Evaluación */}
                  <div className="bg-indigo-50 p-6 rounded-2xl border-2 border-indigo-200 space-y-4">
                    <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Evaluación del Profesor
                    </h4>
                    
                    <div>
                      <label className="text-xs font-bold text-indigo-700 uppercase block mb-2">
                        Nueva Nota (0-10)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        className="bg-white border-indigo-300 h-12 text-lg font-bold"
                        placeholder="0.0"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-indigo-700 uppercase block mb-2">
                        Comentarios para el Estudiante
                      </label>
                      <Textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        className="bg-white border-indigo-300 h-32 resize-none"
                        placeholder="Escribe feedback constructivo..."
                      />
                    </div>
                    
                    <Button
                      onClick={() => handleGrade(att)}
                      disabled={isGrading}
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold text-lg rounded-xl shadow-md"
                    >
                      {isGrading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Guardar Calificación
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== DIALOG DE INVITACIÓN ========== */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800">
              Código de Invitación
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="bg-slate-50 p-8 rounded-2xl border-2 border-dashed border-slate-300 mb-6">
              <QrCode className="w-32 h-32 mx-auto text-slate-400 mb-4" />
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                Código de Clase
              </p>
              <p className="text-4xl font-black text-indigo-600 tracking-wider">
                {classroom.invite_code}
              </p>
            </div>
            <p className="text-sm text-slate-600">
              Comparte este código con tus estudiantes para que se unan a la clase
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};