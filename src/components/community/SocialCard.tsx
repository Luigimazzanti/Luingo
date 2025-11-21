import React from 'react';
import { Material, Comment } from '../../types';
import { MessageCircle, Heart, Share2, BookOpen, PlayCircle, Link as LinkIcon, Download, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface SocialCardProps {
  material: Material;
  studentLevel: string;
  onClick: () => void;
}

export const SocialCard: React.FC<SocialCardProps> = ({ material, studentLevel, onClick }) => {
  
  // Configuración visual según tipo
  const getTypeConfig = () => {
    switch (material.type) {
      case 'article':
        return {
          color: 'bg-emerald-50',
          borderColor: 'border-emerald-100',
          icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
          badge: 'text-emerald-700 bg-emerald-100',
          label: 'Artículo',
          action: 'Leer Ahora'
        };
      case 'video':
        return {
          color: 'bg-amber-50',
          borderColor: 'border-amber-100',
          icon: <PlayCircle className="w-4 h-4 text-amber-600" />,
          badge: 'text-amber-700 bg-amber-100',
          label: 'Video',
          action: 'Ver Video'
        };
      default:
        return {
          color: 'bg-indigo-50',
          borderColor: 'border-indigo-100',
          icon: <LinkIcon className="w-4 h-4 text-indigo-600" />,
          badge: 'text-indigo-700 bg-indigo-100',
          label: 'Enlace',
          action: 'Abrir'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 group">
      
      {/* Header: Autor y Nivel */}
      <div className="p-4 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                 MG
             </div>
             <div>
                 <p className="text-xs font-bold text-slate-700">María González</p>
                 <p className="text-[10px] text-slate-400">Profesora • Hace 2h</p>
             </div>
        </div>
        <div className="flex gap-1">
            {material.target_levels.includes('ALL') ? (
                <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black tracking-wider">TODOS</span>
            ) : (
                material.target_levels.map(lvl => (
                    <span key={lvl} className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-black tracking-wider",
                        studentLevel === lvl ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                        {lvl}
                    </span>
                ))
            )}
        </div>
      </div>

      {/* Body Content */}
      <div onClick={onClick} className="cursor-pointer">
          {/* Thumbnail Area */}
          <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
              {material.thumbnail_url ? (
                  <img 
                    src={material.thumbnail_url} 
                    alt={material.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <FileText className="w-12 h-12" />
                  </div>
              )}
              
              {/* Overlay Type Badge */}
              <div className={cn("absolute top-3 left-3 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm backdrop-blur-md bg-white/90", config.badge)}>
                  {config.icon}
                  <span className="text-xs font-bold uppercase tracking-wide">{config.label}</span>
              </div>
              
              {/* Play Button Overlay (Videos) */}
              {material.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                          <PlayCircle className="w-6 h-6 text-amber-600 fill-amber-600" />
                      </div>
                  </div>
              )}
          </div>

          {/* Text Content */}
          <div className="p-5">
              <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  {material.title}
              </h3>
              
              {/* Teacher's Prompt Box */}
              <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-3 mb-4">
                  <p className="text-sm text-slate-600 italic">
                      "{material.description}"
                  </p>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 text-slate-400">
                      <button className="flex items-center gap-1.5 hover:text-rose-500 transition-colors text-xs font-bold group/like">
                          <Heart className="w-4 h-4 group-hover/like:fill-rose-500" />
                          {material.likes_count}
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors text-xs font-bold">
                          <MessageCircle className="w-4 h-4" />
                          {material.comments_count}
                      </button>
                  </div>
                  
                  {/* Reading Time for Articles */}
                  {material.article_content && (
                      <span className="text-xs font-medium text-slate-400">
                          {material.article_content.estimated_read_time} min lectura
                      </span>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
