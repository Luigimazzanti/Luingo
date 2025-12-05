import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Mic, PlayCircle, CheckCircle2, AlertCircle, ExternalLink, Headphones } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner@2.0.3';

interface AudioTaskPlayerProps {
  task: any;
  onExit: () => void;
  onComplete: (score: number, answers: any[], audioLink?: string) => void;
}

export const AudioTaskPlayer: React.FC<AudioTaskPlayerProps> = ({ task, onExit, onComplete }) => {
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [studentLink, setStudentLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const content = task.content_data || {};
  const questions = content.questions || [];
  const teacherAudio = content.audio_url;
  const requireRecording = content.student_audio_required;

  const handleSubmit = () => {
    // 1. Validaciones
    if (requireRecording && !studentLink.trim()) {
      toast.error("⚠️ Debes adjuntar el link de tu grabación");
      return;
    }
    
    // Validar preguntas SOLO SI existen
    if (questions && questions.length > 0) {
        const unanswered = questions.filter((q: any) => !answers[q.id]);
        if (unanswered.length > 0) {
          toast.error(`⚠️ Faltan ${unanswered.length} preguntas por responder`);
          return;
        }
    }

    setIsSubmitting(true);

    // 2. Calcular Score (Solo para preguntas automáticas)
    let score = 0;
    const finalAnswers = questions.map((q: any) => {
      const studentAns = answers[q.id];
      // Simple corrección automática para choice/true_false
      const isCorrect = (q.type === 'choice' || q.type === 'true_false') 
        ? studentAns === q.correct_answer 
        : undefined; // Abiertas se corrigen manual
      
      if (isCorrect) score++;

      return {
        questionId: q.id,
        questionText: q.question_text,
        type: q.type,
        studentAnswer: studentAns,
        correctAnswer: q.correct_answer,
        isCorrect
      };
    });

    // 3. Enviar (Score, Respuestas, Link de Audio)
    onComplete(score, finalAnswers, studentLink);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* HEADER STICKY */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
            {requireRecording ? <Mic className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-sm md:text-base line-clamp-1">{task.title}</h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">Audio Misión</p>
          </div>
        </div>
        <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      {/* CONTENIDO SCROLLABLE */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6 pb-32">
          
          {/* 1. REPRODUCTOR TEACHER (Sticky en móvil si se quisiera, aquí normal destacado) */}
          {teacherAudio && (
            <div className="bg-slate-900 rounded-2xl p-4 shadow-xl text-white sticky top-2 z-10 mx-auto w-full max-w-xl border-4 border-slate-800/50">
              <div className="flex items-center gap-3 mb-3">
                <PlayCircle className="w-6 h-6 text-rose-400 animate-pulse" />
                <span className="font-bold text-sm uppercase tracking-widest text-rose-200">Audio del Profesor</span>
              </div>
              
              {teacherAudio.includes('youtube') || teacherAudio.includes('youtu.be') ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe 
                    src={teacherAudio.replace('watch?v=', 'embed/')} 
                    className="w-full h-full" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
              ) : (
                <audio controls className="w-full h-10 accent-rose-500" src={teacherAudio}>
                  Tu navegador no soporta audio.
                </audio>
              )}
            </div>
          )}

          {/* 2. INSTRUCCIONES */}
          {(task.description || task.content_data.instructions) && (
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-700 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-500" /> Instrucciones
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {task.content_data.instructions || task.description}
              </p>
            </div>
          )}

          {/* 3. PREGUNTAS (Listening) */}
          {questions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-black text-slate-400 uppercase text-xs tracking-widest ml-1">Cuestionario de Comprensión</h3>
              {questions.map((q: any, idx: number) => (
                <div key={q.id} className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
                  <div className="flex gap-3 mb-4">
                    <span className="bg-indigo-50 text-indigo-600 font-black w-6 h-6 rounded flex items-center justify-center text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <p className="font-bold text-slate-800">{q.question_text}</p>
                  </div>

                  {/* Render Tipos */}
                  {q.type === 'choice' && (
                    <div className="space-y-2">
                      {q.options?.map((opt: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setAnswers(prev => ({...prev, [q.id]: opt}))}
                          className={cn(
                            "w-full py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all text-left",
                            answers[q.id] === opt 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="flex gap-3">
                      {['Verdadero', 'Falso'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setAnswers(prev => ({...prev, [q.id]: opt}))}
                          className={cn(
                            "flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all",
                            answers[q.id] === opt 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-[1.02]" 
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === 'open' && (
                    <textarea 
                      className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm min-h-[100px]"
                      placeholder="Escribe tu respuesta aquí..."
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 4. GRABACIÓN ALUMNO (Speaking) */}
          {requireRecording && (
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-6 rounded-3xl border-2 border-rose-100 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md text-rose-500">
                  <Mic className="w-8 h-8" />
                </div>
                <h3 className="font-black text-rose-900 text-lg">Tu Turno de Hablar</h3>
                <p className="text-rose-700/80 text-sm">
                  Graba tu audio en Vocaroo (o similar) y pega el enlace aquí.
                </p>
                <a 
                  href="https://vocaroo.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline mt-2"
                >
                  Ir a Vocaroo <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <Input 
                  placeholder="https://vocaroo.com/..." 
                  className="pl-10 h-12 bg-white border-rose-200 text-rose-900 font-medium shadow-sm"
                  value={studentLink}
                  onChange={(e) => setStudentLink(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300">
                  <Mic className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER DE ACCIÓN */}
      <div className="bg-white p-4 border-t border-slate-200 shrink-0">
        <div className="max-w-2xl mx-auto">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-lg shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            {isSubmitting ? 'Enviando...' : 'Entregar Misión 🚀'}
          </Button>
        </div>
      </div>
    </div>
  );
};