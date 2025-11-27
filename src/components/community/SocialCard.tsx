import React from 'react';
import { Heart, MessageCircle, Play, Image as ImageIcon, Mic, FileText, Edit2, Trash2, Box } from 'lucide-react';
import { cn } from '../../lib/utils';

export const SocialCard: React.FC<{ 
  post: any, 
  currentUserId: string, 
  onClick: () => void, 
  onLike: () => void, 
  onEdit?: () => void, 
  onDelete?: () => void 
}> = ({ post, currentUserId, onClick, onLike, onEdit, onDelete }) => {
  const blocks = post.blocks || [];
  const firstMedia = blocks.find((b: any) => ['video', 'image', 'genially', 'audio'].includes(b.type));
  
  // Lógica de Likes Segura
  const likesList = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = likesList.includes(String(currentUserId));
  
  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^&?]*)/);
    return match?.[1] || '';
  };

  // ✅ LÓGICA DE ICONOS DE CONTENIDO
  const contentCounts = blocks.reduce((acc: any, b: any) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {});

  const renderContentIcon = (type: string, Icon: any) => {
    const count = contentCounts[type];
    if (!count) return null;
    return (
      <div className="flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-sm">
        <Icon className="w-3 h-3" />
        {count > 1 && <span>{count}</span>}
      </div>
    );
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col h-[280px] relative"
      onClick={onClick}
    >
      
      {/* HEADER FLOTANTE (Nivel y Autor) */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20 pointer-events-none">
        {post.targetLevel && post.targetLevel !== 'ALL' && (
          <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm pointer-events-auto">
            {post.targetLevel}
          </span>
        )}
      </div>

      {/* ZONA VISUAL (Altura ajustada) */}
      <div className="h-[160px] relative overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
        {firstMedia ? (
          <>
            {firstMedia.type === 'image' && (
              <img src={firstMedia.content} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="Cover" />
            )}
            {firstMedia.type === 'video' && (
              <div className="relative w-full h-full bg-black">
                <img src={`https://img.youtube.com/vi/${getYoutubeId(firstMedia.content)}/hqdefault.jpg`} className="w-full h-full object-cover opacity-80" alt="Video" />
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg"><Play className="w-4 h-4 text-rose-600 ml-0.5 fill-current" /></div></div>
              </div>
            )}
            {firstMedia.type === 'genially' && <div className="w-full h-full bg-gradient-to-br from-[#FF4D6D] to-[#C72B56] flex items-center justify-center"><Play className="w-10 h-10 text-white/90 fill-current" /></div>}
            {firstMedia.type === 'audio' && <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><Mic className="w-10 h-10 text-white/90" /></div>}
          </>
        ) : (
          // ✅ FALLBACK TEXTO MODERNO
          <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-200 flex flex-col justify-center items-center relative overflow-hidden">
             <FileText className="w-16 h-16 text-slate-300 absolute -right-4 -bottom-4 rotate-12" />
             <FileText className="w-8 h-8 text-slate-400 z-10" />
          </div>
        )}

        {/* INDICADORES DE CONTENIDO (Overlay abajo a la derecha de la imagen) */}
        <div className="absolute bottom-2 right-2 flex gap-1 z-20 pointer-events-auto">
            {renderContentIcon('video', Play)}
            {renderContentIcon('image', ImageIcon)}
            {renderContentIcon('audio', Mic)}
            {renderContentIcon('genially', Box)}
            {renderContentIcon('text', FileText)}
        </div>
      </div>

      {/* ZONA INFO (Compacta) */}
      <div className="flex-1 p-3 flex flex-col justify-between bg-white relative z-10">
        <div>
          {/* Autor Mini */}
          <div className="flex items-center gap-1.5 mb-1.5 opacity-70">
             <img src={post.avatar || 'https://ui-avatars.com/api/?name=U&background=random'} className="w-4 h-4 rounded-full" alt={post.author} />
             <span className="text-[10px] font-bold truncate max-w-[120px]">{post.author}</span>
          </div>

          {/* Título: 1 línea con elipsis */}
          <h3 className="font-bold text-sm text-slate-800 leading-tight truncate w-full group-hover:text-indigo-600 transition-colors" title={post.title}>
            {post.title}
          </h3>
        </div>
        
        {/* Footer Acciones */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className={cn("flex items-center gap-1 text-[10px] font-bold transition-all p-1 rounded-md hover:bg-rose-50", isLiked ? "text-rose-500" : "text-slate-400 hover:text-rose-500")}
            >
              <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} /> 
              {likesList.length > 0 ? likesList.length : ''}
            </button>
            
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold p-1">
              <MessageCircle className="w-3.5 h-3.5" /> 
              {post.commentsCount > 0 ? post.commentsCount : ''}
            </div>
          </div>
          
          {(onEdit || onDelete) && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 className="w-3 h-3" /></button>}
              {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
