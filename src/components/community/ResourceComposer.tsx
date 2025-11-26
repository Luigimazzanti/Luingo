import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Image, Youtube, Mic, Type, X, MonitorPlay, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { cn } from '../../lib/utils';

interface ResourceComposerProps {
  initialData?: { title: string, content: string, level: string }; // ✅ NUEVO: Para edición
  onPublish: (title: string, contentHtml: string, level: string) => void;
  onCancel: () => void;
}

export const ResourceComposer: React.FC<ResourceComposerProps> = ({ initialData, onPublish, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [level, setLevel] = useState(initialData?.level || 'ALL');
  const [blocks, setBlocks] = useState<{type: string, content: string}[]>([
    { type: 'text', content: '' }
  ]);

  // ✅ PARSER INTELIGENTE: HTML -> BLOQUES (Para Edición)
  useEffect(() => {
    if (initialData?.content) {
      console.log('🔍 Parseando HTML para edición:', initialData.content.substring(0, 100));
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(initialData.content, 'text/html');
      const newBlocks: any[] = [];
      
      // Buscar elementos clave en el HTML
      const processNode = (node: Node) => {
        if (node.nodeName === 'P' && node.textContent?.trim()) {
          newBlocks.push({ type: 'text', content: node.textContent.trim() });
        } else if (node.nodeName === 'IMG') {
          const img = node as HTMLImageElement;
          newBlocks.push({ type: 'image', content: img.src });
        } else if (node.nodeName === 'DIV') {
          const el = node as HTMLDivElement;
          const iframe = el.querySelector('iframe');
          const audio = el.querySelector('audio');
          
          if (iframe) {
            const src = iframe.src;
            if (src.includes('youtube.com/embed')) {
              // Convertir embed a URL normal para el editor
              const videoId = src.split('/embed/')[1]?.split('?')[0];
              newBlocks.push({ type: 'video', content: `https://www.youtube.com/watch?v=${videoId}` });
            } else if (src.includes('genial.ly')) {
              newBlocks.push({ type: 'genially', content: src });
            }
          } else if (audio) {
            newBlocks.push({ type: 'audio', content: audio.src });
          } else {
            // Procesar hijos del div
            el.childNodes.forEach(processNode);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Procesar recursivamente otros elementos
          (node as Element).childNodes.forEach(processNode);
        }
      };
      
      doc.body.childNodes.forEach(processNode);
      
      if (newBlocks.length > 0) {
        console.log('✅ Bloques parseados:', newBlocks);
        setBlocks(newBlocks);
      } else {
        console.warn('⚠️ No se encontraron bloques, usando texto plano');
        setBlocks([{ type: 'text', content: doc.body.textContent || '' }]);
      }
    }
  }, [initialData]);

  const addBlock = (type: any) => setBlocks([...blocks, { type, content: '' }]);
  
  const updateBlock = (idx: number, val: string) => {
    const n = [...blocks]; 
    n[idx].content = val; 
    setBlocks(n);
  };
  
  const removeBlock = (idx: number) => {
    if (blocks.length === 1) {
      toast.error("Debe haber al menos un bloque");
      return;
    }
    setBlocks(blocks.filter((_, i) => i !== idx));
  };

  const handlePublish = () => {
    if (!title) { 
      toast.error("Falta título"); 
      return; 
    }
    
    let html = `<div class="luingo-post space-y-6">`;
    
    blocks.forEach(b => {
      if (!b.content) return;
      
      if (b.type === 'text') {
        html += `<p class="text-lg leading-relaxed whitespace-pre-wrap text-slate-700">${b.content}</p>`;
      }
      
      if (b.type === 'image') {
        html += `<img src="${b.content}" class="w-full rounded-2xl shadow-sm" />`;
      }
      
      if (b.type === 'video') {
        const vid = b.content.split('v=')[1]?.split('&')[0] || b.content.split('/').pop();
        html += `<div class="aspect-video rounded-2xl overflow-hidden shadow-lg"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${vid}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
      }
      
      if (b.type === 'genially') {
        html += `<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:16px;"><iframe style="position:absolute; top:0; left:0; width:100%; height:100%;" src="${b.content}" frameborder="0" allowfullscreen></iframe></div>`;
      }

      if (b.type === 'audio') {
        html += `<div class="bg-slate-100 p-4 rounded-xl"><audio controls class="w-full" src="${b.content}"></audio></div>`;
      }
    });
    
    html += `</div>`;
    onPublish(title, html, level);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-slate-800">
            {initialData ? '✏️ Editar Recurso' : '✨ Crear Recurso'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="rounded-full hover:bg-white/50"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
              Título *
            </label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Título llamativo..." 
              className="font-bold text-lg border-slate-200 bg-white h-12"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
              Nivel Target
            </label>
            <select 
              className="w-full h-12 rounded-lg border border-slate-200 px-3 text-sm font-bold bg-white" 
              value={level} 
              onChange={e => setLevel(e.target.value)}
            >
              <option value="ALL">🌍 Todos los Niveles</option>
              <option value="A1">🌱 A1 - Principiante</option>
              <option value="A2">🌿 A2 - Elemental</option>
              <option value="B1">🌳 B1 - Intermedio</option>
              <option value="B2">🌲 B2 - Intermedio Alto</option>
              <option value="C1">🏔️ C1 - Avanzado</option>
              <option value="C2">⛰️ C2 - Maestría</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editor de Bloques */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {blocks.map((block, idx) => (
          <div 
            key={idx} 
            className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm relative group hover:border-indigo-300 transition-all"
          >
            <button 
              onClick={() => removeBlock(idx)} 
              className="absolute -right-2 -top-2 bg-rose-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 hover:scale-110"
            >
              <X className="w-4 h-4"/>
            </button>
            
            {block.type === 'text' && (
              <div>
                <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase text-slate-400">
                  <Type className="w-4 h-4 text-indigo-500" /> 
                  Texto
                </div>
                <Textarea 
                  value={block.content} 
                  onChange={e => updateBlock(idx, e.target.value)} 
                  placeholder="Escribe tu contenido aquí..." 
                  className="border-0 focus-visible:ring-0 text-base resize-none min-h-[120px] bg-slate-50 rounded-xl p-3" 
                />
              </div>
            )}
            
            {block.type !== 'text' && (
              <div>
                <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase text-slate-400">
                  {block.type === 'video' && <><Youtube className="w-4 h-4 text-rose-500"/> YouTube Link</>}
                  {block.type === 'genially' && <><MonitorPlay className="w-4 h-4 text-purple-500"/> Genially Link</>}
                  {block.type === 'audio' && <><Mic className="w-4 h-4 text-indigo-500"/> Audio MP3 Link</>}
                  {block.type === 'image' && <><Image className="w-4 h-4 text-emerald-500"/> Image URL</>}
                </div>
                <Input 
                  value={block.content} 
                  onChange={e => updateBlock(idx, e.target.value)} 
                  placeholder="Pega la URL aquí..." 
                  className="border-slate-200 h-11 bg-slate-50"
                />
                {block.content && block.type === 'video' && (
                  <p className="text-xs text-slate-400 mt-2">
                    ✅ Video ID detectado: {block.content.split('v=')[1]?.split('&')[0] || block.content.split('/').pop()}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Botones para Añadir Bloques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4">
          <AddBtn icon={Type} label="Texto" onClick={() => addBlock('text')} />
          <AddBtn icon={Image} label="Imagen" onClick={() => addBlock('image')} color="emerald" />
          <AddBtn icon={Youtube} label="Video" onClick={() => addBlock('video')} color="rose" />
          <AddBtn icon={Mic} label="Audio" onClick={() => addBlock('audio')} color="indigo" />
          <AddBtn icon={MonitorPlay} label="Genially" onClick={() => addBlock('genially')} color="purple" />
        </div>
      </div>

      {/* Footer Acciones */}
      <div className="p-6 border-t border-slate-200 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-slate-500">
          <span className="font-bold">{blocks.length}</span> bloque{blocks.length !== 1 ? 's' : ''} • 
          <span className="font-bold ml-2">{title ? title.length : 0}</span> caracteres en título
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="font-bold flex-1 md:flex-none rounded-xl"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handlePublish} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 rounded-xl shadow-lg shadow-indigo-200 flex-1 md:flex-none"
          >
            <Check className="w-5 h-5 mr-2" />
            {initialData ? 'ACTUALIZAR' : 'PUBLICAR'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const AddBtn = ({ icon: Icon, label, onClick, color = 'slate' }: { 
  icon: any, 
  label: string, 
  onClick: () => void,
  color?: string 
}) => {
  const colorClasses: any = {
    slate: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600',
    emerald: 'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600',
    rose: 'border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600',
    indigo: 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600',
    purple: 'border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-600'
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 rounded-xl transition-all font-bold text-xs shadow-sm hover:shadow-md",
        colorClasses[color]
      )}
    >
      <Icon className="w-6 h-6" />
      {label}
    </button>
  );
};
