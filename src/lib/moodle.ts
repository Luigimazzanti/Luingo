import { projectId, publicAnonKey } from '../utils/supabase/info';

// CONFIGURACIÓN REAL
// URL de tu sitio (confirmada por el usuario)
const MOODLE_URL = "https://luingo.moodiy.com/webservice/rest/server.php";
const MOODLE_TOKEN = "8b1869dbac3f73adb6ed03421fdd8535";

// ID del Foro "Repositorio" (Confirmado por el usuario: id=4)
const TASKS_FORUM_ID = 4;
const SUBMISSIONS_FORUM_ID = 7; // BUZÓN DE ENTREGAS

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

// Obtener cursos
export const getCourses = async () => {
  return await callMoodle("core_course_get_courses");
};

// Obtener usuarios matriculados en un curso
export const getEnrolledUsers = async (courseId: number) => {
  return await callMoodle("core_enrol_get_enrolled_users", { courseid: courseId });
};

// Obtener usuario por nombre de usuario (Login)
export const getUserByUsername = async (username: string) => {
  const data = await callMoodle("core_user_get_users_by_field", {
    field: 'username',
    values: [username]
  });
  
  // La API devuelve un array de usuarios
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  return null;
};

// GUARDAR TAREA (Crea un post en el foro con el JSON oculto)
export const createMoodleTask = async (title: string, description: string, jsonSettings: any) => {
  const payload = JSON.stringify(jsonSettings);
  // El secreto está en el comentario HTML oculto
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
    // Rescatamos el JSON
    const match = disc.message.match(/<!--JSON:(.*?)-->/);
    const contentData = match ? JSON.parse(match[1]) : { type: 'form', questions: [] };

    return {
      id: `discussion-${disc.discussion}`,
      title: disc.subject,
      description: disc.message.split('<br/><hr/>')[0].replace(/<[^>]*>?/gm, ''),
      content_data: contentData,
      category: 'homework',
      status: 'published',
      color_tag: '#A8D8FF',
      created_at: new Date(disc.created * 1000).toISOString()
    };
  });
};

// ENVIAR RESULTADO (Crea un post en el foro 7)
export const submitTaskResult = async (taskTitle: string, studentName: string, score: number, total: number) => {
  const grade = (score / total) * 10; // Nota sobre 10
  const subject = `Entrega: ${taskTitle} - ${studentName}`;

  // Creamos un reporte visual bonito para Moodle y el JSON oculto para nosotros
  const message = `
    <h3>Resultado: ${grade.toFixed(1)} / 10</h3>
    <p>El estudiante <strong>${studentName}</strong> ha completado la tarea.</p>
    <ul>
      <li>Aciertos: ${score}</li>
      <li>Total Preguntas: ${total}</li>
    </ul>
    <hr/>
    <!--JSON:{"score":${score},"total":${total},"grade":${grade}}-->
  `;

  return await callMoodle("mod_forum_add_discussion", { 
    forumid: SUBMISSIONS_FORUM_ID, 
    subject: subject, 
    message: message 
  });
};
