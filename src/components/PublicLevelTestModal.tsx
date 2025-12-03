import React, { useState } from "react";
import { LevelTestPlayer } from "./LevelTestPlayer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { sendNotification, emailTemplates } from "../lib/notifications";
import { Mail, UserCircle, Send } from "lucide-react";

interface PublicLevelTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublicLevelTestModal: React.FC<PublicLevelTestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [started, setStarted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [friendEmail, setFriendEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    // Validación básica de email
    if (!formData.email.includes("@")) {
      toast.error("Email inválido");
      return;
    }

    setStarted(true);
  };

  const handleShareWithFriend = async () => {
    if (!friendEmail.trim() || !friendEmail.includes("@")) {
      toast.error("Introduce un email válido");
      return;
    }

    try {
      await sendNotification({
        to: friendEmail,
        subject: "🎯 Te invitaron a hacer un Test de Nivel - LuinGo",
        html: emailTemplates.invite(friendEmail),
      });

      toast.success("✅ Invitación enviada a " + friendEmail);
      setFriendEmail("");
    } catch (error) {
      toast.error("Error al enviar la invitación");
    }
  };

  const handleCloseModal = () => {
    setStarted(false);
    setFormData({ name: "", email: "" });
    setFriendEmail("");
    onClose();
  };

  // ✅ EARLY RETURN: Si el test ya comenzó, renderizar SOLO el Player (full-screen)
  if (started) {
    return (
      <LevelTestPlayer
        studentName={formData.name}
        studentId={`guest-${Date.now()}`}
        studentEmail={formData.email}
        teacherEmail="admin@luingo.es"
        taskId="public-level-test"
        isPublic={true}
        onExit={handleCloseModal}
      />
    );
  }

  // Si NO ha comenzado, mostrar el Dialog con el formulario
  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-indigo-600 flex items-center gap-2">
            🎯 Test de Nivel Público
          </DialogTitle>
          <DialogDescription className="text-slate-600 pt-2">
            Descubre tu nivel de español en 15 minutos. <strong>100% gratis</strong> y sin
            necesidad de registro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="name" className="text-sm font-bold text-slate-700">
              <UserCircle className="w-4 h-4 inline mr-1" />
              Nombre Completo *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ej: María González"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-bold text-slate-700">
              <Mail className="w-4 h-4 inline mr-1" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="tu@email.com"
              className="mt-1.5"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Te enviaremos los resultados aquí
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg"
          >
            Comenzar Test 🚀
          </Button>
        </form>

        {/* SECCIÓN COMPARTIR */}
        <div className="pt-6 mt-6 border-t border-slate-200">
          <h3 className="text-sm font-black text-slate-700 mb-3 uppercase tracking-wide">
            📤 Invitar a un amigo
          </h3>
          <div className="flex gap-2">
            <Input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="email@detuamigo.com"
              className="flex-1"
            />
            <Button
              onClick={handleShareWithFriend}
              variant="outline"
              className="px-4 font-bold"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};