import React, { useState } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { addCommunityComment } from '../../lib/moodle';
import { toast } from 'sonner@2.0.3';

export const ArticleReader: React.FC<{ material: any, onClose: () => void }> = ({ material, onClose }) => {
  const [comment, setComment] = useState('');

  const handleSend = async () => {
    if (!comment.trim()) return;
    
    await addCommunityComment(material.discussionId, comment);
    toast.success("💬 Comentario enviado");
    setComment('');
  };

  // ✅ RENDERIZADOR DE BLOQUES EN EL CLIENTE
  const renderBlock = (b: any, idx: number) => {
    if (!b.content) return null;

    switch (b.type) {
      case 'text':
        return (
          <p 
            key={idx} 
            className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap"
          >
            {b.content}
          </p>
        );
      
      case 'image':
        return (
          <img 
            key={idx} 
            src={b.content} 
            className="w-full rounded-2xl shadow-sm border border-slate-100" 
            alt="Imagen del post"
          />
        );
      
      case 'video':
        // ✅ Parser de YouTube en el Cliente
        const vId = b.content.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^&?]*)/)?.[1] || '';
        
        if (vId) {
          return (
            <div 
              key={idx} 
              className="aspect-video rounded-2xl overflow-hidden shadow-lg bg-black"
            >
              <iframe 
                src={`https://www.youtube.com/embed/${vId}`} 
                className="w-full h-full" 
                allowFullScreen 
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          );
        } else {
          // Fallback: Enlace directo si no se detecta el ID
          return (
            <a
              key={idx}
              href={b.content}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl text-center hover:shadow-lg transition-all"
            >
              <div className="text-red-600 font-black text-lg mb-2">
                🎬 Ver Video en YouTube
              </div>
              <div className="text-slate-500 text-sm break-all">
                {b.content}
              </div>
            </a>
          );
        }
      
      case 'genially':
        return (
          <div 
            key={idx} 
            className="w-full rounded-2xl overflow-hidden shadow-lg border border-slate-100" 
            style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}
          >
            <iframe 
              src={b.content} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
              allowFullScreen 
              frameBorder="0"
              scrolling="yes"
            />
          </div>
        );
      
      case 'audio':
        return (
          <div key={idx} className="bg-slate-100 p-4 rounded-2xl flex justify-center">
            <audio controls src={b.content} className="w-full" />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-8 md:px-12 py-12 md:py-16">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={material.avatar || 'https://ui-avatars.com/api/?name=Profesor&background=6366f1&color=fff'} 
                className="w-12 h-12 rounded-full ring-4 ring-white/30 shadow-lg" 
                alt={material.author}
              />
              <div>
                <p className="font-black text-white text-lg">{material.author}</p>
                <p className="text-indigo-100 text-sm">
                  {new Date(material.date).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
              {material.title}
            </h1>
            
            {material.targetLevel && material.targetLevel !== 'ALL' && (
              <div className="mt-4 inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-white text-xs font-bold">
                  🎯 Nivel {material.targetLevel}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="px-8 md:px-12 py-8 md:py-12 bg-white">
          {/* ✅ RENDERIZAR BLOQUES DEL JSON */}
          <div className="space-y-8">
            {material.blocks?.length > 0 ? (
              material.blocks.map((b: any, i: number) => renderBlock(b, i))
            ) : (
              // Fallback para posts antiguos sin bloques
              <div 
                className="prose prose-slate max-w-none text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: material.content || 'Sin contenido' }}
              />
            )}
          </div>
        </div>
        
        {/* Comentarios */}
        <div className="bg-slate-50 p-8 md:p-12 border-t border-slate-200">
          <h3 className="font-black text-slate-800 mb-6 flex gap-2 items-center">
            <MessageCircle className="w-5 h-5 text-indigo-600" /> 
            Comentarios
          </h3>
          
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Input 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                placeholder="Comenta algo..." 
                className="w-full h-12 rounded-2xl pr-12 bg-white border-slate-200" 
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {material.commentsCount > 0 && (
            <div className="mt-6 text-sm text-slate-400 text-center">
              {material.commentsCount} comentario{material.commentsCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
