import React, { useState, useEffect } from "react";
import { SocialCard } from "./SocialCard";
import { Button } from "../ui/button";
import { Globe, Lock, Plus, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  getCommunityPosts,
  createCommunityPost,
  updateCommunityPost,
  deleteMoodleTask,
  toggleCommunityLike,
} from "../../lib/moodle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { ResourceComposer } from "./ResourceComposer";
import { ArticleReader } from "./ArticleReader";
import { toast } from "sonner@2.0.3";

interface CommunityFeedProps {
  student: any;
  isTeacher?: boolean;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  student,
  isTeacher = false,
}) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState<
    "my_level" | "all"
  >("my_level");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [editingPost, setEditingPost] = useState<any>(null);

  // ✅ LOGICA DE RECARGA SINCRONIZADA
  const loadPosts = async () => {
    // Si es la primera carga, mostramos loading spinner grande
    if (posts.length === 0) setLoading(true);

    const data = await getCommunityPosts();
    setPosts(data);
    setLoading(false);

    // 🔥 SINCRONIZACIÓN MÁGICA 🔥
    // Si tenemos un post abierto en el visor, actualizamos sus datos (likes, etc)
    // usando la información nueva que acabamos de bajar.
    if (selectedPost) {
      const updatedSelected = data.find(
        (p) => p.id === selectedPost.id,
      );
      if (updatedSelected) {
        setSelectedPost(updatedSelected);
      }
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = posts.filter((p) => {
    if (isTeacher || filterMode === "all") return true;
    const userLevel = student?.current_level_code || "A1";
    return (
      p.targetLevel === "ALL" || p.targetLevel === userLevel
    );
  });

  const handlePublish = async (
    title: string,
    blocks: any[],
    level: string,
  ) => {
    toast.loading("Publicando...");
    let success = false;
    if (editingPost) {
      success = await updateCommunityPost(
        editingPost.postId,
        title,
        blocks,
        level,
        editingPost.likes,
      );
    } else {
      success = await createCommunityPost(title, blocks, level);
    }
    toast.dismiss();

    if (success) {
      toast.success("✅ Publicado correctamente");
      setShowCreate(false);
      setEditingPost(null);
      loadPosts();
    } else {
      toast.error("❌ Error al publicar");
    }
  };

  const handleLike = async (post: any) => {
    const userId = student?.id || "0";
    // Optimistic Update Local para feedback instantáneo en el Feed
    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.id === post.id) {
          const likes = p.likes || [];
          const isLiked = likes.includes(String(userId));
          const newLikes = isLiked
            ? likes.filter(
                (id: string) => id !== String(userId),
              )
            : [...likes, String(userId)];
          return { ...p, likes: newLikes };
        }
        return p;
      }),
    );

    // Llamada real al backend
    await toggleCommunityLike(post, userId);

    // Recargar para confirmar datos reales (background refresh)
    loadPosts();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
            Comunidad 🌍
          </h1>
          <p className="text-slate-500 font-medium">
            Explora contenido exclusivo
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {!isTeacher && (
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex flex-1 md:flex-none">
              <button
                onClick={() => setFilterMode("my_level")}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 flex-1 md:flex-none justify-center transition-colors",
                  filterMode === "my_level"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                <Lock className="w-3 h-3" /> Mi Nivel
              </button>
              <button
                onClick={() => setFilterMode("all")}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 flex-1 md:flex-none justify-center transition-colors",
                  filterMode === "all"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                <Globe className="w-3 h-3" /> Todo
              </button>
            </div>
          )}
          {isTeacher && (
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" /> Nuevo Post
            </Button>
          )}
        </div>
      </div>

      {loading && posts.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-slate-400 text-sm font-bold">
            Cargando muro...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <SocialCard
              key={post.id}
              post={post}
              currentUserId={student?.id || "0"}
              onClick={() => setSelectedPost(post)}
              onLike={() => handleLike(post)}
              onEdit={
                isTeacher
                  ? () => {
                      setEditingPost(post);
                      setShowCreate(true);
                    }
                  : undefined
              }
              onDelete={
                isTeacher
                  ? async () => {
                      if (confirm("¿Borrar post?")) {
                        await deleteMoodleTask(
                          post.discussionId,
                        );
                        loadPosts();
                      }
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 border-0 bg-transparent shadow-none flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Editor</DialogTitle>
            <DialogDescription>
              Crear contenido
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <ResourceComposer
              initialData={
                editingPost
                  ? {
                      title: editingPost.title,
                      blocks: editingPost.blocks,
                      level: editingPost.targetLevel,
                    }
                  : undefined
              }
              onPublish={handlePublish}
              onCancel={() => {
                setShowCreate(false);
                setEditingPost(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {selectedPost && (
        <ArticleReader
          material={selectedPost}
          currentUserId={student?.id || "0"}
          onClose={() => setSelectedPost(null)}
          onLikeUpdate={loadPosts} // ✅ Al dar like dentro, se actualiza afuera y se refresca el modal
        />
      )}
    </div>
  );
};