import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { createMoodleTask } from '../lib/moodle';
import { sendNotification, emailTemplates } from '../lib/notifications'; // ✅ IMPORTAR
import { toast } from 'sonner@2.0.3';
import { Target, Send } from 'lucide-react';
import { Student } from '../types';

interface AssignLevelTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onAssigned: () => void;
}

export const AssignLevelTestModal: React.FC<AssignLevelTestModalProps> = ({ 
  isOpen, onClose, students, onAssigned 
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [message, setMessage] = useState('Hola, por favor completa este test de nivel para que podamos personalizar tu aprendizaje. ¡No te preocupes por la nota, solo hazlo lo mejor que puedas!');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!selectedStudentId) {
      toast.error("Selecciona un estudiante");
      return;
    }

    setIsSending(true);
    try {
      const student = students.find(s => String(s.id) === selectedStudentId);
      
      // Payload especial para Level Test
      const taskData = {
        type: 'level_test', // Flag mágico
        studentId: selectedStudentId,
        studentName: student?.name,
        teacherMessage: message,
        status: 'assigned',
        max_attempts: 1
      };

      await createMoodleTask(
        `Test de Nivel: ${student?.name}`,
        message, // Descripción visible
        {
          assignment_scope: { type: 'individual', targetId: selectedStudentId },
          content_data: taskData,
          category: 'quiz' // Para compatibilidad
        }
      );

      // ✅ ENVIAR NOTIFICACIÓN POR EMAIL
      if (student?.email) {
        await sendNotification({
          to: student.email,
          subject: "🎯 Nueva Misión: Test de Nivel",
          html: emailTemplates.levelTestAssigned(student.name, message)
        });
      }

      toast.success(`Test enviado a ${student?.name}`);
      onAssigned();
      onClose();
    } catch (e) {
      toast.error("Error al asignar el test");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl border-4 border-purple-100">
        <DialogHeader>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <DialogTitle className="text-center text-xl font-black text-slate-800">
            Asignar Test de Nivel
          </DialogTitle>
          <DialogDescription className="text-center">
            Envía una prueba diagnóstica oficial a un estudiante.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Estudiante</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full h-12 px-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:border-purple-500 focus:outline-none"
            >
              <option value="">Seleccionar alumno...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.current_level_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Mensaje Personal</label>
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-slate-50 border-2 border-slate-200 min-h-[100px] text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold text-slate-500">Cancelar</Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200"
          >
            {isSending ? "Enviando..." : "Enviar Test"} <Send className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};