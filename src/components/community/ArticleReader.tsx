import React from 'react';
import { X, Calendar, User } from 'lucide-react';
import { Button } from '../ui/button';

export const ArticleReader: React.FC<{ material: any, onClose: () => void }> = ({ material, onClose }) => {
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
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-4xl mx-auto w-full">
          
          {/* Author Info */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200/50">
            <img 
              src={material.avatar || 'https://ui-avatars.com/api/?name=Profesor&background=6366f1&color=fff'} 
              className="w-12 h-12 rounded-full bg-slate-200 ring-2 ring-white shadow-md" 
              alt={material.author}
            />
            <div className="flex-1">
              <p className="font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                {material.author}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                {new Date(material.date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          {/* Rich HTML Content - RENDER SEGURO CON SOPORTE GENIALLY/YOUTUBE */}
          <div 
            className="prose prose-lg prose-invert max-w-none leading-loose"
            style={{
              color: '#f1f5f9',
            }}
            dangerouslySetInnerHTML={{ __html: material.content }} 
          />
        </div>
      </div>
    </div>
  );
};
