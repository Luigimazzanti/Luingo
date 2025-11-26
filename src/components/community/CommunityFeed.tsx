import React, { useState, useEffect } from 'react';
import { SocialCard } from './SocialCard';
import { Button } from '../ui/button';
import { Globe, Lock, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getCommunityPosts, createCommunityPost, updateCommunityPost, deleteMoodleTask } from '../../lib/moodle'; // ✅ AÑADIDO deleteMoodleTask
// ✅ AÑADIDO DialogDescription para accesibilidad
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ResourceComposer } from './ResourceComposer';
import { ArticleReader } from './ArticleReader';
import { toast } from 'sonner@2.0.3';

interface CommunityFeedProps {
  student: any;
  isTeacher?: boolean;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ student, isTeacher = false }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState<'my_level' | 'all'>('my_level');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [editingPost, setEditingPost] = useState<any>(null); // ✅ NUEVO: Estado para post en edición

  // Cargar desde Moodle
  const loadPosts = async () => {
    setLoading(true);
    const data = await getCommunityPosts();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { 
    loadPosts(); 
  }, []);

  // Filtro de Nivel
  const filteredPosts = posts.filter(p => {
    if (isTeacher || filterMode === 'all') return true;
    const userLevel = student?.current_level_code || 'A1';
    return p.targetLevel === 'ALL' || p.targetLevel === userLevel;
  });

  // ✅ HANDLER UNIFICADO (Crear o Editar)
  const handlePublish = async (title: string, blocks: any[], level: string) => {
    let success = false;
    toast.loading("Publicando...");
    
    // ✅ PASAMOS 'blocks' DIRECTAMENTE A LA API
    if (editingPost) {
      success = await updateCommunityPost(editingPost.postId, title, blocks, level);
    } else {
      success = await createCommunityPost(title, blocks, level);
    }
    
    toast.dismiss();
    
    if (success) {
      toast.success(editingPost ? "✅ Post actualizado" : "✅ Publicado correctamente");
      setShowCreate(false);
      setEditingPost(null);
      loadPosts();
    } else {
      toast.error("❌ Error. Verifica la consola.");
    }
  };

  // ✅ ABRIR EDITOR EN MODO EDICIÓN
  const openEdit = (post: any) => {
    setEditingPost(post);
    setShowCreate(true); // Reutilizamos el modal de creación
  };

  // ✅ BORRAR POST DE COMUNIDAD
  const handleDeletePost = async (post: any) => {
    if (!window.confirm(`¿Borrar "${post.title}"? Esta acción eliminará la publicación de Moodle permanentemente.`)) {
      return;
    }

    toast.loading("Borrando publicación...");
    
    // Los posts de comunidad son discusiones, así que borramos la discusión completa
    const success = await deleteMoodleTask(post.discussionId);
    
    toast.dismiss();
    
    if (success) {
      toast.success("🗑️ Post eliminado correctamente");
      loadPosts(); // Recargar el feed
    } else {
      toast.error("❌ Error al borrar. Verifica permisos en Moodle.");
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
            Comunidad 🌍
          </h1>
          <p className="text-slate-500 font-medium">
            Explora contenido exclusivo y recursos educativos
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {/* Filtros (Solo Alumno) */}
          {!isTeacher && (
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex flex-1 md:flex-none">
              <button 
                onClick={() => setFilterMode('my_level')} 
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all flex-1 md:flex-none justify-center", 
                  filterMode === 'my_level' 
                    ? "bg-indigo-100 text-indigo-700" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Lock className="w-3 h-3" /> Mi Nivel
              </button>
              <button 
                onClick={() => setFilterMode('all')} 
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all flex-1 md:flex-none justify-center", 
                  filterMode === 'all' 
                    ? "bg-indigo-100 text-indigo-700" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Globe className="w-3 h-3" /> Todo
              </button>
            </div>
          )}
          
          {/* Botón Publicar (Solo Profesor) */}
          {isTeacher && (
            <Button 
              onClick={() => setShowCreate(true)} 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 w-full md:w-auto"
            >
              <Plus className="w-5 h-5 mr-2"/> Nuevo Post
            </Button>
          )}
        </div>
      </div>

      {/* Feed Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500"/>
          <p className="text-slate-400 text-sm font-bold">Cargando muro...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <SocialCard 
              key={post.id} 
              post={post} 
              onClick={() => setSelectedPost(post)} 
              onEdit={isTeacher ? () => openEdit(post) : undefined} // ✅ Solo mostrar editar si es profesor
              onDelete={isTeacher ? () => handleDeletePost(post) : undefined} // ✅ Solo mostrar borrar si es profesor
            />
          ))}
          {filteredPosts.length === 0 && (
            <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Globe className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-bold text-lg mb-2">
                {filterMode === 'my_level' ? 'No hay posts para tu nivel' : 'No hay publicaciones aún'}
              </p>
              <p className="text-slate-400 text-sm">
                {isTeacher ? 'Crea el primer post con el botón de arriba' : 'Tu profesor publicará contenido pronto'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ✅ MODAL CREACIÓN (ARREGLADO) */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 border-0 bg-transparent shadow-none flex flex-col">
          
          {/* ✅ FIX DE ACCESIBILIDAD: Títulos ocultos requeridos */}
          <DialogHeader className="sr-only">
            <DialogTitle>Crear Nuevo Recurso</DialogTitle>
            <DialogDescription>Editor multimedia para la comunidad</DialogDescription>
          </DialogHeader>
          
          {/* Contenedor Visual del Editor */}
          <div className="flex-1 bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <ResourceComposer 
              initialData={editingPost ? { 
                title: editingPost.title, 
                blocks: editingPost.blocks, // ✅ PASAMOS BLOQUES EN LUGAR DE HTML
                level: editingPost.targetLevel 
              } : undefined} // ✅ CORREGIDO: Pasar objeto initialData
              onPublish={handlePublish} 
              onCancel={() => { 
                setShowCreate(false); 
                setEditingPost(null); // Limpiar al cancelar
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Visor de Artículos */}
      {selectedPost && (
        <ArticleReader 
          material={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}

    </div>
  );
};