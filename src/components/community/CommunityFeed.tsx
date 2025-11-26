import React, { useState, useEffect } from 'react';
import { SocialCard } from './SocialCard';
import { Button } from '../ui/button';
import { Globe, Lock, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getCommunityPosts, createCommunityPost } from '../../lib/moodle';
import { Dialog, DialogContent } from '../ui/dialog';
import { ResourceComposer } from './ResourceComposer';
import { ArticleReader } from './ArticleReader';
import { toast } from 'sonner@2.0.3';

export const CommunityFeed = ({ student, isTeacher }: { student: any, isTeacher?: boolean }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState<'my_level' | 'all'>('my_level');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const loadPosts = async () => {
    setLoading(true);
    const data = await getCommunityPosts();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { 
    loadPosts(); 
  }, []);

  const filteredPosts = posts.filter(p => {
    if (isTeacher || filterMode === 'all') return true;
    const userLevel = student?.current_level_code || 'A1';
    return p.targetLevel === 'ALL' || p.targetLevel === userLevel;
  });

  const handlePublish = async (title: string, html: string, level: string) => {
    toast.loading("Publicando...");
    
    const success = await createCommunityPost(title, html, level);
    
    toast.dismiss();
    
    if (success) { 
      toast.success("¡Post publicado con éxito!"); 
      setShowCreate(false); 
      loadPosts(); 
    } else { 
      toast.error("Error al publicar en Moodle"); 
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-1">
            Comunidad 🌍
          </h1>
          <p className="text-slate-500 font-medium">
            Descubre recursos, cultura y contenido educativo
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {/* Filtros Alumno */}
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
          
          {/* Botón Publicar (Solo Profe) */}
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

      {/* Feed */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto"/>
          <p className="text-slate-400 mt-4 font-medium">Cargando contenido...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <SocialCard 
              key={post.id} 
              post={post} 
              onClick={() => setSelectedPost(post)} 
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

      {/* Modal Crear Post */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 border-0 bg-transparent shadow-none overflow-hidden">
          <ResourceComposer 
            onPublish={handlePublish}
            onCancel={() => setShowCreate(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Visor de Post */}
      {selectedPost && (
        <ArticleReader 
          material={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}

    </div>
  );
};
