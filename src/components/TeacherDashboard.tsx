import React, { useState, useEffect } from 'react';
import { Student, Task, Classroom, Submission } from '../types';
import { StudentCard } from './StudentCard';
import { Users, QrCode, Sparkles, Trash2, Edit2, List, GraduationCap, Eye, CheckCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { gradeSubmission, getMoodleSubmissions } from '../lib/moodle';
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
}) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'students' | 'tasks' | 'grades'>('students');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const inviteLink = `https://edtech.app/join/${classroom.invite_code}`;

  // ✅ AGRUPACIÓN DE ENTREGAS: Por estudiante + tarea
  const groupedSubmissions = submissions.reduce((acc: any, sub) => {
    const key = `${sub.student_name}-${sub.task_title}`;
    if (!acc[key]) {
      acc[key] = { 
        student_name: sub.student_name,
        student_id: sub.student_id,
        task_title: sub.task_title,
        task_id: sub.task_id,
        attempts: []
      };
    }
    acc[key].attempts.push(sub);
    // Ordenar intentos por fecha (más antiguo primero)
    acc[key].attempts.sort((a: any, b: any) => 
      new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    );
    return acc;
  }, {});

  const submissionList = Object.values(groupedSubmissions);

  // ✅ Función para calificar
  const handleGrade = async (attempt: any) => {
    const newGrade = parseFloat(gradeInput);
    
    if (isNaN(newGrade) || newGrade < 0 || newGrade > 10) {
      toast.error('La nota debe estar entre 0 y 10');
      return;
    }

    setIsGrading(true);
    toast.loading('Guardando calificación...');

    try {
      // Preparar datos originales
      const originalData = {
        taskId: attempt.task_id,
        taskTitle: attempt.task_title,
        studentId: attempt.student_id,
        studentName: attempt.student_name,
        score: attempt.score,
        total: attempt.total,
        answers: attempt.answers,
        timestamp: attempt.submitted_at
      };

      await gradeSubmission(
        attempt.discussion_id,
        newGrade,
        feedbackInput,
        originalData
      );

      toast.dismiss();
      toast.success('✅ Calificación guardada correctamente');
      
      // Refrescar datos
      if (onRefreshSubmissions) {
        onRefreshSubmissions();
      }
      
      // Cerrar modal
      setSelectedGroup(null);
      setGradeInput('');
      setFeedbackInput('');
    } catch (error) {
      console.error('Error al calificar:', error);
      toast.dismiss();
      toast.error('Error al guardar la calificación');
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#F0F4F8] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div className="relative px-4 md:px-6 py-6 md:py-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Info Clase */}
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">🇪🇸</div>
               <div>
                   <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-1 text-[rgb(255,255,255)]">{classroom.name}</h1>
                   <p className="text-indigo-200 font-medium opacity-90">{classroom.description}</p>
               </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Botón Invitar */}
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-indigo-50 border-b-4 border-indigo-200 h-12 md:h-14 px-6 rounded-xl font-black active:translate-y-1 active:border-b-0 transition-all">
                    <Users className="w-5 h-5 mr-2" />
                    INVITAR
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-4 border-indigo-100 rounded-3xl w-[95%] p-6">
                    <DialogTitle className="sr-only">Código de Invitación</DialogTitle>
                    
                    <div className="text-center">
                        <QrCode className="w-32 h-32 mx-auto mb-4 text-indigo-900" />
                        <p className="font-bold text-indigo-900 text-lg mb-2">Código de Acceso</p>
                        <div className="bg-indigo-50 p-3 rounded-xl border-2 border-indigo-100 font-mono text-xl tracking-widest text-indigo-600">
                            {classroom.invite_code}
                        </div>
                    </div>
                </DialogContent>
              </Dialog>

              {/* BOTÓN IA */}
              <Button 
                onClick={onGenerateTask}
                className="w-full sm:w-auto bg-amber-400 text-amber-900 hover:bg-amber-500 border-b-4 border-amber-700 h-12 md:h-14 px-6 rounded-xl font-black active:translate-y-1 active:border-b-0 transition-all shadow-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                CREAR TAREA IA
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 overflow-y-auto">
        {/* Switch Vista */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
             <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                 {viewMode === 'students' && 'Estudiantes'}
                 {viewMode === 'tasks' && 'Misiones Activas'}
                 {viewMode === 'grades' && 'Centro de Calificaciones'}
                 <span className="bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-xl text-sm font-bold shadow-sm">
                     {viewMode === 'students' && students.length}
                     {viewMode === 'tasks' && tasks.length}
                     {viewMode === 'grades' && submissionList.length}
                 </span>
             </h2>
             
             <div className="flex gap-2">
               <Button 
                  variant={viewMode === 'students' ? 'default' : 'outline'}
                  onClick={() => setViewMode('students')}
                  className="h-10 px-4 rounded-xl font-bold"
               >
                  <Users className="w-4 h-4 mr-2" />
                  Estudiantes
               </Button>
               <Button 
                  variant={viewMode === 'tasks' ? 'default' : 'outline'}
                  onClick={() => setViewMode('tasks')}
                  className="h-10 px-4 rounded-xl font-bold"
               >
                  <List className="w-4 h-4 mr-2" />
                  Misiones
               </Button>
               <Button 
                  variant={viewMode === 'grades' ? 'default' : 'outline'}
                  onClick={() => setViewMode('grades')}
                  className="h-10 px-4 rounded-xl font-bold"
               >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Calificar
               </Button>
             </div>
        </div>

        {/* GRID ESTUDIANTES */}
        {viewMode === 'students' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {students.map(student => (
                    <StudentCard key={student.id} student={student} onClick={() => onSelectStudent(student.id)} />
                ))}
                {students.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        No hay estudiantes matriculados (o eres el único en el curso).
                    </div>
                )}
            </div>
        )}

        {/* LISTA DE TAREAS */}
        {viewMode === 'tasks' && (
            <div className="space-y-4 max-w-4xl mx-auto">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white p-5 rounded-2xl border-2 border-slate-100 flex items-center justify-between hover:border-indigo-200 transition-all shadow-sm">
                        <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">{task.category}</span>
                                <h3 className="font-bold text-slate-800 truncate">{task.title}</h3>
                            </div>
                            <p className="text-xs text-slate-400 truncate">{task.description}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                onClick={() => onEditTask && onEditTask(task)}
                            >
                                <Edit2 className="w-5 h-5" />
                            </Button>
                            <Button onClick={() => onDeleteTask(task.id)} variant="ghost" size="icon" className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* CENTRO DE CALIFICACIONES */}
        {viewMode === 'grades' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            {submissionList.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border-2 border-dashed border-slate-200">
                No hay entregas pendientes de calificar
              </div>
            ) : (
              submissionList.map((group: any, idx: number) => {
                const latestAttempt = group.attempts[group.attempts.length - 1];
                const hasTeacherFeedback = latestAttempt.teacher_feedback && latestAttempt.teacher_feedback.length > 0;

                return (
                  <div key={idx} className="bg-white p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 transition-all shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-slate-800">{group.student_name}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-indigo-600 font-medium">{group.task_title}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {group.attempts.length} intento{group.attempts.length > 1 ? 's' : ''}
                          </span>
                          <span className="font-bold">
                            Nota: {latestAttempt.grade.toFixed(1)} / 10
                          </span>
                          {hasTeacherFeedback && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle className="w-3 h-3" />
                              Calificado
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedGroup(group);
                          setGradeInput(latestAttempt.grade.toString());
                          setFeedbackInput(latestAttempt.teacher_feedback || '');
                        }}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold px-4 h-10 rounded-xl"
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

      {/* MODAL DE CORRECCIÓN CON TABS */}
      <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800">
              Corrección: {selectedGroup?.student_name} - {selectedGroup?.task_title}
            </DialogTitle>
          </DialogHeader>

          {selectedGroup && (
            <Tabs defaultValue="attempt-0" className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedGroup.attempts.length}, 1fr)` }}>
                {selectedGroup.attempts.map((_: any, i: number) => (
                  <TabsTrigger key={i} value={`attempt-${i}`} className="font-bold">
                    Intento {i + 1}
                  </TabsTrigger>
                ))}
              </TabsList>

              {selectedGroup.attempts.map((attempt: any, i: number) => (
                <TabsContent key={i} value={`attempt-${i}`} className="space-y-6 mt-6">
                  {/* Info del intento */}
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Puntuación</p>
                        <p className="text-2xl font-black text-indigo-600">{attempt.score}/{attempt.total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Nota Automática</p>
                        <p className="text-2xl font-black text-purple-600">{attempt.grade.toFixed(1)}/10</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Fecha</p>
                        <p className="text-sm font-bold text-slate-700">
                          {new Date(attempt.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Respuestas */}
                  <div>
                    <h3 className="font-black text-slate-800 mb-4">Respuestas del Estudiante:</h3>
                    {attempt.answers && attempt.answers.length > 0 ? (
                      <div className="space-y-3">
                        {attempt.answers.map((ans: any, ansIdx: number) => (
                          <div key={ansIdx} className={`p-4 rounded-xl border-2 ${ans.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                            <p className="font-bold text-slate-800 mb-2">{ansIdx + 1}. {ans.questionText}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-slate-500 font-medium">Respuesta:</span>
                                <span className="ml-2 font-bold">{ans.studentAnswer || '(Sin respuesta)'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium">Correcta:</span>
                                <span className="ml-2 font-bold text-emerald-700">{ans.correctAnswer || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-center py-4">No hay respuestas registradas</p>
                    )}
                  </div>

                  {/* Formulario de Calificación */}
                  <div className="border-t-2 border-slate-100 pt-6 space-y-4">
                    <h3 className="font-black text-slate-800">Calificación del Profesor:</h3>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Nota Final (0-10):
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        className="w-full h-12 text-lg font-bold"
                        placeholder="8.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Comentario / Feedback:
                      </label>
                      <Textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        className="w-full min-h-[120px] resize-none"
                        placeholder="Escribe aquí tu feedback para el estudiante..."
                      />
                    </div>

                    <Button
                      onClick={() => handleGrade(attempt)}
                      disabled={isGrading}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-xl"
                    >
                      {isGrading ? 'Guardando...' : '✅ Guardar Corrección'}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
