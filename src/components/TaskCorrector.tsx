import React, { useState } from 'react';
import { Exercise } from '../types';
import { Button } from './ui/button';
import { ArrowLeft, Check, Play, Mic, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface TaskCorrectorProps {
  exercise: Exercise;
  studentName: string;
  onBack: () => void;
  onSaveCorrection: () => void;
}

export const TaskCorrector: React.FC<TaskCorrectorProps> = ({ exercise, studentName, onBack, onSaveCorrection }) => {
  const [teacherAudio, setTeacherAudio] = useState<boolean>(false);
  const [teacherComment, setTeacherComment] = useState('');
  const [bananasGiven, setBananasGiven] = useState(exercise.banana_reward_total);

  const handleSave = () => {
    toast.success(`Corrección enviada a ${studentName} (+${bananasGiven} Bananas)`);
    onSaveCorrection();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="text-slate-500 hover:bg-slate-100 rounded-xl -ml-2">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a Clase
        </Button>
        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full border border-emerald-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-black uppercase tracking-wide">Revisando a {studentName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo: El Ejercicio Resuelto */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border-b-4 border-slate-200 shadow-sm">
                <h2 className="text-2xl font-black text-slate-800 mb-1">{exercise.title}</h2>
                <p className="text-slate-500 font-medium mb-6">Nivel {exercise.level} • Autocorrección: 4/5 Aciertos</p>

                <div className="space-y-4">
                    {exercise.questions.map((q, i) => (
                        <div key={q.id} className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-100">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-bold text-slate-700 text-lg">
                                    <span className="text-slate-400 mr-2">#{i+1}</span>
                                    {q.question_text.replace('[...]', '_____')}
                                </h4>
                                {i === 3 ? ( // Simulamos un fallo en la pregunta 4
                                     <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-lg text-xs font-black uppercase">Fallo</span>
                                ) : (
                                     <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-black uppercase">Correcto</span>
                                )}
                            </div>
                            
                            {/* Respuesta Simulada */}
                            <div className="pl-8">
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Respuesta de {studentName}:</p>
                                <div className={`p-3 rounded-xl border-l-4 font-medium ${i===3 ? 'bg-rose-50 border-rose-400 text-rose-900' : 'bg-white border-emerald-400 text-slate-800'}`}>
                                    {i === 3 ? 'Bakery' : q.correct_answer || 'Respuesta correcta'}
                                </div>
                                {i === 3 && (
                                    <p className="mt-2 text-xs text-rose-600 font-bold">
                                        👉 La correcta era: {q.correct_answer}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Audio del Alumno (Simulado) */}
            <div className="bg-indigo-50 rounded-3xl p-6 border-b-4 border-indigo-200">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <Mic className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-indigo-900">Audio Final: "Mi fruta favorita"</h3>
                        <p className="text-indigo-600 text-sm font-medium">Grabado hoy a las 10:30 AM</p>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border-2 border-indigo-100 flex items-center gap-4 shadow-sm">
                     <button className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-1" />
                     </button>
                     <div className="flex-1">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full w-1/2 bg-indigo-400"></div>
                        </div>
                     </div>
                     <span className="font-mono text-slate-500 font-bold text-sm">0:14 / 0:28</span>
                </div>
            </div>
        </div>

        {/* Panel Derecho: Herramientas de Corrección */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 border-b-8 border-slate-200 sticky top-6">
                <h3 className="font-black text-slate-800 text-xl mb-6">Tu Evaluación</h3>
                
                <div className="space-y-6">
                    {/* 1. Bananas Reward */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Recompensa (Bananas)</label>
                        <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-2xl border-2 border-amber-100">
                            <span className="text-3xl">🍌</span>
                            <input 
                                type="number" 
                                value={bananasGiven}
                                onChange={(e) => setBananasGiven(Number(e.target.value))}
                                className="w-full bg-white border-2 border-amber-200 rounded-xl px-3 py-2 text-center font-black text-xl text-amber-700 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    {/* 2. Voice Feedback */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Feedback de Voz</label>
                        <button 
                            onClick={() => setTeacherAudio(!teacherAudio)}
                            className={`w-full py-4 rounded-2xl font-bold border-2 border-dashed transition-all flex items-center justify-center gap-2 ${teacherAudio ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-100'}`}
                        >
                            {teacherAudio ? <><div className="w-3 h-3 bg-rose-500 rounded-full"></div> Grabando...</> : <><Mic className="w-5 h-5" /> Grabar Respuesta</>}
                        </button>
                    </div>

                    {/* 3. Written Comment */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Comentario Escrito</label>
                        <textarea 
                            value={teacherComment}
                            onChange={(e) => setTeacherComment(e.target.value)}
                            placeholder="¡Muy buen trabajo! Recuerda pronunciar la 'R'..."
                            className="w-full h-32 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-400 focus:bg-white outline-none resize-none font-medium text-slate-700"
                        />
                    </div>

                    <Button 
                        onClick={handleSave}
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-indigo-200 border-b-4 border-indigo-900 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        Guardar y Enviar
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};