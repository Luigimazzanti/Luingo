import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Play, FileText, ExternalLink, Image as ImageIcon, MonitorPlay, Mic } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { ArticleReader } from './ArticleReader';

export const SocialCard: React.FC<{ post: any, onClick: () => void }> = ({ post, onClick }) => {
  const [showReader, setShowReader] = useState(false);

  // Detectar contenido HTML
  const hasVideo = post.content.includes('youtube.com/embed') || post.content.includes('youtu.be');
  const hasGenially = post.content.includes('genial.ly');
  const hasAudio = post.content.includes('<audio');
  const hasImage = post.content.includes('<img');
  
  // Extraer texto plano para preview
  const getTextPreview = () => {
    const div = document.createElement('div');
    div.innerHTML = post.content;
    const text = div.textContent || div.innerText || '';
    return text.trim().substring(0, 150) + (text.length > 150 ? '...' : '');
  };

  const renderMedia = () => {
    // Si tiene video, extraer el thumbnail
    if (hasVideo) {
      const match = post.content.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const videoId = match[1];
        const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        
        return (
          <div 
            className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-slate-900 group/video cursor-pointer" 
            onClick={() => setShowReader(true)}
          >
            <img src={thumb} alt="Video" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/40 transition-all flex items-center justify-center">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-2xl group-hover/video:scale-110 transition-transform">
                <Play className="w-7 h-7 text-slate-900 fill-slate-900 ml-1" />
              </div>
            </div>
          </div>
        );
      }
    }

    // Si tiene Genially
    if (hasGenially) {
      return (
        <div 
          className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center cursor-pointer group/genially" 
          onClick={() => setShowReader(true)}
        >
          <MonitorPlay className="w-20 h-20 text-purple-400 group-hover/genially:scale-110 transition-transform" />
        </div>
      );
    }

    // Si tiene audio
    if (hasAudio) {
      return (
        <div 
          className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center cursor-pointer group/audio" 
          onClick={() => setShowReader(true)}
        >
          <Mic className="w-20 h-20 text-indigo-400 group-hover/audio:scale-110 transition-transform" />
        </div>
      );
    }

    // Si tiene imagen, extraerla
    if (hasImage) {
      const match = post.content.match(/<img[^>]+src="([^">]+)"/);
      if (match) {
        const imgSrc = match[1];
        return (
          <div 
            className="relative aspect-video rounded-2xl overflow-hidden mb-4 cursor-pointer" 
            onClick={() => setShowReader(true)}
          >
            <img 
              src={imgSrc} 
              alt="Imagen" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
            />
          </div>
        );
      }
    }

    // Sin media específica - mostrar icono de artículo si hay contenido
    if (post.content && post.content.length > 100) {
      return (
        <div 
          className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center cursor-pointer group/article" 
          onClick={() => setShowReader(true)}
        >
          <FileText className="w-20 h-20 text-amber-400 group-hover/article:scale-110 transition-transform" />
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div 
        className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 hover:shadow-2xl hover:border-slate-200 transition-all duration-300 group cursor-pointer"
        onClick={() => setShowReader(true)}
      >
        
        {/* Contenido */}
        <div className="mb-4">
          <h3 className="font-black text-lg text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
            {getTextPreview()}
          </p>
          
          {/* Badges de tipo de contenido */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {hasVideo && (
              <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1">
                <Play className="w-3 h-3" /> Video
              </span>
            )}
            {hasGenially && (
              <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1">
                <MonitorPlay className="w-3 h-3" /> Genially
              </span>
            )}
            {hasAudio && (
              <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1">
                <Mic className="w-3 h-3" /> Audio
              </span>
            )}
            {hasImage && !hasVideo && !hasGenially && (
              <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Imagen
              </span>
            )}
          </div>
        </div>
        
        {renderMedia()}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-4">
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors group/btn">
              <Heart className="w-5 h-5 group-hover/btn:fill-rose-500 group-hover/btn:scale-110 transition-all" />
              <span className="text-xs font-bold">{post.likes || 0}</span>
            </button>
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-bold">{post.commentsCount || 0}</span>
            </button>
          </div>
          <button className="text-slate-300 hover:text-indigo-500 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reader Modal */}
      {showReader && (
        <ArticleReader 
          material={post} 
          onClose={() => setShowReader(false)} 
        />
      )}
    </>
  );
};
