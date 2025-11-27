import React from 'react';
import { Heart, MessageCircle, Share2, Play, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const SocialCard: React.FC<{ 
  post: any, 
  onClick: () => void,
  onEdit?: () => void,
  onDelete?: () => void
}> = ({ post, onClick, onEdit, onDelete }) => {
  const blocks = post.blocks || [];
  const firstMedia = blocks.find((b: any) => ['video', 'image', 'genially'].includes(b.type));
  const textContent = blocks.find((b: any) => b.type === 'text')?.content || "";

  // ✅ Extractor de YouTube ID robusto
  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^&?]*)/);
    return match?.[1] || '';
  };

  return (
    <div 
      className="bg-white rounded-3xl shadow-md border border-slate-100 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col h-[420px]"
      onClick={onClick}
    >
      
      {/* HEADER FLOTANTE (Autor) */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 pr-3 rounded-full shadow-sm">
          <img 
            src={post.avatar || 'https://ui-avatars.com/api/?name=Profesor&background=6366f1&color=fff'} 
            className="w-6 h-6 rounded-full bg-slate-200" 
            alt={post.author}
          />
          <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">
            {post.author}
          </span>
        </div>
        <span className="bg-black/50 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase backdrop-blur-md">
          {post.targetLevel === 'ALL' ? 'Todos' : post.targetLevel}
        </span>
      </div>

      {/* CONTENIDO VISUAL (Principal) - Flex-1 para ocupar espacio */}
      <div className="flex-1 bg-slate-50 relative overflow-hidden flex items-center justify-center">
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
                  className="w-full h-full object-cover opacity-80" 
                  alt="Video thumbnail"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-rose-600 fill-rose-600 ml-1" />
                  </div>
                </div>
              </div>
            )}
            
            {firstMedia.type === 'genially' && (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-900 flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md">
                  <Play className="w-8 h-8 fill-current" />
                </div>
                <p className="font-black text-lg leading-tight line-clamp-3">
                  {post.title}
                </p>
                <span className="text-xs opacity-80 mt-2 uppercase tracking-widest">
                  Interactivo
                </span>
              </div>
            )}
            
            {firstMedia.type === 'audio' && (
              <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-blue-400 to-indigo-500 flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
                <p className="font-black text-lg leading-tight line-clamp-3">
                  {post.title}
                </p>
                <span className="text-xs opacity-80 mt-2 uppercase tracking-widest">
                  Audio
                </span>
              </div>
            )}
          </>
        ) : (
          // FALLBACK: TEXT CARD
          <div className="w-full h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 flex flex-col justify-center">
            <h3 className="font-black text-2xl text-slate-800 leading-tight mb-3 line-clamp-4">
              {post.title}
            </h3>
            <p className="text-slate-500 text-sm line-clamp-4 leading-relaxed">
              {textContent}
            </p>
          </div>
        )}
      </div>

      {/* FOOTER (Info) - Altura fija */}
      <div className="p-4 bg-white border-t border-slate-50 h-[100px] flex flex-col justify-between shrink-0">
        {firstMedia && (
          <div className="mb-1">
            <h3 className="font-bold text-slate-800 text-sm line-clamp-1">
              {post.title}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-1">
              {textContent || "Ver contenido multimedia..."}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-4">
            <button className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:text-rose-500 transition-colors group/like">
              <Heart className="w-4 h-4 group-hover/like:fill-rose-500 transition-all" /> 
              {post.likes || 0}
            </button>
            <button className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:text-indigo-500 transition-colors">
              <MessageCircle className="w-4 h-4" /> 
              {post.commentsCount || 0}
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            {/* Botones de edición/borrado solo para profesor */}
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Editar"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                title="Borrar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
