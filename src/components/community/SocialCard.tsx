import React from 'react';
import { Heart, MessageCircle, Share2, Play, Image as ImageIcon, Mic, FileText, Edit2, Trash2 } from 'lucide-react';
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
  
  // Detectar primer medio visual
  const firstMedia = blocks.find((b: any) => ['video', 'image', 'genially', 'audio'].includes(b.type));
  
  // Detectar primer texto
  const firstText = blocks.find((b: any) => b.type === 'text');
  
  // Check si el usuario actual dio like
  const isLiked = Array.isArray(post.likes) && post.likes.includes(String(currentUserId));
  
  // Extractor de YouTube ID
  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^&?]*)/);
    return match?.[1] || '';
  };

  return (
    <div 
      className="bg-white rounded-3xl shadow-md border border-slate-100 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col h-[400px]"
      onClick={onClick}
    >
      
      {/* Header Flotante */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 pr-3 rounded-full shadow-sm pointer-events-auto">
          <img 
            src={post.avatar || 'https://ui-avatars.com/api/?name=Profesor&background=6366f1&color=fff'} 
            className="w-6 h-6 rounded-full bg-slate-200" 
            alt={post.author}
          />
          <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">
            {post.author}
          </span>
        </div>
        {post.targetLevel && post.targetLevel !== 'ALL' && (
          <span className="bg-indigo-600 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm pointer-events-auto">
            {post.targetLevel}
          </span>
        )}
      </div>
      
      {/* ZONA VISUAL (Mitad superior - Altura fija) */}
      <div className="h-[200px] bg-slate-50 relative overflow-hidden flex items-center justify-center shrink-0">
        {firstMedia ? (
          <>
            {firstMedia.type === 'image' && (
              <img 
                src={firstMedia.content} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" 
                alt="Preview"
              />
            )}
            
            {firstMedia.type === 'video' && (
              <div className="relative w-full h-full bg-black">
                <img 
                  src={`https://img.youtube.com/vi/${getYoutubeId(firstMedia.content)}/hqdefault.jpg`} 
                  className="w-full h-full object-cover opacity-70" 
                  alt="Video thumbnail"
                  onError={(e) => {
                    // Fallback si falla la preview
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-rose-600 fill-rose-600 ml-1" />
                  </div>
                </div>
              </div>
            )}
            
            {firstMedia.type === 'genially' && (
              <div className="w-full h-full bg-gradient-to-br from-[#FF4D6D] to-[#C72B56] flex flex-col items-center justify-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md">
                  <Play className="w-8 h-8 fill-current" />
                </div>
                <span className="font-black text-sm tracking-widest uppercase opacity-90">
                  Interactivo
                </span>
              </div>
            )}
            
            {firstMedia.type === 'audio' && (
              <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-blue-400 to-indigo-500 flex flex-col items-center justify-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md">
                  <Mic className="w-8 h-8" />
                </div>
                <span className="font-black text-sm tracking-widest uppercase opacity-90">
                  Audio
                </span>
              </div>
            )}
          </>
        ) : (
          // Solo Texto (Diseño Tipográfico)
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-white p-6 flex flex-col justify-center items-center text-center">
            <FileText className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Artículo de Lectura
            </p>
          </div>
        )}
        
        {/* Badges de Tipo (Iconos pequeños) */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {blocks.some((b: any) => b.type === 'audio') && (
            <div className="bg-black/60 backdrop-blur text-white p-1.5 rounded-lg">
              <Mic className="w-3 h-3" />
            </div>
          )}
          {blocks.some((b: any) => b.type === 'video') && (
            <div className="bg-black/60 backdrop-blur text-white p-1.5 rounded-lg">
              <Play className="w-3 h-3" />
            </div>
          )}
          {blocks.some((b: any) => b.type === 'image') && (
            <div className="bg-black/60 backdrop-blur text-white p-1.5 rounded-lg">
              <ImageIcon className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
      
      {/* ZONA INFO (Mitad inferior - Flex con altura restante) */}
      <div className="flex-1 p-5 flex flex-col justify-between bg-white relative z-10">
        <div className="flex-1 overflow-hidden">
          <h3 className="font-black text-lg text-slate-800 leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-slate-400 text-xs line-clamp-2 font-medium leading-relaxed">
            {firstText?.content || post.content || "Haz clic para ver el contenido multimedia completo."}
          </p>
        </div>
        
        {/* Footer con acciones */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-4">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onLike(); 
              }}
              className={cn(
                "flex items-center gap-1.5 text-xs font-bold transition-all",
                isLiked 
                  ? "text-rose-500 scale-105" 
                  : "text-slate-400 hover:text-rose-500 hover:scale-105"
              )}
            >
              <Heart className={cn("w-4 h-4 transition-all", isLiked && "fill-current")} /> 
              {Array.isArray(post.likes) ? post.likes.length : 0}
            </button>
            
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
              <MessageCircle className="w-4 h-4" /> 
              {post.commentsCount || 0}
            </div>
          </div>
          
          {/* Botones de edición/borrado solo para profesor */}
          {(onEdit || onDelete) && (
            <div className="flex gap-1">
              {onEdit && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Borrar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
