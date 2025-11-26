import React from 'react';
import { Heart, MessageCircle, Play, Image as ImageIcon, FileText, Edit2, Trash2, MonitorPlay, Mic } from 'lucide-react';

export const SocialCard: React.FC<{ 
  post: any, 
  onClick: () => void, 
  onEdit?: () => void,
  onDelete?: () => void
}> = ({ post, onClick, onEdit, onDelete }) => {
  
  // ✅ EXTRAER DATOS DE BLOQUES EN LUGAR DE HTML
  const blocks = post.blocks || [];
  const firstMedia = blocks.find((b: any) => ['video', 'image', 'genially', 'audio'].includes(b.type));
  const firstText = blocks.find((b: any) => b.type === 'text');

  // Generar preview de texto
  const getTextPreview = () => {
    if (firstText?.content) {
      const text = firstText.content.trim();
      return text.substring(0, 150) + (text.length > 150 ? '...' : '');
    }
    return 'Sin descripción';
  };

  // ✅ RENDERIZAR PREVIEW DE MEDIA
  const renderMediaPreview = () => {
    if (!firstMedia) {
      // Sin media: mostrar texto o ícono
      if (blocks.length > 1 || (firstText && firstText.content.length > 100)) {
        return (
          <div className="w-full aspect-video bg-gradient-to-br from-amber-300 via-orange-300 to-amber-400 rounded-2xl border border-slate-100 mb-4 overflow-hidden flex items-center justify-center relative group/article">
            <div className="absolute inset-0 bg-white/10 group-hover/article:bg-white/20 transition-all" />
            <FileText className="w-20 h-20 text-white drop-shadow-2xl group-hover/article:scale-110 transition-transform relative z-10" />
          </div>
        );
      }
      return null;
    }

    switch (firstMedia.type) {
      case 'video':
        // Extraer ID de YouTube para thumbnail
        const vId = firstMedia.content.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^&?]*)/)?.[1];
        if (vId) {
          const thumb = `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;
          return (
            <div className="w-full aspect-video bg-slate-50 rounded-2xl border border-slate-100 mb-4 overflow-hidden relative group/video">
              <img src={thumb} className="w-full h-full object-cover" alt="Video thumbnail" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover/video:from-black/80 transition-all flex items-center justify-center">
                <div className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center backdrop-blur-sm shadow-2xl group-hover/video:scale-110 transition-transform">
                  <Play className="w-7 h-7 text-rose-600 fill-rose-600 ml-1" />
                </div>
              </div>
            </div>
          );
        } else {
          // Fallback si no se detecta el ID
          return (
            <div className="w-full aspect-video bg-gradient-to-br from-red-400 via-pink-400 to-red-500 rounded-2xl border border-slate-100 mb-4 overflow-hidden flex items-center justify-center relative group/video">
              <div className="absolute inset-0 bg-white/10 group-hover/video:bg-white/20 transition-all" />
              <Play className="w-20 h-20 text-white drop-shadow-2xl fill-current group-hover/video:scale-110 transition-transform relative z-10" />
            </div>
          );
        }

      case 'genially':
        return (
          <div className="w-full aspect-video bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 rounded-2xl border border-slate-100 mb-4 overflow-hidden flex items-center justify-center relative group/genially">
            <div className="absolute inset-0 bg-white/10 group-hover/genially:bg-white/20 transition-all" />
            <MonitorPlay className="w-20 h-20 text-white drop-shadow-2xl group-hover/genially:scale-110 transition-transform relative z-10" />
          </div>
        );

      case 'audio':
        return (
          <div className="w-full aspect-video bg-gradient-to-br from-indigo-400 via-blue-400 to-indigo-500 rounded-2xl border border-slate-100 mb-4 overflow-hidden flex items-center justify-center relative group/audio">
            <div className="absolute inset-0 bg-white/10 group-hover/audio:bg-white/20 transition-all" />
            <Mic className="w-20 h-20 text-white drop-shadow-2xl group-hover/audio:scale-110 transition-transform relative z-10" />
          </div>
        );

      case 'image':
        return (
          <div className="w-full aspect-video bg-slate-50 rounded-2xl border border-slate-100 mb-4 overflow-hidden">
            <img 
              src={firstMedia.content} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              alt="Preview"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 group cursor-pointer flex flex-col"
      onClick={onClick}
    >
      
      {/* Contenido */}
      <div className="flex-1">
        <h3 className="font-black text-lg text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
          {post.title}
        </h3>
        
        {/* Preview Media */}
        {renderMediaPreview()}
        
        <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-3">
          {getTextPreview()}
        </p>
        
        {/* Badges de tipo de contenido */}
        <div className="flex gap-2 flex-wrap">
          {blocks.filter((b: any) => b.type === 'video').length > 0 && (
            <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1">
              <Play className="w-3 h-3 fill-current" /> {blocks.filter((b: any) => b.type === 'video').length} Video{blocks.filter((b: any) => b.type === 'video').length > 1 ? 's' : ''}
            </span>
          )}
          {blocks.filter((b: any) => b.type === 'genially').length > 0 && (
            <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1">
              <MonitorPlay className="w-3 h-3" /> Interactivo
            </span>
          )}
          {blocks.filter((b: any) => b.type === 'audio').length > 0 && (
            <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1">
              <Mic className="w-3 h-3" /> Audio
            </span>
          )}
          {blocks.filter((b: any) => b.type === 'image').length > 0 && (
            <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Imagen
            </span>
          )}
          {post.targetLevel && post.targetLevel !== 'ALL' && (
            <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">
              {post.targetLevel}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div 
        className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors group/btn">
            <Heart className="w-5 h-5 group-hover/btn:fill-rose-500 group-hover/btn:scale-110 transition-all" />
            <span className="text-xs font-bold">{post.likes || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-bold">{post.commentsCount || 0}</span>
          </button>
          
          {/* ✅ BOTÓN EDITAR (Solo si onEdit existe) */}
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors group/edit"
              title="Editar post"
            >
              <Edit2 className="w-4 h-4 group-hover/edit:scale-110 transition-transform" />
            </button>
          )}
          
          {/* ✅ BOTÓN BORRAR (Solo si onDelete existe) */}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 transition-colors group/delete"
              title="Borrar post"
            >
              <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <img 
            src={post.avatar || 'https://ui-avatars.com/api/?name=Profesor&background=6366f1&color=fff'} 
            className="w-6 h-6 rounded-full ring-2 ring-slate-100" 
            alt={post.author}
          />
          <span className="text-xs font-bold text-slate-600">{post.author}</span>
        </div>
      </div>
    </div>
  );
};
