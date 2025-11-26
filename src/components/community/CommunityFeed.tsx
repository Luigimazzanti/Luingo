import React, { useState, useEffect } from 'react';
import { SocialCard } from './SocialCard';
import { Button } from '../ui/button';
import { Filter, Globe, Lock, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getCommunityPosts, createCommunityPost } from '../../lib/moodle';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';

export const CommunityFeed = ({ student, isTeacher }: { student: any, isTeacher?: boolean }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState<'my_level' | 'all'>('my_level');
  const [loading, setLoading] = useState(true);

  // Estado Crear Post (Solo Profe)
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ 
    title: '', 
    content: '', 
    type: 'text', 
    url: '', 
    level: 'ALL' 
  });

  const loadPosts = async () => {
    setLoading(true);
    const data = await getCommunityPosts();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { 
    loadPosts(); 
  }, []);

  // Filtro
  const filteredPosts = posts.filter(p => {
    if (isTeacher || filterMode === 'all') return true;
    const userLevel = student?.current_level_code || 'A1';
    return p.target_levels.includes(userLevel) || p.target_levels.includes('ALL');
  });

  const handleCreate = async () => {
    if (!newPost.title) {
      toast.error('El título es obligatorio');
      return;
    }
    
    toast.loading("Publicando...");
    
    try {
      await createCommunityPost(
        newPost.title, 
        newPost.content, 
        newPost.type, 
        newPost.url, 
        [newPost.level]
      );
      
      toast.dismiss();
      toast.success("¡Publicado!");
      
      setShowCreate(false);
      setNewPost({ title: '', content: '', type: 'text', url: '', level: 'ALL' });
      
      loadPosts();
    } catch (error) {
      toast.dismiss();
      toast.error("Error al publicar");
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">Comunidad</h1>
          <p className="text-slate-500 font-medium">Descubre y comparte cultura.</p>
        </div>
        
        <div className="flex gap-3">
          {/* Filtros Alumno */}
          {!isTeacher && (
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex">
              <button 
                onClick={() => setFilterMode('my_level')} 
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all", 
                  filterMode === 'my_level' 
                    ? "bg-slate-100 text-indigo-600" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Lock className="w-3 h-3" /> Mi Nivel
              </button>
              <button 
                onClick={() => setFilterMode('all')} 
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all", 
                  filterMode === 'all' 
                    ? "bg-slate-100 text-indigo-600" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Globe className="w-3 h-3" /> Todo
              </button>
            </div>
          )}
          
          {/* Botón Publicar (Solo Profe) */}
          {isTeacher && (
            <Button 
              onClick={() => setShowCreate(true)} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200"
            >
              <Plus className="w-5 h-5 mr-2"/> Nuevo Post
            </Button>
          )}
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto"/>
          <p className="text-slate-400 mt-4 font-medium">Cargando posts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <SocialCard 
              key={post.id} 
              post={post} 
              onClick={() => {
                if (post.url && post.url.length > 0) {
                  window.open(post.url, '_blank');
                }
              }} 
            />
          ))}
          {filteredPosts.length === 0 && (
            <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">No hay publicaciones aún.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Crear Post */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg rounded-3xl bg-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800">Crear Publicación</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 p-2">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Título *</label>
              <Input 
                placeholder="Título llamativo" 
                value={newPost.title} 
                onChange={e => setNewPost({...newPost, title: e.target.value})} 
                className="font-bold text-lg border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Descripción</label>
              <Textarea 
                placeholder="Descripción del contenido..." 
                value={newPost.content} 
                onChange={e => setNewPost({...newPost, content: e.target.value})} 
                className="bg-white border-slate-200 min-h-[100px]"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Tipo</label>
                <select 
                  className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold bg-white" 
                  value={newPost.type} 
                  onChange={e => setNewPost({...newPost, type: e.target.value})}
                >
                  <option value="text">📝 Texto</option>
                  <option value="video">🎥 Video (YouTube)</option>
                  <option value="image">🖼️ Imagen</option>
                  <option value="article">📄 Artículo</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Nivel</label>
                <select 
                  className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold bg-white" 
                  value={newPost.level} 
                  onChange={e => setNewPost({...newPost, level: e.target.value})}
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

            {(newPost.type !== 'text') && (
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">URL del Recurso</label>
                <Input 
                  placeholder="https://youtube.com/watch?v=..." 
                  value={newPost.url} 
                  onChange={e => setNewPost({...newPost, url: e.target.value})} 
                  className="bg-white border-slate-200"
                />
              </div>
            )}

            <Button 
              onClick={handleCreate} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-12 rounded-xl text-base shadow-lg shadow-indigo-200"
            >
              ✨ Publicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
