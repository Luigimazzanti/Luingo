import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";

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
    fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ebbb5c67/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          to: recipients[0],
          subject,
          html,
          text,
        }), // Resend solo acepta un destinatario por request
      },
    ).catch((err) =>
      console.error("Fallo silencioso email:", err),
    );
  } catch (e) {
    console.error("Error local notificación:", e);
  }
};

// Función auxiliar para generar el contenedor base con el diseño de marca
const baseTemplate = (content: string) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F0F4F8; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(99, 68, 166, 0.1);">
      ${content}
      <div style="background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
        LuinGo - Plataforma Educativa
      </div>
    </div>
  </div>
`;

export const emailTemplates = {
  newTask: (title: string, level?: string) =>
    baseTemplate(`
    <div style="background: linear-gradient(135deg, #6344A6 0%, #8B6BC7 100%); padding: 40px 0; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">🚀</div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Nueva Misión Disponible</h1>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">${title}</h2>
      <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
        Se ha publicado una nueva tarea para ti. Entra a LuinGo para completarla y ganar experiencia.
      </p>
      ${
        level
          ? `
      <div style="display: inline-block; background: #F3F0F9; color: #6344A6; padding: 8px 16px; border-radius: 50px; font-weight: bold; font-size: 14px; margin-bottom: 30px;">
        Nivel: ${level}
      </div>`
          : ""
      }
      
      <div style="text-align: center; margin-top: 10px;">
        <a href="https://luingo.es" style="background-color: #F2B705; color: #211259; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(242, 183, 5, 0.3);">
          VER MISIÓN ➜
        </a>
      </div>
    </div>
  `),

  graded: (title: string, grade: number, feedback?: string) =>
    baseTemplate(`
    <div style="background: linear-gradient(135deg, #10B981 0%, #34D399 100%); padding: 40px 0; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">📝</div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Tarea Calificada</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">Tarea</p>
      <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px;">${title}</h2>
      
      <div style="background: #ECFDF5; border: 2px solid #10B981; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 30px;">
        <span style="display: block; color: #065F46; font-size: 12px; font-weight: bold; text-transform: uppercase;">Tu Calificación</span>
        <span style="display: block; color: #059669; font-size: 48px; font-weight: 900; line-height: 1;">${grade}<span style="font-size: 24px; color: #34D399;">/10</span></span>
      </div>

      ${
        feedback
          ? `
      <div style="background: #F8FAFC; border-left: 4px solid #6344A6; padding: 20px; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #6344A6; font-weight: bold; text-transform: uppercase;">Comentario del Profesor</p>
        <p style="margin: 10px 0 0; color: #334155; line-height: 1.6;">"${feedback}"</p>
      </div>`
          : ""
      }
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://luingo.es" style="color: #6344A6; text-decoration: none; font-weight: bold; font-size: 14px;">
          Ver detalles en la plataforma &rarr;
        </a>
      </div>
    </div>
  `),

  levelUp: (level: string) =>
    baseTemplate(`
    <div style="background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); padding: 40px 0; text-align: center;">
      <div style="font-size: 64px; margin-bottom: 10px; animation: bounce 1s infinite;">🎉</div>
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">¡SUBISTE DE NIVEL!</h1>
    </div>
    <div style="padding: 40px 30px; text-align: center;">
      <p style="color: #475569; font-size: 16px; margin-bottom: 20px;">Tu esfuerzo ha dado frutos. Has desbloqueado un nuevo rango en tu aprendizaje.</p>
      
      <div style="display: inline-block; background: #FFFBEB; border: 3px solid #F59E0B; padding: 20px 40px; border-radius: 20px; transform: rotate(-2deg); box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.3);">
        <span style="display: block; color: #92400E; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Nuevo Nivel</span>
        <span style="display: block; color: #B45309; font-size: 42px; font-weight: 900;">${level}</span>
      </div>

      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        ¡Sigue así! Nuevas misiones y desafíos te esperan.
      </p>

      <div style="margin-top: 30px;">
        <a href="https://luingo.es" style="background-color: #6344A6; color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(99, 68, 166, 0.3);">
          CONTINUAR APRENDIENDO 🚀
        </a>
      </div>
    </div>
  `),

  levelTestAssigned: (
    studentName: string,
    teacherMessage: string,
  ) =>
    baseTemplate(`
    <div style="background: linear-gradient(135deg, #6344A6 0%, #8B6BC7 100%); padding: 40px 0; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">🎯</div>
      <h1 style="color: white; margin: 0; font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 24px;">Test de Nivel Oficial</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #1e293b; margin-top: 0;">Hola <strong>${studentName}</strong>,</p>
      <p style="color: #475569; line-height: 1.6;">Tu profesor te ha asignado una prueba diagnóstica. Es importante que la completes con calma para personalizar tu aprendizaje.</p>
      
      <div style="background: #F3F0F9; border-left: 4px solid #6344A6; padding: 20px; margin: 30px 0; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #6344A6; font-weight: bold; text-transform: uppercase;">Mensaje del Profesor</p>
        <p style="margin: 5px 0 0; color: #334155; font-style: italic; line-height: 1.5;">"${teacherMessage}"</p>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <a href="https://luingo.es" style="background-color: #F2B705; color: #211259; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(242, 183, 5, 0.3);">
          COMENZAR PRUEBA 🚀
        </a>
      </div>
    </div>
  `),

  // ✅ NUEVO: Notificación de Comunidad
  newCommunityPost: (
    studentName: string,
    authorName: string,
    postTitle: string,
  ) =>
    baseTemplate(`
    <div style="background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%); padding: 40px 0; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">🌍</div>
      <h1 style="color: white; margin: 0; font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 24px;">Nuevo Post en la Comunidad</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #1e293b; margin-top: 0;">Hola <strong>${studentName}</strong>,</p>
      <p style="color: #475569; line-height: 1.6;"><strong>${authorName}</strong> ha compartido un nuevo recurso que podría interesarte.</p>
      
      <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 30px 0; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #3B82F6; font-weight: bold; text-transform: uppercase;">Título de la Publicación</p>
        <p style="margin: 5px 0 0; color: #1e293b; font-weight: bold; font-size: 16px;">"${postTitle}"</p>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <a href="https://luingo.es" style="background-color: #F2B705; color: #211259; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(242, 183, 5, 0.3);">
          VER PUBLICACIÓN 🚀
        </a>
      </div>
    </div>
  `),
};