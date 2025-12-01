import React, { useState } from 'react';
import { User, Student } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, User as UserIcon, Save, RefreshCw, GraduationCap, Camera, AtSign } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { updateMoodleUser, saveUserPreferences } from '../lib/moodle';
import { cn } from '../lib/utils';

interface ProfileEditorProps {
  user: User | Student;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: any) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, isOpen, onClose, onUpdate }) => {
  const nameParts = user.name.split(' ');
  const [firstname, setFirstname] = useState(nameParts[0] || '');
  const [lastname, setLastname] = useState(nameParts.slice(1).join(' ') || '');
  const [username, setUsername] = useState(user.email.split('@')[0]); // Fallback visual si no tenemos el username real en el objeto user aun
  const [email] = useState(user.email); // Solo estado, sin setter expuesto al UI
  
  // Lógica de Avatar
  const [avatarSeed, setAvatarSeed] = useState(user.name);
  const [avatarStyle, setAvatarStyle] = useState<'avataaars' | 'bottts' | 'lorelei' | 'micah'>('avataaars');
  
  // Lógica de Nivel
  const isStudent = user.role === 'student';
  const currentLevel = isStudent ? (user as Student).current_level_code : 'A1';
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);
  
  const [isLoading, setIsLoading] = useState(false);

  const previewAvatar = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`;

  const handleSave = async () => {
    if(!firstname.trim() || !lastname.trim() || !username.trim()) return toast.error("Todos los campos son requeridos");
    
    setIsLoading(true);
    try {
      // 1. Actualizar Moodle (Nombre/Username)
      await updateMoodleUser(user.id, { 
        firstname, 
        lastname, 
        username: username.trim().toLowerCase() 
      });

      // 2. 🔥 GUARDAR PREFERENCIA EN SUPABASE (Avatar)
      await saveUserPreferences(user.id, { 
        avatar_url: previewAvatar,
      });

      // 3. Actualizar localmente
      const updates: any = {
        name: `${firstname} ${lastname}`,
        avatar_url: previewAvatar // Esto actualiza la UI inmediatamente
      };

      onUpdate(updates);
      toast.success("¡Identidad actualizada!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar cambios");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white p-0 overflow-hidden border-0 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header Visual */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center relative shrink-0">
           <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20 rounded-full h-8 w-8">
                <span className="text-xl leading-none">×</span>
              </Button>
           </div>
           <DialogTitle className="text-xl font-black text-white flex items-center justify-center gap-2">
             <UserIcon className="w-5 h-5" /> Tu Pasaporte LuinGo
           </DialogTitle>
           {/* ✅ FIX ACCESIBILIDAD: DialogDescription agregado */}
           <DialogDescription className="text-indigo-100 text-xs mt-1 font-medium">
             Personaliza tu identidad de aprendizaje
           </DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SECCIÓN AVATAR */}
          <div className="flex flex-col items-center -mt-4">
             <div className="relative group">
                <div className="w-28 h-28 rounded-full bg-white p-1 shadow-xl relative z-10">
                  <img src={previewAvatar} className="w-full h-full rounded-full bg-slate-50 object-cover border-4 border-white" alt="Avatar" />
                </div>
                <button 
                  onClick={() => setAvatarSeed(Math.random().toString())}
                  className="absolute bottom-1 right-1 z-20 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110 border-2 border-white"
                  title="Generar nuevo look aleatorio"
                >
                   <RefreshCw className="w-4 h-4" />
                </button>
             </div>
             
             {/* ✅ FIX DISEÑO: Tabs de estilo mejorados */}
             <div className="mt-5 grid grid-cols-4 gap-2 w-full">
                {[
                  { id: 'avataaars', label: 'Persona' },
                  { id: 'bottts', label: 'Robot' },
                  { id: 'lorelei', label: 'Arte' },
                  { id: 'micah', label: 'Minimal' }
                ].map((style) => (
                   <button 
                     key={style.id}
                     onClick={() => setAvatarStyle(style.id as any)}
                     className={cn(
                       "py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all border-2",
                       avatarStyle === style.id 
                         ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                         : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                     )}
                   >
                      {style.label}
                   </button>
                ))}
             </div>
          </div>

          {/* FORMULARIO */}
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-black text-slate-400 uppercase">Nombre</Label>
                   <Input value={firstname} onChange={e => setFirstname(e.target.value)} className="h-10 font-bold border-slate-200 bg-slate-50 focus:bg-white transition-colors" />
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-black text-slate-400 uppercase">Apellido</Label>
                   <Input value={lastname} onChange={e => setLastname(e.target.value)} className="h-10 font-bold border-slate-200 bg-slate-50 focus:bg-white transition-colors" />
                </div>
             </div>

             {/* ✅ NUEVO: Username Editable */}
             <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase">Usuario (Login)</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    value={username} 
                    onChange={e => setUsername(e.target.value.trim().toLowerCase())} 
                    className="h-10 pl-9 border-slate-200 bg-slate-50 focus:bg-white font-mono text-sm text-indigo-600" 
                  />
                </div>
             </div>

             {/* ✅ FIX: Email Read-Only */}
             <div className="space-y-1.5 opacity-70">
                <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                  Email <span className="bg-slate-100 text-slate-400 px-1.5 rounded text-[9px] font-normal">No editable</span>
                </Label>
                <Input 
                  value={email} 
                  disabled 
                  className="h-10 border-slate-100 bg-slate-100 text-slate-500 cursor-not-allowed" 
                />
             </div>
          </div>

          {/* NIVEL (SOLO ESTUDIANTES - SOLO LECTURA) */}
          {isStudent && (
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                   <div className="bg-white p-2 rounded-full shadow-sm">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Tu Nivel Actual</p>
                      <p className="text-lg font-black text-slate-800">{selectedLevel}</p>
                   </div>
                </div>
                <div className="text-[10px] text-slate-400 font-medium text-center md:text-right max-w-full md:max-w-[120px] leading-tight">
                   Tu profesor asigna tu nivel de español.
                </div>
             </div>
          )}
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold text-slate-500 hover:bg-slate-200/50">Cancelar</Button>
            <Button onClick={handleSave} disabled={isLoading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-lg shadow-indigo-200">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};