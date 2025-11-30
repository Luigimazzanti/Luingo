import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import { requestPasswordReset } from '../lib/moodle';
import { toast } from 'sonner@2.0.3';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, initialValue = '' }) => {
  const [input, setInput] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      await requestPasswordReset(input);
      setIsSuccess(true);
      // No mostramos error si falla para no dar pistas de usuarios existentes (Security by Obscurity estándar de Moodle)
    } catch (error) {
      console.error(error);
      // Aún si falla la API, solemos mostrar éxito visual por seguridad, o un error genérico
      setIsSuccess(true); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInput('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="mb-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4 mx-auto text-indigo-600">
            {isSuccess ? <CheckCircle2 className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <DialogTitle className="text-center text-2xl font-black text-slate-800">
            {isSuccess ? '¡Correo Enviado!' : 'Recuperar Contraseña'}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500">
            {isSuccess 
              ? 'Si la cuenta existe, recibirás un email con instrucciones en unos minutos.'
              : 'Ingresa tu usuario o correo electrónico de Moodle para restablecer tu clave.'
            }
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex justify-center pb-4">
            <Button onClick={handleClose} className="bg-slate-900 text-white font-bold rounded-xl px-8">
              Entendido, gracias
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-2 pb-2">
            <div className="space-y-2">
              <Label htmlFor="reset-input" className="text-xs font-bold text-slate-500 uppercase">Usuario o Email</Label>
              <Input
                id="reset-input"
                placeholder="ej: alumno o alumno@email.com"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-12 text-lg border-2 focus:border-indigo-500"
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-lg shadow-lg shadow-indigo-200 transition-all"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Enviar Instrucciones <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
