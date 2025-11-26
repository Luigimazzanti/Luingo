import React, { useState } from 'react';
import { X, Send, MessageCircle, Calendar, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { addCommunityComment } from '../../lib/moodle';
import { toast } from 'sonner@2.0.3';

export const ArticleReader: React.FC<{ material: any, onClose: () => void }> = ({ material, onClose }) => {
  const [comment, setComment] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!comment.trim()) {
      toast.error("Escribe algo primero");
      return;
    }
    
    setIsSending(true);
    const success = await addCommunityComment(material.postId, comment);
    
    if (success) { 
      toast.success("💬 Comentario enviado"); 
      setComment(''); 
    } else { 
      toast.error("❌ Error al enviar"); 
    }
    
    setIsSending(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col backdrop-blur-sm">
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-800 line-clamp-1">
            {material.title}
          </h1>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-slate-100 ml-4 shrink-0"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto bg-white min-h-full shadow-sm border-x border-slate-100">
          
          {/* Contenido Principal */}
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
              <img 
                src={material.avatar || 'https://ui-avatars.com/api/?name=Profesor&background=6366f1&color=fff'} 
                className="w-14 h-14 rounded-full bg-slate-200 border-4 border-white shadow-sm" 
                alt={material.author}
              />
              <div>
                <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  {material.author}
                </p>
                <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {new Date(material.date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            {/* ✅ RENDER HTML LIMPIO CON ESTILOS MEJORADOS PARA IFRAMES */}
            <div 
              className="prose prose-lg prose-indigo max-w-none text-slate-700 leading-loose [&_iframe]:rounded-2xl [&_iframe]:shadow-lg [&_iframe]:w-full [&_img]:rounded-2xl [&_img]:shadow-md [&_img]:w-full [&_audio]:w-full"
              dangerouslySetInnerHTML={{ __html: material.content }} 
            />
          </div>

          {/* Sección Comentarios */}
          <div className="bg-slate-50 p-8 md:p-12 border-t border-slate-200">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-500"/> 
              Comentarios ({material.commentsCount || 0})
            </h3>
            
            {/* Input Comentario */}
            <div className="flex gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 shrink-0 flex items-center justify-center text-white font-bold text-sm">
                U
              </div>
              <div className="flex-1 relative">
                <Input 
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  placeholder="Escribe un comentario..." 
                  className="w-full h-12 rounded-2xl border-2 border-slate-200 pr-12 focus:border-indigo-500 bg-white"
                  onKeyDown={e => e.key === 'Enter' && !isSending && handleSend()}
                  disabled={isSending}
                />
                <button 
                  onClick={handleSend} 
                  disabled={isSending || !comment.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Lista de Comentarios (Placeholder - Se llenará si implementamos lectura de replies) */}
            <div className="text-center text-slate-400 text-sm py-8 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold">Sé el primero en comentar</p>
              <p className="text-xs mt-1">Los comentarios aparecerán aquí</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
