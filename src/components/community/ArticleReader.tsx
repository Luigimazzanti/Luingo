import React, { useRef } from 'react';
import { X, Download, BookOpen, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface CommunityPost {
  id: string;
  discussionId: number;
  postId: number;
  author: string;
  avatar: string;
  title: string;
  content: string;
  type: string;
  url?: string;
  thumbnailUrl?: string;
  targetLevel: string;
  likes: number;
  date: string;
  commentsCount: number;
}

interface ArticleReaderProps {
  post: CommunityPost;
  onClose: () => void;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({ post, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // --- PDF ON-THE-FLY GENERATION (Backend-less) ---
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-10 duration-300">
      
      {/* --- HEADER (Hidden in Print) --- */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </Button>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest hidden sm:inline-block">
            Modo Lectura
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadPDF}
            className="gap-2 rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Guardar PDF</span>
          </Button>
        </div>
      </header>

      {/* --- CONTENT SCROLL AREA --- */}
      <div className="flex-1 overflow-y-auto bg-[#FDFBF7]">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 print:p-0 print:max-w-none">
          
          {/* --- PRINTABLE AREA START --- */}
          <article id="printable-content" ref={contentRef} className="prose prose-slate prose-lg max-w-none print:prose-sm">
            
            {/* Print Header */}
            <div className="hidden print:block mb-8 border-b pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🐵</span>
                <span className="font-bold text-xl">LuinGo</span>
              </div>
              <p className="text-sm text-gray-500">Material de Estudio • Nivel {post.targetLevel}</p>
            </div>

            {/* Hero Image */}
            {post.thumbnailUrl && (
              <img 
                src={post.thumbnailUrl} 
                alt="Cover" 
                className="w-full h-64 md:h-80 object-cover rounded-3xl shadow-sm mb-10 print:h-48 print:rounded-none print:shadow-none"
              />
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Metadata */}
            <div className="flex items-center gap-4 mb-10 text-slate-500 font-medium print:text-xs">
              <span>Por {post.author}</span>
              <span>•</span>
              <span>{new Date(post.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            {/* Content */}
            <div className="font-serif text-slate-800 leading-loose whitespace-pre-line text-lg">
              {post.content}
            </div>

          </article>
          {/* --- PRINTABLE AREA END --- */}

        </div>
      </div>

      {/* Print Styles (Injected Style Tag) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-content, #printable-content * {
            visibility: visible;
          }
          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  );
};
