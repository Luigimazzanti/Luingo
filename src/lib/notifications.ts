import { projectId, publicAnonKey } from '../utils/supabase/info';

export const sendNotification = async (to: string[], subject: string, html: string) => {
  if (!to.length) return;
  try {
    // Llamada asíncrona al backend (fire and forget)
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebbb5c67/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
      body: JSON.stringify({ to, subject, html })
    }).then(res => console.log("📨 Email enviado:", res.status));
    
  } catch (e) {
    console.error("Error local enviando email:", e);
  }
};

// Plantillas HTML
export const emailTemplates = {
  newTask: (title: string, level: string) => `
    <div style="font-family: sans-serif; color: #333; padding: 20px;">
      <h1 style="color: #4F46E5;">🚀 ¡Nueva Misión Disponible!</h1>
      <p>Hola, se ha publicado una nueva tarea para: <strong>${level === 'individual' ? 'TI (Personalizada)' : 'Nivel ' + level}</strong>.</p>
      <div style="background: #EEF2FF; padding: 15px; border-radius: 12px; margin: 20px 0;">
        <h2 style="margin: 0; color: #1E1B4B;">${title}</h2>
      </div>
      <p>Entra a la plataforma para completarla.</p>
    </div>
  `,
  graded: (title: string, grade: number, feedback: string) => `
    <div style="font-family: sans-serif; color: #333; padding: 20px;">
      <h1 style="color: #10B981;">📝 ¡Tarea Calificada!</h1>
      <p>Tu entrega de <strong>${title}</strong> ha sido revisada.</p>
      <div style="border: 2px solid #10B981; padding: 15px; border-radius: 12px; display: inline-block; margin: 10px 0;">
        <h2 style="margin: 0; font-size: 32px; color: #10B981;">${grade}/10</h2>
      </div>
      <p><strong>Comentarios:</strong><br/>${feedback || 'Sin comentarios adicionales.'}</p>
    </div>
  `,
  levelUp: (newLevel: string) => `
    <div style="font-family: sans-serif; color: #333; padding: 20px; text-align: center;">
      <h1 style="color: #F59E0B;">🎉 ¡Nivel Actualizado!</h1>
      <p>Tu profesor ha actualizado tu nivel de español.</p>
      <div style="background: #FFFBEB; padding: 20px; border-radius: 50%; width: 80px; height: 80px; line-height: 80px; margin: 20px auto; border: 4px solid #F59E0B;">
        <span style="font-size: 32px; font-weight: bold; color: #F59E0B;">${newLevel}</span>
      </div>
      <p>Ahora verás actividades adaptadas a tu nuevo nivel.</p>
    </div>
  `
};
