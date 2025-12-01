import { projectId, publicAnonKey } from '../utils/supabase/info';

export const sendNotification = async (to: string[], subject: string, html: string) => {
  if (!to || to.length === 0) return;
  try {
    // Fire and forget: No esperamos respuesta para no bloquear la UI
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebbb5c67/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
      body: JSON.stringify({ to, subject, html })
    }).catch(err => console.error("Fallo silencioso email:", err));
  } catch (e) {
    console.error("Error local notificación:", e);
  }
};

export const emailTemplates = {
  newTask: (title: string, level?: string) => `
    <h1>🚀 Nueva Misión: ${title}</h1>
    <p>Entra a LuinGo para completarla.</p>
    ${level ? `<p><strong>Nivel:</strong> ${level}</p>` : ''}
  `,
  graded: (title: string, grade: number, feedback?: string) => `
    <h1>📝 Tarea Calificada: ${title}</h1>
    <h2>Nota: ${grade}/10</h2>
    ${feedback ? `<p><strong>Comentario del Profesor:</strong></p><p>${feedback}</p>` : ''}
  `,
  levelUp: (level: string) => `
    <h1>🎉 ¡Subiste de Nivel!</h1>
    <p>Nuevo nivel: <strong>${level}</strong></p>
  `
};