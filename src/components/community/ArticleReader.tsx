import React, { useState, useEffect } from 'react';
import { X, Send, MessageCircle, Heart, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { addCommunityComment, getPostComments, toggleCommunityLike, deleteMoodlePost } from '../../lib/moodle';
import { toast } from 'sonner@2.0.3';
import { cn } from '../../lib/utils';

// INTERFAZ CORRECTA: Recibimos el usuario completo para firmar
export const ArticleReader: React.FC<{ 
  material: any, 
  currentUser: any, // Objeto { id, name, avatar... }
  onClose: () => void,
  onLikeUpdate?: () => void
}> = ({ material, currentUser, onClose, onLikeUpdate }) => {
  const [comment, setComment] = useState('');
  const [commentsList, setCommentsList] = useState<any[]>([]);
  
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [loading, setLoading] = useState(true);

  // Aseguramos que tenemos un ID válido para comparar
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

  const handleSend = async () => {
    if (!comment.trim()) return;
    
    // ✅ ENVIAMOS EL USUARIO REAL PARA LA FIRMA
    const success = await addCommunityComment(
        material.discussionId, 
        comment, 
        { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar_url }
    );

    if (success) {
      toast.success("💬 Comentario enviado");
      setComment('');
      loadComments();
    } else {
      toast.error("❌ Error al comentar");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("¿Borrar este comentario?")) return;
    const success = await deleteMoodlePost(commentId);
    if (success) {
      toast.success("🗑️ Eliminado");
      loadComments();
    } else {
      toast.error("Error al borrar");
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
      toast.error("Error al guardar like");
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
             
             {/* Botón Like */}
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
          
          <div className="flex gap-3 mb-8">
            <div className="relative flex-1">
                <Input 
                    value={comment} 
                    onChange={e => setComment(e.target.value)} 
                    placeholder="Escribe tu opinión..." 
                    className="w-full h-14 rounded-2xl pl-5 pr-14 bg-white border-2 border-slate-200 focus:border-indigo-500 text-lg shadow-sm" 
                    onKeyDown={e => e.key === 'Enter' && handleSend()} 
                />
                <button 
                    onClick={handleSend} 
                    disabled={!comment.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
          </div>

          <div className="space-y-4">
            {commentsList.map(c => {
              // ✅ LOG: Verificamos quién es quién en la consola
              const commentUserId = String(c.userId);
              const myId = String(currentUserId);
              const isMine = commentUserId === myId;
              
              // console.log(`Comentario ${c.id}: AutorID=${commentUserId} vs MiID=${myId} -> Es mío? ${isMine}`);

              return (
                <div key={c.id} className={`p-5 rounded-2xl shadow-sm border transition-all ${isMine ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 flex-1">
                          <img src={c.avatar || 'https://ui-avatars.com/api/?name=U&background=94a3b8&color=fff'} className="w-10 h-10 rounded-full flex-shrink-0 shadow-sm border border-white" alt={c.author} />
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="font-black text-slate-800 text-sm">{c.author}</span>
                                  {isMine && <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">TÚ</span>}
                                  <span className="text-xs text-slate-400 font-medium">• {new Date(c.date).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap">{c.content}</p>
                          </div>
                      </div>
                      
                      {/* ✅ BOTÓN BORRAR SIEMPRE VISIBLE SI ES MÍO */}
                      {isMine && (
                          <button 
                            onClick={() => handleDeleteComment(c.id)} 
                            className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                            title="Borrar comentario"
                          >
                              <Trash2 className="w-5 h-5" />
                          </button>
                      )}
                  </div>
                </div>
              );
            })}
            
            {commentsList.length === 0 && !loading && (
                <div className="text-center py-10 text-slate-400 italic">
                    Sé la primera persona en comentar 👇
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
