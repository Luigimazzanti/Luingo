import React from 'react';
import { Heart, MessageCircle, Share2, Play, FileText, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export const SocialCard: React.FC<{ post: any, onClick: () => void }> = ({ post, onClick }) => {
  
  const renderMedia = () => {
    if (post.type === 'video' && post.url) {
      // Intentar sacar thumbnail de YouTube
      let thumb = 'https://placehold.co/600x400/EEE/31343C?text=Video';
      if (post.url.includes('youtube.com') || post.url.includes('youtu.be')) {
        const videoId = post.url.split('v=')[1] || post.url.split('/').pop();
        thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
      
      return (
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-slate-900 group/video cursor-pointer" onClick={onClick}>
          <img src={thumb} alt="Video" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/40 transition-all flex items-center justify-center">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-2xl group-hover/video:scale-110 transition-transform">
              <Play className="w-7 h-7 text-slate-900 fill-slate-900 ml-1" />
            </div>
          </div>
        </div>
      );
    }

    if (post.type === 'image' && post.url) {
      return (
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 cursor-pointer" onClick={onClick}>
          <img src={post.url} alt="Imagen" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        </div>
      );
    }

    if (post.type === 'article') {
      return (
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center cursor-pointer group/article" onClick={onClick}>
          <FileText className="w-20 h-20 text-amber-400 group-hover/article:scale-110 transition-transform" />
        </div>
      );
    }

    // Text o Link sin media
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 hover:shadow-2xl hover:border-slate-200 transition-all duration-300 group">
      
      {/* Contenido */}
      <div className="mb-4">
        <h3 className="font-black text-lg text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
          {post.content}
        </p>
      </div>
      
      {renderMedia()}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
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
  );
};
