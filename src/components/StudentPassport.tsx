import React, { useState } from 'react';
import { Student, Submission, Task } from '../types';
import { Star, Zap, Trophy, Calendar, CheckCircle2, X, Medal, Eye, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { LUINGO_LEVELS } from '../lib/mockData';
import { cn } from '../lib/utils';

interface StudentPassportProps {
  student: Student;
  tasks?: Task[];
  submissions?: Submission[];
  onBack: () => void;
  onAssignTask: () => void;
}

export const StudentPassport: React.FC<StudentPassportProps> = ({
  student,
  tasks = [],
  submissions = [],
  onBack,
  onAssignTask
}) => {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

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
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5 md:p-6">
                <div className="flex flex-row gap-5 items-center">
                    <div className="shrink-0 relative -mt-4 mb-2"> 
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white p-1 shadow-md">
                            <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover rounded-xl bg-slate-100" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow text-lg border border-slate-50" title={currentLevelInfo.label}>
                            {currentLevelInfo.icon}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide mb-1`}>
                            <Medal className="w-3 h-3 text-amber-500" /> {currentLevelInfo.label}
                        </div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 truncate leading-tight mb-0.5">{student.name}</h1>
                        <p className="text-slate-400 text-xs font-medium truncate mb-3">{student.email}</p>
                        <div className="flex gap-2">
                            <Button onClick={onAssignTask} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 rounded-lg text-xs shadow-sm">✨ Nueva Misión</Button>
                            <Button variant="outline" onClick={onBack} className="px-4 border-slate-200 text-slate-500 font-bold h-9 rounded-lg text-xs hover:bg-slate-50">Cerrar</Button>
                        </div>
                    </div>
                </div>
                
                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-50 bg-slate-50/50 -mx-5 -mb-5 px-5 py-4 rounded-b-3xl">
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
                                                <div className="text-right px-2">
                                                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 group-hover:text-indigo-600"><Eye className="w-3 h-3" /> Ver</span>
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

      {/* MODAL DE REVISIÓN (Reescrito con Tabla y Feedback del Profesor) */}
      <Dialog open={!!selectedSubmission} onOpenChange={(o) => !o && setSelectedSubmission(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 bg-slate-50">
          {/* ACCESIBILIDAD: Título oculto para lectores de pantalla */}
          <DialogTitle className="sr-only">
            Detalle de Entrega: {selectedSubmission?.task_title}
          </DialogTitle>
          
          <div className="bg-white p-6 border-b sticky top-0 z-10 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-xl text-slate-800">{selectedSubmission?.task_title}</h3>
              <span className={`px-4 py-1 rounded-full text-sm font-black ${
                (selectedSubmission?.grade || 0) >= 5 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-rose-100 text-rose-700'
              }`}>
                Nota: {(selectedSubmission?.grade || 0).toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Entregado el: {new Date(selectedSubmission?.submitted_at || '').toLocaleString()}
            </p>
          </div>
          
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
                        Calificado el: {new Date(selectedSubmission.graded_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de Respuestas */}
            {selectedSubmission?.answers && Array.isArray(selectedSubmission.answers) && selectedSubmission.answers.length > 0 ? (
              selectedSubmission.answers.map((ans: any, i: number) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="font-bold text-slate-700 mb-3 flex gap-2">
                    <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded flex items-center justify-center text-xs">
                      {i + 1}
                    </span>
                    {ans.q || ans.questionText || "Pregunta sin texto"}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-3 rounded-xl border-l-4 ${
                      ans.correct || ans.isCorrect 
                        ? 'bg-emerald-50 border-emerald-400' 
                        : 'bg-rose-50 border-rose-400'
                    }`}>
                      <p className="text-xs font-bold uppercase mb-1 opacity-50">Respuesta Alumno</p>
                      <p className="font-medium text-slate-800">
                        {String(ans.a || ans.studentAnswer || "---")}
                      </p>
                    </div>
                    
                    {(!ans.correct && !ans.isCorrect) && (
                      <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-slate-300">
                        <p className="text-xs font-bold uppercase mb-1 opacity-50">Solución Correcta</p>
                        <p className="font-medium text-slate-600">
                          {String(ans.correctAnswer || "Consultar manual")}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* CAMPO DE FEEDBACK DEL PROFESOR (Visual por ahora, preparado para implementación futura) */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <textarea 
                      placeholder="Escribe un comentario para el alumno..." 
                      className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 outline-none resize-none h-16"
                      disabled
                      title="Función de feedback en desarrollo"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400">
                ⚠️ No se guardaron las respuestas detalladas para esta entrega.
                <p className="text-xs mt-2">
                  {selectedSubmission?.score 
                    ? `Puntuación: ${selectedSubmission.score}/${selectedSubmission.total}` 
                    : "Esta tarea se realizó antes de la implementación del sistema de respuestas detalladas."}
                </p>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-slate-200 bg-white sticky bottom-0">
            <Button 
              onClick={() => setSelectedSubmission(null)} 
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold h-12 rounded-xl"
            >
              Cerrar Detalle
            </Button>
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