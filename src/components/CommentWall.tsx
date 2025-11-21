import React, { useState } from 'react';
import { MessageCircle, Send, Edit3, Check, X, AlertCircle, Mic, StopCircle, Play, Pause, Smile } from 'lucide-react';
import { Comment, User, Correction } from '../types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar } from './ui/avatar';

interface CommentWallProps {
  materialId: string;
  comments: Comment[];
  currentUser: User;
  onAddComment: (content: string, parentId?: string) => void;
  onCorrectComment: (commentId: string, corrections: Correction[]) => void;
}

/**
 * COMPONENTE MURO DE COMENTARIOS "PLAYFUL"
 */
export const CommentWall: React.FC<CommentWallProps> = ({
  materialId,
  comments,
  currentUser,
  onAddComment,
  onCorrectComment,
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // Estados Corrección
  const [correctionMode, setCorrectionMode] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [correctionInput, setCorrectionInput] = useState('');
  const [correctionType, setCorrectionType] = useState<'spelling' | 'grammar' | 'vocabulary'>('grammar');

  // Estados Audio
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const isTeacher = currentUser.role === 'teacher';

  // Filtrar comentarios principales
  const mainComments = comments.filter((c) => !c.parent_id);

  const getReplies = (commentId: string): Comment[] => {
    return comments.filter((c) => c.parent_id === commentId);
  };

  // --- Lógica de Comentarios ---

  const handleSubmitComment = () => {
    if (newComment.trim() || audioBlob) {
        const content = audioBlob ? `${newComment} [VOICE NOTE]` : newComment;
        onAddComment(content, undefined);
        setNewComment('');
        setAudioBlob(null);
    }
  };

  const handleSubmitReply = (parentId: string) => {
    if (replyContent.trim()) {
      onAddComment(replyContent, parentId);
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  // --- Lógica de Audio (Simulada) ---
  const toggleRecording = () => {
    if (isRecording) {
        // Stop Recording
        setIsRecording(false);
        setAudioBlob(new Blob([""], { type: "audio/mp3" })); 
    } else {
        setIsRecording(true);
    }
  };

  // --- Lógica de Corrección ---

  const enterCorrectionMode = (commentId: string) => {
    setCorrectionMode(commentId);
    setCorrections([]);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
    }
  };

  const addCorrection = (originalText: string, start: number, end: number) => {
    if (correctionInput.trim() && originalText) {
      const newCorrection: Correction = {
        start,
        end,
        original: originalText,
        correction: correctionInput,
        type: correctionType, 
      };
      setCorrections([...corrections, newCorrection]);
      setCorrectionInput('');
      setSelectedText('');
    }
  };

  const saveCorrections = (commentId: string) => {
    if (corrections.length > 0) {
      onCorrectComment(commentId, corrections);
      setCorrectionMode(null);
      setCorrections([]);
    }
  };

  const cancelCorrection = () => {
    setCorrectionMode(null);
    setCorrections([]);
    setCorrectionInput('');
    setSelectedText('');
  };

  // --- Renderizado ---

  const renderCommentContent = (comment: Comment) => {
    const isVoiceNote = comment.content.includes('[VOICE NOTE]');
    const displayContent = isVoiceNote ? comment.content.replace('[VOICE NOTE]', '') : comment.content;

    if (!comment.is_corrected || !comment.corrections || comment.corrections.length === 0) {
      return (
        <div className="mt-2">
             {displayContent && <p className="text-slate-700 font-medium text-lg leading-relaxed">{displayContent}</p>}
             {isVoiceNote && (
                 <div className="mt-3 flex items-center gap-3 bg-amber-50 p-3 rounded-2xl border-2 border-amber-100 w-fit hover:scale-105 transition-transform cursor-pointer group">
                     <button className="p-3 bg-amber-400 rounded-full text-white shadow-sm group-hover:bg-amber-500 transition-colors">
                         <Play className="w-4 h-4 fill-current ml-0.5" />
                     </button>
                     <div>
                        <div className="h-2 w-32 bg-amber-200 rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-amber-500 rounded-full"></div>
                        </div>
                        <span className="text-[10px] text-amber-700 font-black uppercase tracking-wider mt-1 block">Nota de Voz • 0:14</span>
                     </div>
                 </div>
             )}
        </div>
      );
    }

    // Aplicar correcciones (Highlighters)
    let content = displayContent;
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    const sortedCorrections = [...comment.corrections].sort((a, b) => a.start - b.start);

    sortedCorrections.forEach((correction, idx) => {
      if (lastIndex < correction.start) {
        parts.push(
          <span key={`text-${idx}`}>{content.substring(lastIndex, correction.start)}</span>
        );
      }

      // Colores de corrección "Marker Style"
      let highlightClass = "";
      let textClass = "";
      let label = "";
      
      if (correction.type === 'spelling') {
          highlightClass = "bg-rose-100 decoration-rose-400 decoration-wavy underline underline-offset-4";
          textClass = "text-rose-800 font-bold";
          label = "Ortografía";
      } else if (correction.type === 'vocabulary') {
          highlightClass = "bg-emerald-100 decoration-emerald-400 decoration-wavy underline underline-offset-4";
          textClass = "text-emerald-800 font-bold";
          label = "Vocabulario";
      } else {
          highlightClass = "bg-sky-100 decoration-sky-400 decoration-wavy underline underline-offset-4";
          textClass = "text-sky-800 font-bold";
          label = "Gramática";
      }

      parts.push(
        <span
          key={`correction-${idx}`}
          className={`relative inline-block group cursor-help ${highlightClass} px-1 rounded mx-0.5 transition-all hover:scale-105`}
        >
          <span className={textClass}>{correction.correction}</span>
          
          {/* Tooltip Popover Style */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block bg-slate-900 text-white p-3 rounded-2xl text-sm z-10 shadow-2xl min-w-[140px] animate-in zoom-in-95">
            <div className="font-black mb-1 border-b border-slate-700 pb-1 text-xs uppercase tracking-wider flex items-center gap-1">
                {correction.type === 'spelling' ? '🔴' : correction.type === 'vocabulary' ? '🟢' : '🔵'} {label}
            </div>
            <div className="flex flex-col gap-1 mt-1">
                <span className="line-through opacity-50 text-xs">{correction.original}</span>
                <span className="text-emerald-300 font-bold text-base">➜ {correction.correction}</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45"></div>
          </span>
        </span>
      );

      lastIndex = correction.end;
    });

    if (lastIndex < content.length) {
      parts.push(<span key="text-end">{content.substring(lastIndex)}</span>);
    }

    return (
        <div className="mt-2">
            <div className="leading-loose text-lg text-slate-700">{parts}</div>
            {isVoiceNote && (
                  <div className="mt-3 flex items-center gap-3 bg-amber-50 p-3 rounded-2xl border-2 border-amber-100 w-fit hover:scale-105 transition-transform cursor-pointer group">
                     <button className="p-3 bg-amber-400 rounded-full text-white shadow-sm group-hover:bg-amber-500 transition-colors">
                         <Play className="w-4 h-4 fill-current ml-0.5" />
                     </button>
                     <div>
                        <div className="h-2 w-32 bg-amber-200 rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-amber-500 rounded-full"></div>
                        </div>
                        <span className="text-[10px] text-amber-700 font-black uppercase tracking-wider mt-1 block">Nota de Voz • 0:14</span>
                     </div>
                 </div>
             )}
        </div>
    );
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const replies = getReplies(comment.id);
    const isInCorrectionMode = correctionMode === comment.id;
    const canCorrect = isTeacher && comment.user.role === 'student' && !isInCorrectionMode;

    return (
      <div key={comment.id} className={`animate-in fade-in slide-in-from-bottom-2 duration-500 ${isReply ? 'ml-12 mt-4 relative' : 'mt-6'}`}>
        {isReply && (
            <div className="absolute -left-6 top-0 bottom-6 w-4 border-l-2 border-b-2 border-slate-200 rounded-bl-3xl"></div>
        )}
        
        <div className={`bg-white rounded-3xl p-5 shadow-sm border-b-4 border-slate-100 transition-all hover:shadow-md hover:-translate-y-1 ${isInCorrectionMode ? 'ring-4 ring-amber-200 border-amber-300' : ''}`}>
          {/* Cabecera */}
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-slate-100 shadow-sm">
              <img
                src={comment.user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt={comment.user.name}
                className="w-full h-full object-cover"
              />
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-black text-slate-800">{comment.user.name}</h4>
                  <p className="text-xs text-slate-400 font-bold">
                    {new Date(comment.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {canCorrect && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => enterCorrectionMode(comment.id)}
                    className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl px-4 font-bold h-8 border-b-2 border-amber-200 active:border-b-0 active:translate-y-[1px]"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Corregir
                  </Button>
                )}
              </div>

              {/* Contenido */}
              <div className="mt-3" onMouseUp={() => isInCorrectionMode && handleTextSelection()}>
                {renderCommentContent(comment)}
              </div>

              {/* Panel de Corrección Activo */}
              {isInCorrectionMode && (
                <div className="mt-4 p-5 bg-amber-50 rounded-2xl border-2 border-amber-200 shadow-sm animate-in zoom-in-95">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-amber-200 rounded-lg text-amber-700">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                      Modo Corrección: Selecciona texto
                    </p>
                  </div>
                  
                  {/* Toolbar de Colores */}
                  <div className="flex gap-2 mb-4 p-1 bg-white rounded-xl border border-amber-100 w-fit shadow-sm">
                      <button 
                        onClick={() => setCorrectionType('spelling')}
                        className={`px-4 py-2 rounded-lg text-xs font-black border-b-2 transition-all flex items-center gap-2 ${correctionType === 'spelling' ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-white text-slate-400 border-transparent hover:bg-slate-50'}`}
                      >
                          <div className={`w-2 h-2 rounded-full ${correctionType === 'spelling' ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                          Ortografía
                      </button>
                      <button 
                        onClick={() => setCorrectionType('grammar')}
                        className={`px-4 py-2 rounded-lg text-xs font-black border-b-2 transition-all flex items-center gap-2 ${correctionType === 'grammar' ? 'bg-sky-100 text-sky-700 border-sky-300' : 'bg-white text-slate-400 border-transparent hover:bg-slate-50'}`}
                      >
                          <div className={`w-2 h-2 rounded-full ${correctionType === 'grammar' ? 'bg-sky-500' : 'bg-slate-300'}`}></div>
                          Gramática
                      </button>
                      <button 
                        onClick={() => setCorrectionType('vocabulary')}
                        className={`px-4 py-2 rounded-lg text-xs font-black border-b-2 transition-all flex items-center gap-2 ${correctionType === 'vocabulary' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white text-slate-400 border-transparent hover:bg-slate-50'}`}
                      >
                          <div className={`w-2 h-2 rounded-full ${correctionType === 'vocabulary' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                          Vocabulario
                      </button>
                  </div>

                  {selectedText && (
                    <div className="bg-white p-4 rounded-xl border-2 border-amber-100 mb-4 shadow-sm">
                      <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-widest font-black">Texto a corregir</div>
                      <div className="text-lg font-bold text-slate-800 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100 decoration-wavy underline decoration-amber-300">"{selectedText}"</div>
                      <div className="flex gap-2">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Escribe la corrección..."
                            value={correctionInput}
                            onChange={(e) => setCorrectionInput(e.target.value)}
                            className="flex-1 px-4 py-3 text-base font-medium border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-0 focus:border-amber-400 transition-colors"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const start = comment.content.indexOf(selectedText);
                                const end = start + selectedText.length;
                                addCorrection(selectedText, start, end);
                              }
                            }}
                          />
                          <Button 
                            size="lg" 
                            onClick={() => {
                                const start = comment.content.indexOf(selectedText);
                                const end = start + selectedText.length;
                                addCorrection(selectedText, start, end);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold border-b-4 border-amber-700 active:border-b-0 active:translate-y-1"
                          >
                              Aplicar
                          </Button>
                      </div>
                    </div>
                  )}

                  {corrections.length > 0 && (
                    <div className="mb-4 bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-400 mb-2 font-black uppercase tracking-wider">Cambios listos ({corrections.length})</p>
                      <div className="space-y-2">
                        {corrections.map((corr, idx) => (
                          <div key={idx} className="text-sm flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full ${corr.type === 'spelling' ? 'bg-rose-500' : corr.type === 'vocabulary' ? 'bg-emerald-500' : 'bg-sky-500'}`}></span>
                                <span className="line-through text-slate-400 font-medium">{corr.original}</span>
                                <span className="text-slate-300">➜</span>
                                <span className="font-bold text-slate-800">{corr.correction}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-3 border-t-2 border-amber-100/50 mt-2">
                    <Button
                      size="sm"
                      onClick={() => saveCorrections(comment.id)}
                      disabled={corrections.length === 0}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6 font-bold h-10 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Guardar Todo
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelCorrection}
                      className="text-slate-500 font-bold hover:bg-slate-100 rounded-xl h-10"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Botón Responder Normal */}
              {!isInCorrectionMode && (
                <div className="mt-3 flex gap-2">
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.id)}
                    className="text-xs font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Responder
                    </Button>
                    <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                    >
                    <Smile className="w-3 h-3 mr-1" />
                    Reaccionar
                    </Button>
                </div>
              )}
            </div>
          </div>

          {/* Formulario de respuesta */}
          {replyingTo === comment.id && (
            <div className="mt-4 ml-16 animate-in fade-in slide-in-from-top-2">
              <div className="relative">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Respondiendo a ${comment.user.name}...`}
                    className="min-h-[80px] text-base rounded-2xl border-2 border-indigo-100 focus:border-indigo-400 focus:ring-0 mb-3 p-4 shadow-sm"
                  />
                  <div className="absolute bottom-4 right-3 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600 rounded-xl font-bold">
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => handleSubmitReply(comment.id)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-4 font-bold shadow-md"
                    >
                        Enviar
                    </Button>
                  </div>
              </div>
            </div>
          )}
        </div>

        {replies.length > 0 && (
          <div className="mt-0">
            {replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center border-b-4 border-indigo-200 transform rotate-3 shadow-sm">
          <MessageCircle className="w-7 h-7" />
        </div>
        <div>
          <h3 className="font-black text-2xl text-slate-800">Muro de la Clase</h3>
          <p className="text-sm text-slate-500 font-bold">
            {comments.length} conversaciones activas
          </p>
        </div>
      </div>

      {/* Input Principal */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border-b-4 border-slate-100 mb-10 relative z-10 ring-4 ring-slate-50">
        <div className="flex gap-4">
          <Avatar className="w-12 h-12 rounded-2xl border-2 border-indigo-100 shadow-sm">
             <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
          </Avatar>
          <div className="flex-1">
            <div className="relative">
                <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="¿Qué quieres compartir hoy?"
                className="min-h-[100px] rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:ring-0 resize-none text-lg p-4 placeholder:text-slate-300 font-medium"
                />
                <div className="absolute top-3 right-3">
                    <Smile className="w-6 h-6 text-slate-300 hover:text-amber-400 cursor-pointer transition-colors" />
                </div>
            </div>
            
            {/* Voice Note Preview */}
            {audioBlob && (
                <div className="mt-3 flex items-center justify-between bg-rose-50 p-3 rounded-2xl border-2 border-rose-100 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-200 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-rose-600 rounded-full animate-ping"></div>
                        </div>
                        <div>
                             <span className="text-sm font-bold text-rose-900 block">Nota de voz lista</span>
                             <span className="text-xs font-medium text-rose-600">0:14 segundos</span>
                        </div>
                    </div>
                    <button onClick={() => setAudioBlob(null)} className="p-2 hover:bg-rose-200 rounded-xl text-rose-400 hover:text-rose-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                  {/* Mic Button - Big and Fun */}
                  <button 
                    onClick={toggleRecording}
                    className={`h-12 px-4 rounded-xl transition-all flex items-center gap-2 font-bold border-b-4 active:border-b-0 active:translate-y-1 ${isRecording ? 'bg-rose-500 text-white border-rose-700 shadow-lg shadow-rose-200 animate-pulse' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                    title="Grabar audio"
                  >
                      {isRecording ? (
                          <>
                            <StopCircle className="w-5 h-5" />
                            <span className="hidden sm:inline">Detener</span>
                          </>
                      ) : (
                          <>
                            <Mic className="w-5 h-5" />
                            <span className="hidden sm:inline">Grabar Voz</span>
                          </>
                      )}
                  </button>
              </div>

              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() && !audioBlob}
                className="bg-amber-400 hover:bg-amber-500 text-amber-900 rounded-xl px-8 h-12 font-black text-base shadow-lg shadow-amber-100 border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all"
              >
                <Send className="w-5 h-5 mr-2" />
                PUBLICAR
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-2 pb-10">
        {mainComments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
             <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <MessageCircle className="w-10 h-10 text-slate-300" />
             </div>
             <h3 className="text-2xl font-black text-slate-700 mb-2">¡Silencio total!</h3>
             <p className="text-slate-400 font-medium text-lg max-w-xs mx-auto">Sé el primero en decir algo interesante.</p>
          </div>
        ) : (
          mainComments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
};