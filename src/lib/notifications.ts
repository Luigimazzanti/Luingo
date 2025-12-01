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
    <div style="font-family: sans-serif; background-color: #F0F4F8; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #6344A6 0%, #8B6BC7 100%); padding: 40px 0; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">🎯</div>
          <h1 style="color: white; margin: 0; font-family: 'Poppins', sans-serif;">Test de Nivel Oficial</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 18px; color: #1e293b;">Hola <strong>${studentName}</strong>,</p>
          <p style="color: #475569; line-height: 1.6;">Tu profesor te ha asignado una prueba diagnóstica. Es importante que la completes con calma para personalizar tu aprendizaje.</p>
          
          <div style="background: #F3F0F9; border-left: 4px solid #6344A6; padding: 20px; margin: 30px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 12px; color: #6344A6; font-weight: bold; text-transform: uppercase;">Mensaje del Profesor</p>
            <p style="margin: 5px 0 0; color: #334155; font-style: italic;">"${teacherMessage}"</p>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <a href="https://luingo.web.app" style="background-color: #F2B705; color: #211259; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(242, 183, 5, 0.3);">
              COMENZAR PRUEBA 🚀
            </a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
          LuinGo - Plataforma Educativa
        </div>
      </div>
    </div>
  `
};