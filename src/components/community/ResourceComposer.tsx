import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Image, Youtube, Mic, Type, X, MonitorPlay, UploadCloud, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ResourceComposerProps {
  initialData?: { title: string, blocks: any[], level: string }; // ✅ CAMBIADO: blocks en lugar de content
  onPublish: (title: string, blocks: any[], level: string) => void; // ✅ CAMBIADO: blocks en lugar de contentHtml
  onCancel: () => void;
}

export const ResourceComposer: React.FC<ResourceComposerProps> = ({ initialData, onPublish, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [level, setLevel] = useState(initialData?.level || 'ALL');
  const [blocks, setBlocks] = useState<{type: string, content: string}[]>(
    initialData?.blocks || [{type: 'text', content: ''}] // ✅ RECUPERAR BLOQUES DIRECTAMENTE
  );

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

  // ✅ PUBLICAR BLOQUES PUROS (Sin convertir a HTML)
  const handlePublish = () => {
    if (!title.trim()) {
      toast.error("❌ Falta título");
      return;
    }

    // ✅ VALIDACIÓN BÁSICA DE URLs
    const hasErrors = blocks.some((b, idx) => {
      if (b.type === 'text') return false; // Texto no necesita validación
      if (!b.content.trim()) return false; // Vacío, será ignorado
      
      // Validar que sea URL
      if (!b.content.startsWith('http://') && !b.content.startsWith('https://')) {
        toast.error(`❌ Bloque #${idx+1} (${b.type}): Debe ser una URL válida que empiece con http:// o https://`);
        return true;
      }
      return false;
    });

    if (hasErrors) {
      toast.error("⚠️ Corrige los errores antes de publicar");
      return;
    }

    // Filtrar bloques vacíos
    const validBlocks = blocks.filter(b => b.content.trim());
    
    if (validBlocks.length === 0) {
      toast.error("❌ Debes añadir al menos un bloque con contenido");
      return;
    }

    console.log("📤 Publicando bloques puros:", validBlocks);
    
    // ✅ ENVIAR BLOQUES DIRECTAMENTE (No HTML)
    onPublish(title, validBlocks, level);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 shrink-0">
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
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Título *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título llamativo..."
              className="font-bold text-lg border-slate-200 bg-white h-12"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Nivel Target</label>
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

      {/* Toolbar de Bloques */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-3 shrink-0">
        <Btn icon={Type} label="Texto" onClick={() => addBlock('text')} />
        <Btn icon={Image} label="Imagen" onClick={() => addBlock('image')} color="emerald" />
        <Btn icon={Youtube} label="Video" onClick={() => addBlock('video')} color="red" />
        <Btn icon={Mic} label="Audio" onClick={() => addBlock('audio')} color="amber" />
        <Btn icon={MonitorPlay} label="Genially" onClick={() => addBlock('genially')} color="indigo" />
      </div>

      {/* Editor de Bloques */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
        {blocks.map((b, i) => (
          <div
            key={i}
            className="bg-white border-2 border-slate-200 rounded-2xl p-5 relative group hover:border-indigo-300 transition-all shadow-sm"
          >
            <button
              onClick={() => removeBlock(i)}
              className="absolute -right-2 -top-2 bg-rose-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 hover:scale-110 z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {b.type === 'text' ? (
              <div className="relative">
                <div className="absolute top-0 left-0 p-2 text-xs font-bold text-slate-300 uppercase pointer-events-none">
                  Párrafo
                </div>
                <Textarea
                  value={b.content}
                  onChange={e => updateBlock(i, e.target.value)}
                  placeholder="Escribe tu contenido..."
                  className="border-0 focus:ring-0 text-lg leading-relaxed min-h-[120px] resize-none bg-transparent pt-8 px-2"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 bg-slate-50 p-2 rounded-lg w-fit">
                  {b.type === 'video' && <Youtube className="w-4 h-4 text-red-500" />}
                  {b.type === 'genially' && <MonitorPlay className="w-4 h-4 text-indigo-500" />}
                  {b.type === 'image' && <Image className="w-4 h-4 text-emerald-500" />}
                  {b.type === 'audio' && <Mic className="w-4 h-4 text-amber-500" />}
                  Link {b.type}
                </div>
                <Input
                  value={b.content}
                  onChange={e => updateBlock(i, e.target.value)}
                  placeholder={b.type === 'video' ? "Ej: https://youtu.be/..." : "https://..."}
                  className="h-12 text-base"
                />

                {/* PREVIEW EN TIEMPO REAL EN EL EDITOR */}
                {b.content && b.type === 'video' && (
                  <div className="mt-2 p-2 bg-emerald-50 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                    ✅ Video ID: {b.content.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2] || 'No detectado'}
                  </div>
                )}

                {b.content && b.type !== 'video' && (
                  <div className="mt-2 p-2 bg-slate-100 rounded-xl opacity-70 text-xs text-center text-slate-500">
                    (Vista previa disponible al publicar)
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {blocks.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            Añade bloques para empezar
          </div>
        )}
      </div>

      {/* Footer Acciones */}
      <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-slate-500">
          <span className="font-bold">{blocks.filter(b => b.content.trim()).length}</span> bloque{blocks.filter(b => b.content.trim()).length !== 1 ? 's' : ''} con contenido
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="h-12 px-6 rounded-xl font-bold text-slate-500 flex-1 md:flex-none"
          >
            Cancelar
          </Button>
          <Button
            onClick={handlePublish}
            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg flex items-center gap-2 flex-1 md:flex-none"
          >
            <UploadCloud className="w-5 h-5" />
            {initialData ? 'ACTUALIZAR' : 'PUBLICAR'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Btn = ({ icon: I, label, onClick, color = 'slate' }: any) => {
  const colors: any = {
    slate: 'border-slate-300 hover:bg-slate-100 text-slate-600',
    emerald: 'border-emerald-300 hover:bg-emerald-50 text-emerald-600',
    red: 'border-red-300 hover:bg-red-50 text-red-600',
    amber: 'border-amber-300 hover:bg-amber-50 text-amber-600',
    indigo: 'border-indigo-300 hover:bg-indigo-50 text-indigo-600'
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-white border-2 rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow-md ${colors[color]}`}
    >
      <I className="w-4 h-4" />
      {label}
    </button>
  );
};