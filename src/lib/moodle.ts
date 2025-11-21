import { projectId, publicAnonKey } from '../utils/supabase/info';

// CONFIGURACIÓN REAL
// URL de tu sitio (confirmada por el usuario)
const MOODLE_URL = "https://luingo.moodiy.com/webservice/rest/server.php";
const MOODLE_TOKEN = "8b1869dbac3f73adb6ed03421fdd8535";

// ID del Foro "Repositorio" (Confirmado por el usuario: id=4)
const TASKS_FORUM_ID = 4;

interface MoodleParams {
  [key: string]: string | number | boolean;
}

const callMoodle = async (functionName: string, params: MoodleParams = {}) => {
  // Usamos el Proxy para evitar CORS
  const proxyUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ebbb5c67/moodle-proxy`;

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({
        functionName,
        params,
        settings: {
          url: MOODLE_URL,
          token: MOODLE_TOKEN
        }
      })
    });

    const data = await response.json();

    if (data.exception) {
      console.error(`❌ Error Moodle (${functionName}):`, data.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Error Red:", error);
    return null;
  }
};

// --- FUNCIONES PÚBLICAS ---

export const getSiteInfo = async () => {
  return await callMoodle("core_webservice_get_site_info");
};

// GUARDAR TAREA (Crea un post en el foro con el JSON oculto)
export const createMoodleTask = async (title: string, description: string, jsonSettings: any) => {
  const payload = JSON.stringify(jsonSettings);
  // Guardamos el JSON en un comentario HTML invisible al final del mensaje
  const messageContent = `${description}<br/><hr/><!--JSON:${payload}-->`;

  return await callMoodle("mod_forum_add_discussion", {
    forumid: TASKS_FORUM_ID,
    subject: title,
    message: messageContent
  });
};

// LEER TAREAS (Lee los posts y extrae el JSON)
export const getMoodleTasks = async () => {
  const data = await callMoodle("mod_forum_get_forum_discussions", { forumid: TASKS_FORUM_ID });
  
  if (!data || !data.discussions) return [];

  return data.discussions.map((disc: any) => {
    // Intentar extraer el JSON oculto
    const match = disc.message.match(/<!--JSON:(.*?)-->/);
    const contentData = match ? JSON.parse(match[1]) : { type: 'text', content: disc.message };

    return {
      id: `discussion-${disc.discussion}`,
      title: disc.subject,
      description: disc.message.split('<br/><hr/>')[0].replace(/<[^>]*>?/gm, ''), // Limpiar HTML para preview
      content_data: contentData,
      category: 'homework', // Default
      status: 'published',
      color_tag: '#A8D8FF',
      created_at: new Date(disc.created * 1000).toISOString()
    };
  });
};

// 2. Obtener cursos
export const getCourses = async () => {
  return await callMoodle("core_course_get_courses");
};

// Obtener usuarios matriculados en un curso
export const getEnrolledUsers = async (courseId: number) => {
  return await callMoodle("core_enrol_get_enrolled_users", { courseid: courseId });
};
