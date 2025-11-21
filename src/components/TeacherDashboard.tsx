import React, { useState } from 'react';
import { Student, Task, Classroom } from '../types';
import { StudentCard } from './StudentCard';
import { Plus, Users, BookOpen, Target, QrCode, Link2, Sparkles, Music, Briefcase, Plane, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface TeacherDashboardProps {
  classroom: Classroom;
  students: Student[];
  tasks: Task[];
  onSelectStudent: (studentId: string) => void;
  onGenerateTask: (topic: string, level: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  classroom,
  students,
  tasks,
  onSelectStudent,
  onGenerateTask,
  onDeleteTask,
}) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAITaskDialog, setShowAITaskDialog] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLevel, setAiLevel] = useState<string>('B1');
  const [aiVibe, setAiVibe] = useState<string>('culture');
  
  // State for "Smart Assignment" highlighting
  const [highlightedLevel, setHighlightedLevel] = useState<string | null>(null);
  
  // State for view mode (students or tasks)
  const [viewMode, setViewMode] = useState<'students' | 'tasks'>('students');

  // Estadísticas generales
  const totalStudents = students.length;
  const averageClassGrade =
    students.reduce((sum, s) => sum + s.average_grade, 0) / totalStudents || 0;
  const activeTasks = tasks.filter((t) => t.status === 'published').length;
  const completionRate =
    (students.reduce((sum, s) => sum + s.completed_tasks, 0) /
      (totalStudents * tasks.length || 1)) *
    100;

  const inviteLink = `https://edtech.app/join/${classroom.invite_code}`;

  const handleGenerateTask = () => {
    if (aiTopic.trim()) {
      onGenerateTask(aiTopic, aiLevel);
      setAiTopic('');
      setShowAITaskDialog(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
  };

  // Función auxiliar para determinar rango numérico de nivel para la demo
  const getLevelRange = (level: string) => {
      switch(level) {
          case 'A1': return [0, 5];
          case 'A2': return [6, 10];
          case 'B1': return [11, 15];
          case 'B2': return [16, 20];
          case 'C1': return [21, 25];
          case 'C2': return [26, 100];
          default: return [0, 100];
      }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-24">
      {/* Cabecera HERO - Color Violeta Vibrante */}
      <div className="bg-indigo-600 border-b-4 border-indigo-800 relative overflow-hidden">
        {/* Patrones de fondo divertidos */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-pink-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14 relative z-10 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-[0_8px_0_rgba(0,0,0,0.2)] transform -rotate-3 border-2 border-indigo-100">
                    🇪🇸
                </div>
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm mb-1">{classroom.name}</h1>
                    <div className="flex gap-2">
                        <span className="bg-indigo-500/50 px-3 py-1 rounded-full text-sm font-bold border border-indigo-400/50">Nivel Mixto</span>
                        <span className="bg-pink-500/50 px-3 py-1 rounded-full text-sm font-bold border border-pink-400/50">Curso 2024</span>
                    </div>
                </div>
              </div>
              <p className="text-indigo-100 max-w-xl text-lg font-medium opacity-90">{classroom.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {/* Botón de invitación - Estilo 3D */}
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-indigo-600 hover:bg-indigo-50 border-b-4 border-indigo-200 hover:border-indigo-300 h-14 px-8 rounded-2xl font-black text-lg transition-all active:translate-y-1 active:border-b-0">
                    <Users className="w-6 h-6 mr-2" />
                    INVITAR
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-4 border-indigo-100 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-indigo-900">¡Invita a la fiesta! 🎉</DialogTitle>
                    <DialogDescription className="text-lg">
                        Tus alumnos están esperando. Dales el código.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-6">
                    {/* Código QR */}
                    <div className="flex flex-col items-center gap-4 p-8 bg-amber-50 rounded-3xl border-4 border-amber-200 dashed">
                      <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center border-4 border-amber-200 shadow-sm p-3">
                        <QrCode className="w-full h-full text-amber-900" />
                      </div>
                      <p className="text-amber-700 font-bold text-lg animate-bounce">
                        👇 Escanea aquí 👇
                      </p>
                    </div>

                    {/* Magic Link */}
                    <div>
                      <label className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2 block pl-1">
                        Enlace mágico
                      </label>
                      <div className="flex gap-3">
                        <Input
                          value={inviteLink}
                          readOnly
                          className="flex-1 text-base bg-indigo-50 border-2 border-indigo-100 rounded-xl h-12 font-medium text-indigo-600 focus:ring-0 focus:border-indigo-400"
                        />
                        <Button
                          onClick={handleCopyInviteLink}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-6 font-bold border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"
                        >
                          COPIAR
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Botón de crear tarea con IA - Estilo 3D Highlight */}
              <Dialog open={showAITaskDialog} onOpenChange={(open) => {
                  setShowAITaskDialog(open);
                  if (!open) setHighlightedLevel(null); 
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-400 text-amber-900 hover:bg-amber-500 border-b-4 border-amber-700 h-14 px-8 rounded-2xl font-black text-lg transition-all active:translate-y-1 active:border-b-0 shadow-xl shadow-amber-900/20">
                    <Sparkles className="w-6 h-6 mr-2" />
                    CREAR TAREA IA
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg border-4 border-amber-200 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-amber-900">✨ Magia IA</DialogTitle>
                    <DialogDescription className="font-medium text-amber-700/70">
                        Vamos a crear algo increíble para tus alumnos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-8 py-6">
                    
                    {/* 1. Selector de Nivel */}
                    <div>
                        <label className="text-base font-black text-slate-700 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-black border-2 border-indigo-200">1</div>
                            Nivel de Dificultad
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => {
                                        setAiLevel(level);
                                        setHighlightedLevel(level);
                                    }}
                                    className={`h-12 rounded-xl text-sm font-black border-b-4 transition-all active:border-b-0 active:translate-y-1 ${
                                        aiLevel === level 
                                        ? 'bg-indigo-500 text-white border-indigo-700' 
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Selector de Vibe */}
                    <div>
                        <label className="text-base font-black text-slate-700 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-black border-2 border-indigo-200">2</div>
                            El Vibe
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                             <button
                                onClick={() => setAiVibe('culture')}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-b-4 transition-all active:border-b-2 active:translate-y-[2px] ${aiVibe === 'culture' ? 'bg-pink-100 border-pink-400 text-pink-700' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                             >
                                 <span className="text-2xl mb-1">💃</span>
                                 <span className="text-sm font-black">Fiesta</span>
                             </button>
                             <button
                                onClick={() => setAiVibe('business')}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-b-4 transition-all active:border-b-2 active:translate-y-[2px] ${aiVibe === 'business' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                             >
                                 <span className="text-2xl mb-1">💼</span>
                                 <span className="text-sm font-black">Negocios</span>
                             </button>
                             <button
                                onClick={() => setAiVibe('travel')}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-b-4 transition-all active:border-b-2 active:translate-y-[2px] ${aiVibe === 'travel' ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                             >
                                 <span className="text-2xl mb-1">✈️</span>
                                 <span className="text-sm font-black">Viajes</span>
                             </button>
                        </div>
                    </div>

                    {/* 3. Prompt */}
                    <div>
                      <label className="text-base font-black text-slate-700 mb-4 block flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-black border-2 border-indigo-200">3</div>
                        Tu toque personal
                      </label>
                      <Textarea
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="Escribe aquí qué quieres que aprendan hoy..."
                        className="min-h-[120px] resize-none border-2 border-slate-200 focus:border-amber-400 focus:ring-0 rounded-2xl bg-white p-4 text-lg font-medium placeholder:text-slate-300"
                      />
                    </div>

                    <Button
                      onClick={handleGenerateTask}
                      disabled={!aiTopic.trim()}
                      className="w-full bg-amber-400 hover:bg-amber-500 text-amber-900 h-14 rounded-2xl font-black text-xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all"
                    >
                      <Sparkles className="w-6 h-6 mr-2" />
                      ¡GENERAR!
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Estadísticas del aula - TARJETAS FLOTANTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 translate-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_0_rgba(59,130,246,0.1)] border-2 border-blue-100 hover:translate-y-[-4px] transition-transform cursor-default">
              <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-blue-100 rounded-2xl text-blue-500">
                    <Users className="w-8 h-8" />
                </div>
                 <span className="text-xs font-black text-blue-300 uppercase tracking-wider">TOTAL</span>
              </div>
              <p className="text-5xl font-black text-slate-800 mb-1">{totalStudents}</p>
              <p className="text-sm font-bold text-slate-400">Alumnos felices</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_0_rgba(16,185,129,0.1)] border-2 border-emerald-100 hover:translate-y-[-4px] transition-transform cursor-default">
              <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-500">
                    <BookOpen className="w-8 h-8" />
                </div>
                 <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">AHORA</span>
              </div>
              <p className="text-5xl font-black text-slate-800 mb-1">{activeTasks}</p>
              <p className="text-sm font-bold text-slate-400">Misiones activas</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_0_rgba(245,158,11,0.1)] border-2 border-amber-100 hover:translate-y-[-4px] transition-transform cursor-default">
              <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-amber-100 rounded-2xl text-amber-500">
                    <Target className="w-8 h-8" />
                </div>
                 <span className="text-xs font-black text-amber-300 uppercase tracking-wider">SCORE</span>
              </div>
              <p className="text-5xl font-black text-slate-800 mb-1">{averageClassGrade.toFixed(1)}</p>
              <p className="text-sm font-bold text-slate-400">Nota media</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_0_rgba(168,85,247,0.1)] border-2 border-purple-100 hover:translate-y-[-4px] transition-transform cursor-default">
              <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-purple-100 rounded-2xl text-purple-500">
                    <Sparkles className="w-8 h-8" />
                </div>
                 <span className="text-xs font-black text-purple-300 uppercase tracking-wider">ÉXITO</span>
              </div>
              <p className="text-5xl font-black text-slate-800 mb-1">{completionRate.toFixed(0)}%</p>
              <p className="text-sm font-bold text-slate-400">Tasa completada</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de estudiantes */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
              <div className="w-3 h-12 bg-amber-400 rounded-full"></div>
              <h2 className="text-3xl font-black text-slate-800">
                {viewMode === 'students' ? 'Tu Clase' : 'Repositorio de Tareas'}
              </h2>
              <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-xl text-sm font-bold">
                {viewMode === 'students' ? students.length : tasks.length}
              </span>
          </div>
          {highlightedLevel && viewMode === 'students' && (
              <div className="bg-amber-100 text-amber-900 px-6 py-3 rounded-2xl text-lg font-bold animate-pulse flex items-center gap-3 border-2 border-amber-200 shadow-[0_4px_0_rgba(251,191,36,0.5)]">
                  <span className="text-2xl">✨</span>
                  Alumnos ideales para Nivel {highlightedLevel}
              </div>
          )}
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'students' ? 'tasks' : 'students')}
            className="bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 w-full sm:w-auto font-bold h-12 rounded-xl"
          >
            {viewMode === 'students' ? (
              <>
                <BookOpen className="w-5 h-5 mr-2" />
                Ver Misiones
              </>
            ) : (
              <>
                <Users className="w-5 h-5 mr-2" />
                Ver Estudiantes
              </>
            )}
          </Button>
        </div>

        {viewMode === 'students' && students.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-200 mx-auto max-w-2xl">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                😴
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">¡Está muy tranquilo aquí!</h3>
            <p className="text-slate-500 mb-8 text-lg font-medium">
              Invita a tus estudiantes para que empiece la fiesta.
            </p>
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-8 rounded-2xl font-bold text-lg shadow-lg"
            >
              <Users className="w-6 h-6 mr-2" />
              Invitar Estudiantes
            </Button>
          </div>
        ) : null}

        {viewMode === 'students' && students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {students.map((student) => {
              // Logic to dim cards if level doesn't match
              let isDimmed = false;
              if (highlightedLevel) {
                  const range = getLevelRange(highlightedLevel);
                  if (student.level < range[0] || student.level > range[1]) {
                      isDimmed = true;
                  }
              }

              return (
                <div key={student.id} className={`transition-all duration-500 ${isDimmed ? 'opacity-20 grayscale blur-sm scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                    <StudentCard
                        student={student}
                        onClick={() => onSelectStudent(student.id)}
                    />
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'tasks' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {tasks.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                    📚
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Sin tareas aún</h3>
                <p className="text-slate-500 text-lg font-medium">
                  Crea tu primera tarea con el botón "CREAR TAREA IA"
                </p>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="bg-white p-6 rounded-2xl border-2 border-slate-100 flex justify-between items-center shadow-sm hover:border-indigo-200 transition-all">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{task.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1">{task.description}</p>
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded mt-2 inline-block">
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => onDeleteTask(task.id)}
                    className="text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};