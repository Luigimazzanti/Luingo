import React, { useState, useEffect } from 'react';
import { X, Send, MessageCircle, Heart, Trash2, Reply, Edit3, GraduationCap, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { addCommunityComment, getPostComments, toggleCommunityLike, deleteMoodlePost, editCommunityComment } from '../../lib/moodle';
import { toast } from 'sonner@2.0.3';
import { cn } from '../../lib/utils';

// --- COMPONENTE RECURSIVO PARA CADA COMENTARIO ---
const CommentItem: React.FC<{
  comment: any;
  allComments: any[];
  currentUserId: string;
  onReply: (parentId: string, text: string) => void;
  onEdit: (commentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
  depth?: number;
}> = ({ comment, allComments, currentUserId, onReply, onEdit, onDelete, depth = 0 }) => {
  
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const isMine = String(comment.userId) === String(currentUserId);
  const isTeacher = comment.role === 'teacher';
  
  // Buscar respuestas directas
  const replies = allComments.filter(c => String(c.parentId) === String(comment.id));

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText);
    setIsReplying(false);
    setReplyText('');
  };

  const handleSubmitEdit = () => {
    if (!editText.trim()) return;
    onEdit(comment.id, editText);
    setIsEditing(false);
  };

  return (
    <div className={cn("group", depth > 0 && "mt-3")}>
      <div className={cn(
        "p-4 rounded-2xl border transition-all relative",
        isMine ? "bg-indigo-50/40 border-indigo-100" : "bg-white border-slate-100",
        isTeacher && !isMine && "bg-amber-50/40 border-amber-100",
        depth > 0 && "ml-4 md:ml-8 border-l-4 border-l-slate-200"
      )}>
        <div className="flex gap-3">
          <img 
            src={comment.avatar || `https://ui-avatars.com/api/?name=${comment.author}&background=random`} 
            className="w-8 h-8 rounded-full shadow-sm object-cover border border-white" 
            alt={comment.author} 
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="font-bold text-slate-800 text-sm">{comment.author}</span>
              {isTeacher && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 border border-amber-200"><GraduationCap className="w-3 h-3"/> PROFESOR</span>}
              {isMine && <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">TÚ</span>}
              <span className="text-[10px] text-slate-400 font-medium">• {new Date(comment.date).toLocaleDateString()}</span>
            </div>

            {isEditing ? (
              <div className="mt-2 animate-in fade-in zoom-in-95">
                <Textarea value={editText} onChange={e => setEditText(e.target.value)} className="mb-2 bg-white min-h-[80px] text-sm" autoFocus />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSubmitEdit} className="h-7 text-xs bg-green-600 hover:bg-green-700">Guardar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-xs text-slate-500">Cancelar</Button>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            )}

            <div className="flex gap-3 mt-3 items-center">
              {replies.length < 10 && depth < 3 && (
                <button onClick={() => setIsReplying(!isReplying)} className="text-slate-400 hover:text-indigo-600 text-xs font-bold flex items-center gap-1 transition-colors">
                  <Reply className="w-3 h-3" /> Responder
                </button>
              )}
              {isMine && (
                <>
                  <button onClick={() => { setIsEditing(true); setEditText(comment.content); }} className="text-slate-400 hover:text-blue-600 text-xs font-bold flex items-center gap-1 transition-colors"><Edit3 className="w-3 h-3" /> Editar</button>
                  <button onClick={() => onDelete(comment.id)} className="text-slate-400 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"><Trash2 className="w-3 h-3" /> Borrar</button>
                </>
              )}
            </div>

            {isReplying && (
              <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-1">
                <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={`Respondiendo a ${comment.author}...`} className="h-9 text-sm bg-slate-50 border-slate-200" autoFocus onKeyDown={e => e.key === 'Enter' && handleSubmitReply()}/>
                <Button size="sm" onClick={handleSubmitReply} className="h-9 w-9 p-0 bg-indigo-600 hover:bg-indigo-700"><Send className="w-3 h-3"/></Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="w-full">
          {replies.map(reply => (
            <CommentItem 
              key={reply.id} comment={reply} allComments={allComments} currentUserId={currentUserId}
              onReply={onReply} onEdit={onEdit} onDelete={onDelete} depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const ArticleReader: React.FC<{ 
  material: any, 
  currentUser: any, 
  onClose: () => void,
  onLikeUpdate?: () => void
}> = ({ material, currentUser, onClose, onLikeUpdate }) => {
  const [comment, setComment] = useState('');
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // ✅ ESTADO PARA PAGINACIÓN ("VER MÁS")
  const [visibleCount, setVisibleCount] = useState(5);

  const currentUserId = currentUser?.id ? String(currentUser.id) : '0';

  useEffect(() => {
    if (material) {
      const likes = Array.isArray(material.likes) ? material.likes : [];
      setLikesCount(likes.length);
      setIsLiked(likes.includes(currentUserId));
    }
  }, [material, currentUserId]);

  const loadComments = async () => {
    const comments = await getPostComments(material.discussionId);
    setCommentsList(comments);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadComments();
  }, [material.discussionId]);

  const handleSend = async (parentId?: string, text?: string) => {
    const msg = text || comment;
    if (!msg.trim()) return;

    if (!parentId && commentsList.length >= 25) {
        toast.error("Límite de comentarios alcanzado (25).");
        return;
    }

    const success = await addCommunityComment(
        material.discussionId, 
        msg, 
        { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar_url, role: currentUser.role },
        parentId
    );

    if (success) {
      toast.success(parentId ? "Respuesta enviada" : "Comentario publicado");
      if (!parentId) setComment('');
      loadComments();
    } else {
      toast.error("Error al enviar");
    }
  };

  const handleEdit = async (commentId: string, newText: string) => {
      const success = await editCommunityComment(
          commentId, 
          newText, 
          { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar_url, role: currentUser.role }
      );
      if (success) {
          toast.success("Actualizado");
          loadComments();
      } else {
          toast.error("Error al editar");
      }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("¿Eliminar definitivamente?")) return;
    const success = await deleteMoodlePost(commentId);
    if (success) {
      toast.success("Eliminado");
      loadComments();
    } else {
      toast.error("Error al eliminar");
    }
  };

  const handleLike = async () => {
    if (isLiking) return; 
    setIsLiking(true);
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    
    const success = await toggleCommunityLike(material, currentUserId);
    if (success) onLikeUpdate?.();
    else {
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
    setIsLiking(false);
  };

  const renderBlock = (b: any, i: number) => {
      if(!b.content) return null;
      if(b.type==='text') return <p key={i} className="mb-4 text-slate-700 text-lg leading-relaxed">{b.content}</p>;
      if(b.type==='image') return <img key={i} src={b.content} className="w-full rounded-xl mb-4 shadow-sm border" alt="Contenido" />;
      if(b.type==='video') {
          const vId = b.content.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^&?]*)/)?.[1];
          return vId ? <div key={i} className="aspect-video rounded-xl overflow-hidden mb-4 shadow-lg"><iframe src={`https://www.youtube.com/embed/${vId}`} className="w-full h-full" allowFullScreen /></div> : null;
      }
      return null;
  };

  // Filtrar comentarios raíz
  const rootComments = commentsList.filter(c => !commentsList.some(other => String(other.id) === String(c.parentId)));
  
  // ✅ LOGICA DE CORTE: Solo mostramos los visibles
  const visibleRootComments = rootComments.slice(0, visibleCount);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white sticky top-0 z-10 shadow-md">
            <h2 className="font-bold text-xl truncate flex-1">{material.title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>
        
        {/* Contenido */}
        <div className="p-8 bg-white min-h-[200px]">
             {material.blocks?.length > 0 ? material.blocks.map((b:any,i:number)=>renderBlock(b,i)) : <div className="prose max-w-none" dangerouslySetInnerHTML={{__html: material.content}}/>}
             
             <div className="mt-8 flex gap-4">
                 <button onClick={handleLike} disabled={isLiking} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-sm active:scale-95 ${isLiked ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}>
                     <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
                     {likesCount} Me gusta
                 </button>
             </div>
        </div>

        {/* Comentarios */}
        <div className="bg-slate-50 p-8 border-t border-slate-200">
          <h3 className="font-black text-slate-800 mb-6 flex gap-2 items-center text-xl">
              <MessageCircle className="w-6 h-6 text-indigo-600" /> 
              Comentarios ({commentsList.length})
          </h3>
          
          {commentsList.length < 25 ? (
            <div className="flex gap-3 mb-8">
                <div className="relative flex-1">
                    <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Escribe tu opinión..." className="w-full h-14 rounded-2xl pl-5 pr-14 bg-white border-2 border-slate-200 focus:border-indigo-500 text-lg shadow-sm" onKeyDown={e => e.key === 'Enter' && handleSend()} />
                    <button onClick={() => handleSend()} disabled={!comment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md"><Send className="w-5 h-5" /></button>
                </div>
            </div>
          ) : <div className="p-4 bg-amber-50 text-amber-800 rounded-xl mb-6 text-center font-bold">🔒 Debate cerrado (Máx. comentarios alcanzado)</div>}

          <div className="space-y-6">
            {visibleRootComments.map(c => (
              <CommentItem 
                key={c.id} 
                comment={c} 
                allComments={commentsList} 
                currentUserId={currentUserId}
                onReply={(pid, txt) => handleSend(pid, txt)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            
            {/* ✅ BOTÓN VER MÁS */}
            {rootComments.length > visibleCount && (
                <div className="text-center pt-4 border-t border-slate-200 mt-6">
                    <p className="text-xs text-slate-400 mb-2">Viendo {visibleCount} de {rootComments.length} hilos</p>
                    <Button variant="outline" onClick={() => setVisibleCount(prev => prev + 5)} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-xl">
                        <ChevronDown className="w-4 h-4 mr-2" /> Ver más comentarios
                    </Button>
                </div>
            )}
            
            {commentsList.length === 0 && !loading && (
                <div className="text-center py-10 text-slate-400 italic">Sé la primera persona en comentar 👇</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
