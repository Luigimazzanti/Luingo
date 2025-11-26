import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Image, Youtube, Mic, Plus, X, MonitorPlay, Type } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ResourceComposerProps {
  onPublish: (title: string, contentHtml: string, level: string) => void;
  onCancel: () => void;
}

export const ResourceComposer: React.FC<ResourceComposerProps> = ({ onPublish, onCancel }) => {
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('ALL');
  const [blocks, setBlocks] = useState<{type: string, content: string}[]>([
    { type: 'text', content: '' }
  ]);

  // --- HANDLERS DE BLOQUES ---
  const addBlock = (type: 'text' | 'image' | 'video' | 'audio' | 'genially') => {
    setBlocks([...blocks, { type, content: '' }]);
  };

  const updateBlock = (idx: number, val: string) => {
    const newBlocks = [...blocks];
    newBlocks[idx].content = val;
    setBlocks(newBlocks);
  };

  const removeBlock = (idx: number) => {
    if (blocks.length === 1) {
      toast.error("Debe haber al menos un bloque");
      return;
    }
    setBlocks(blocks.filter((_, i) => i !== idx));
  };

  // --- GENERADOR DE HTML FINAL ---
  const handlePublish = () => {
    if (!title.trim()) { 
      toast.error("Ponle un título"); 
      return; 
    }
    
    let html = `<div class="luingo-post space-y-6">`;
    
    blocks.forEach(b => {
      if (!b.content.trim()) return;
      
      if (b.type === 'text') {
        html += `<p class="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">${b.content}</p>`;
      } else if (b.type === 'image') {
        html += `<img src="${b.content}" class="w-full rounded-2xl border border-slate-100 shadow-sm" alt="Recurso" />`;
      } else if (b.type === 'video') {
        const vId = b.content.split('v=')[1]?.split('&')[0] || b.content.split('/').pop();
        html += `<div class="relative aspect-video rounded-2xl overflow-hidden shadow-md"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${vId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
      } else if (b.type === 'genially') {
        // Embed Genially Responsive
        html += `<div style="width: 100%;"><div style="position: relative; padding-bottom: 56.25%; padding-top: 0; height: 0;"><iframe title="Genially" frameborder="0" width="1200" height="675" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 16px;" src="${b.content}" type="text/html" allowscriptaccess="always" allowfullscreen="true" scrolling="yes" allownetworking="all"></iframe></div></div>`;
      } else if (b.type === 'audio') {
        html += `<div class="bg-slate-100 p-4 rounded-xl flex items-center justify-center"><audio controls class="w-full" src="${b.content}"></audio></div>`;
      }
    });
    
    html += `</div>`;
    onPublish(title, html, level);
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <h2 className="text-2xl font-black text-slate-800 mb-4">Crear Recurso</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
              Título *
            </label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Título llamativo..." 
              className="font-bold text-lg border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
              Nivel
            </label>
            <select 
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold bg-white" 
              value={level} 
              onChange={e => setLevel(e.target.value)}
            >
              <option value="ALL">🌍 Todos</option>
              <option value="A1">🌱 A1</option>
              <option value="A2">🌿 A2</option>
              <option value="B1">🌳 B1</option>
              <option value="B2">🌲 B2</option>
              <option value="C1">🏔️ C1</option>
              <option value="C2">⛰️ C2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editor de Bloques */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {blocks.map((block, idx) => (
          <div 
            key={idx} 
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group"
          >
            <button 
              onClick={() => removeBlock(idx)} 
              className="absolute -right-2 -top-2 bg-rose-100 text-rose-500 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-200"
            >
              <X className="w-4 h-4"/>
            </button>
            
            {block.type === 'text' && (
              <Textarea 
                value={block.content} 
                onChange={e => updateBlock(idx, e.target.value)} 
                placeholder="Escribe algo..." 
                className="border-0 focus-visible:ring-0 text-lg resize-none min-h-[100px] bg-transparent" 
              />
            )}
            
            {block.type !== 'text' && (
              <div>
                <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase text-slate-400">
                  {block.type === 'video' && <><Youtube className="w-4 h-4"/> YouTube Link</>}
                  {block.type === 'genially' && <><MonitorPlay className="w-4 h-4"/> Genially Link</>}
                  {block.type === 'audio' && <><Mic className="w-4 h-4"/> Audio MP3 Link</>}
                  {block.type === 'image' && <><Image className="w-4 h-4"/> Image URL</>}
                </div>
                <Input 
                  value={block.content} 
                  onChange={e => updateBlock(idx, e.target.value)} 
                  placeholder="https://..." 
                  className="border-slate-200"
                />
              </div>
            )}
          </div>
        ))}

        {/* Botones para Añadir Bloques */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <AddBtn icon={Type} label="Texto" onClick={() => addBlock('text')} />
          <AddBtn icon={Image} label="Imagen" onClick={() => addBlock('image')} />
          <AddBtn icon={Youtube} label="Video" onClick={() => addBlock('video')} />
          <AddBtn icon={Mic} label="Audio" onClick={() => addBlock('audio')} />
          <AddBtn icon={MonitorPlay} label="Genially" onClick={() => addBlock('genially')} />
        </div>
      </div>

      {/* Footer Acciones */}
      <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="font-bold"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handlePublish} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 rounded-xl shadow-lg shadow-indigo-200"
        >
          ✨ PUBLICAR
        </Button>
      </div>
    </div>
  );
};

const AddBtn = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold text-sm whitespace-nowrap shadow-sm"
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);
