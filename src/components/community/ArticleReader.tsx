import React, { useRef } from 'react';
import { Material, Comment } from '../../types';
import { X, Download, Printer, MessageCircle, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import ReactMarkdown from 'react-markdown'; // Assuming available or simple render
import { cn } from '../../lib/utils';

interface ArticleReaderProps {
  material: Material;
  onClose: () => void;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({ material, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // --- PDF ON-THE-FLY GENERATION (Backend-less) ---
  const handleDownloadPDF = () => {
    // This triggers the browser's native print dialog
    // We use CSS @media print to hide the UI and format the document beautifully
    window.print();
  };

  if (!material.article_content) return null;

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
      <div className="flex-1 overflow-y-auto bg-[#FDFBF7]"> {/* Cream background for reading */}
          <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 print:p-0 print:max-w-none">
              
              {/* --- PRINTABLE AREA START --- */}
              <article id="printable-content" ref={contentRef} className="prose prose-slate prose-lg max-w-none print:prose-sm">
                  
                  {/* Print Header */}
                  <div className="hidden print:block mb-8 border-b pb-4">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-2xl">🐵</span>
                         <span className="font-bold text-xl">LuinGo</span>
                      </div>
                      <p className="text-sm text-gray-500">Material de Estudio • Nivel {material.target_levels.join(', ')}</p>
                  </div>

                  {/* Hero Image */}
                  {material.thumbnail_url && (
                      <img 
                        src={material.thumbnail_url} 
                        alt="Cover" 
                        className="w-full h-64 md:h-80 object-cover rounded-3xl shadow-sm mb-10 print:h-48 print:rounded-none print:shadow-none"
                      />
                  )}

                  {/* Title */}
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                      {material.title}
                  </h1>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 mb-10 text-slate-500 font-medium print:text-xs">
                      <span>Por María González</span>
                      <span>•</span>
                      <span>{material.article_content.estimated_read_time} min lectura</span>
                      <span>•</span>
                      <span>{new Date(material.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Markdown Content */}
                  {/* Simplificamos el renderizado para no depender de librerías pesadas si no están */}
                  <div className="font-serif text-slate-800 leading-loose whitespace-pre-line">
                      {material.article_content.body_markdown}
                  </div>

                  {/* Glossary Section */}
                  {material.article_content.glossary && material.article_content.glossary.length > 0 && (
                      <div className="mt-16 p-8 bg-white rounded-3xl border border-amber-100 shadow-sm print:border print:rounded-lg print:p-4 print:shadow-none print:bg-gray-50 print:break-inside-avoid">
                          <h3 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-amber-600" />
                              Vocabulario Clave
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {material.article_content.glossary.map((item, idx) => (
                                  <div key={idx} className="flex flex-col">
                                      <span className="font-bold text-slate-900">{item.term}</span>
                                      <span className="text-slate-500 text-sm">{item.definition}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
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
          /* Hide header, footer, browser UI artifacts if possible */
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  );
};
