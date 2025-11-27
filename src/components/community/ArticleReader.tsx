import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  MessageCircle,
  Heart,
  User,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
// ✅ CORRECCIÓN AQUÍ: Usamos el nombre correcto 'toggleCommunityLike'
import {
  addCommunityComment,
  getPostComments,
  toggleCommunityLike,
} from "../../lib/moodle";
import { toast } from "sonner@2.0.3";

export const ArticleReader: React.FC<{
  material: any;
  currentUserId: string;
  onClose: () => void;
  onLikeUpdate?: () => void;
}> = ({ material, currentUserId, onClose, onLikeUpdate }) => {
  const [comment, setComment] = useState("");
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [likesCount, setLikesCount] = useState(
    Array.isArray(material.likes) ? material.likes.length : 0,
  );
  const [isLiked, setIsLiked] = useState(
    Array.isArray(material.likes) &&
      material.likes.includes(String(currentUserId)),
  );
  const [isLiking, setIsLiking] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar comentarios al abrir
  useEffect(() => {
    const loadComments = async () => {
      setLoading(true);
      const comments = await getPostComments(
        material.discussionId,
      );
      setCommentsList(comments);
      setLoading(false);
    };
    loadComments();
  }, [material.discussionId]);

  // Enviar comentario
  const handleSend = async () => {
    if (!comment.trim()) return;

    // ✅ Aquí ya usa la función correcta que definimos en moodle.ts
    const success = await addCommunityComment(
      material.discussionId,
      comment,
    );

    if (success) {
      toast.success("💬 Comentario enviado");
      setComment("");
      // Recargar comentarios
      const updatedComments = await getPostComments(
        material.discussionId,
      );
      setCommentsList(updatedComments);
    } else {
      toast.error(
        "❌ No se pudo enviar. Verifica tu conexión o sesión.",
      );
    }
  };

  // Toggle Like
  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic UI
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    // ✅ Llamada a la función corregida
    const success = await toggleCommunityLike(
      material,
      currentUserId,
    );

    if (success) {
      onLikeUpdate?.();
    } else {
      // Rollback si falla
      setIsLiked(wasLiked);
      setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
      toast.error("❌ Error al guardar like");
    }

    setIsLiking(false);
  };

  // Renderizado de bloques
  const renderBlock = (b: any, idx: number) => {
    if (!b.content) return null;

    switch (b.type) {
      case "text":
        return (
          <p
            key={idx}
            className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap"
          >
            {b.content}
          </p>
        );

      case "image":
        return (
          <img
            key={idx}
            src={b.content}
            className="w-full rounded-2xl shadow-sm border border-slate-100"
            alt="Post"
          />
        );

      case "video":
        const vId =
          b.content.match(
            /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^&?]*)/,
          )?.[1] || "";
        if (vId) {
          return (
            <div
              key={idx}
              className="aspect-video rounded-2xl overflow-hidden shadow-lg bg-black"
            >
              <iframe
                src={`https://www.youtube.com/embed/${vId}`}
                className="w-full h-full"
                allowFullScreen
                frameBorder="0"
              />
            </div>
          );
        } else {
          return (
            <a
              key={idx}
              href={b.content}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 bg-slate-100 rounded-2xl text-center text-blue-600 font-bold"
            >
              🎬 Ver Video en YouTube
            </a>
          );
        }

      case "genially":
        return (
          <div
            key={idx}
            className="w-full rounded-2xl overflow-hidden shadow-lg border border-slate-100"
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
            }}
          >
            <iframe
              src={b.content}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
              allowFullScreen
              frameBorder="0"
            />
          </div>
        );

      case "audio":
        return (
          <div
            key={idx}
            className="bg-slate-100 p-4 rounded-2xl flex justify-center"
          >
            <audio
              controls
              src={b.content}
              className="w-full"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-8 md:px-12 py-12 md:py-16">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={
                  material.avatar ||
                  "https://ui-avatars.com/api/?name=U&background=6366f1&color=fff"
                }
                className="w-12 h-12 rounded-full ring-4 ring-white/30 shadow-lg"
                alt={material.author}
              />
              <div>
                <p className="font-black text-white text-lg">
                  {material.author}
                </p>
                <p className="text-indigo-100 text-sm">
                  {new Date(material.date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
              {material.title}
            </h1>

            <div className="mt-4 flex items-center gap-3 flex-wrap">
              {material.targetLevel &&
                material.targetLevel !== "ALL" && (
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                    <span className="text-white text-xs font-bold">
                      🎯 Nivel {material.targetLevel}
                    </span>
                  </div>
                )}

              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all group"
              >
                <Heart
                  className={`w-4 h-4 text-white transition-all ${isLiked ? "fill-white scale-110" : "group-hover:fill-white"}`}
                />
                <span className="text-white text-sm font-bold">
                  {likesCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 md:px-12 py-8 md:py-12 bg-white">
          <div className="space-y-8">
            {material.blocks?.length > 0 ? (
              material.blocks.map((b: any, i: number) =>
                renderBlock(b, i),
              )
            ) : (
              <div
                className="prose prose-slate max-w-none text-lg leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: material.content || "Sin contenido",
                }}
              />
            )}
          </div>
        </div>

        {/* Sección de Comentarios */}
        <div className="bg-slate-50 p-8 md:p-12 border-t border-slate-200">
          <h3 className="font-black text-slate-800 mb-6 flex gap-2 items-center">
            <MessageCircle className="w-5 h-5 text-indigo-600" />
            Comentarios ({commentsList.length})
          </h3>

          {/* Input */}
          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comenta algo..."
                className="w-full h-12 rounded-2xl pr-12 bg-white border-slate-200"
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  handleSend()
                }
              />
              <button
                onClick={handleSend}
                disabled={!comment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="text-center py-8 text-slate-400">
              Cargando comentarios...
            </div>
          ) : commentsList.length > 0 ? (
            <div className="space-y-4">
              {commentsList.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        c.avatar ||
                        "https://ui-avatars.com/api/?name=U&background=94a3b8&color=fff"
                      }
                      className="w-8 h-8 rounded-full flex-shrink-0"
                      alt={c.author}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 text-sm">
                          {c.author}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(
                            c.date,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              No hay comentarios aún. ¡Sé el primero!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};