import { projectId, publicAnonKey } from '../utils/supabase/info';

// ✅ VERSIÓN MEJORADA: Acepta tanto array como objeto con campos individuales
export const sendNotification = async (params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) => {
  const { to, subject, html, text } = params;
  
  // Normalizar 'to' a array si viene como string
  const recipients = Array.isArray(to) ? to : [to];
  
  if (!recipients || recipients.length === 0) return;
  
  try {
    // Fire and forget: No esperamos respuesta para no bloquear la UI
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebbb5c67/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
      body: JSON.stringify({ to: recipients[0], subject, html, text }) // Resend solo acepta un destinatario por request
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
  `,
  // ✅ NUEVO: Plantilla para Test de Nivel con branding
  levelTestAssigned: (studentName: string, teacherMessage: string) => `
    <div style="font-family: 'Helvetica', sans-serif; background-color: #F0F4F8; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0;">
        <div style="background: #6344A6; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🎯 Nuevo Reto: Test de Nivel</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #334155; font-size: 16px;">Hola <strong>${studentName}</strong>,</p>
          <p style="color: #475569; line-height: 1.5;">Tu profesor te ha asignado una prueba de nivel oficial.</p>
          <p style="color: #475569; line-height: 1.5;">Por favor, entra en <strong>LuinGo</strong> cuando tengas tiempo y complétala con calma.</p>
          
          <div style="background: #F3F0F9; border-left: 4px solid #F2B705; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong style="color: #6344A6; font-size: 12px; text-transform: uppercase;">Mensaje:</strong>
            <p style="margin: 5px 0 0; color: #334155; font-style: italic;">"${teacherMessage}"</p>
          </div>

          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
            Recibirás los resultados detallados y tu nivel certificado por email al finalizar.
          </p>
        </div>
      </div>
    </div>
  `
};