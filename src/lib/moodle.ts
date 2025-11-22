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
  const safeUsername = username.trim().toLowerCase();
  
  console.log("🔍 Buscando usuario:", safeUsername);
  // USAMOS LA SINTAXIS CORRECTA PARA MOODLE (values[0]) 
  const data = await callMoodle("core_user_get_users_by_field", { field: 'username', "values[0]": safeUsername });

  if (Array.isArray(data) && data.length > 0) { 
    console.log("✅ Usuario encontrado:", data[0].fullname); 
    return data[0]; 
  }

  console.error("❌ Usuario no encontrado o error:", data); 
  return null; 
};

// GUARDAR TAREA (Estrategia Texto Robusto)
export const createMoodleTask = async (title: string, description: string, jsonSettings: any) => {
  const payload = JSON.stringify(jsonSettings);
  // Usamos una etiqueta de texto explícita que Moodle NO borrará
  const messageContent = `${description}<br/><br/><p style="display:none;">[LUINGO_DATA]${payload}[/LUINGO_DATA]</p>`;
  
  return await callMoodle("mod_forum_add_discussion", { 
    forumid: TASKS_FORUM_ID, 
    subject: title, 
    message: messageContent 
  });
};

// LEER TAREAS
export const getMoodleTasks = async () => {
  const data = await callMoodle("mod_forum_get_forum_discussions", { forumid: TASKS_FORUM_ID });
  
  if (!data || !data.discussions) return [];

  return data.discussions.map((disc: any) => {
    // Buscamos el delimitador de texto
    const match = disc.message.match(/\[LUINGO_DATA\](.*?)\[\/LUINGO_DATA\]/);
    const contentData = match ? JSON.parse(match[1]) : { type: 'form', questions: [] };

    return {
      id: `discussion-${disc.discussion}`,
      postId: disc.id, // ID del post inicial para edición
      title: disc.subject,
      description: disc.message.split('[LUINGO_DATA]')[0].replace(/<[^>]*>?/gm, ''), // Limpiar HTML
      content_data: contentData,
      max_attempts: contentData.max_attempts, // Extraer max_attempts del JSON
      category: 'homework',
      status: 'published',
      color_tag: '#A8D8FF',
      created_at: new Date(disc.created * 1000).toISOString()
    };
  });
};

// ENVIAR RESULTADO (Crea un post en el foro 7)
export const submitTaskResult = async (taskId: string, taskTitle: string, studentId: string, studentName: string, score: number, total: number, answers: any[] = []) => {
  const grade = (score / total) * 10; // Nota sobre 10
  const subject = `Entrega: ${taskTitle} - ${studentName}`;

  // JSON completo con toda la información necesaria para el portafolio
  const jsonPayload = JSON.stringify({
    taskId,
    taskTitle,
    studentId,
    studentName,
    score,
    total,
    grade,
    answers
  });

  // Creamos un reporte visual bonito para Moodle y el JSON oculto para nosotros
  const message = `
    <h3>Resultado: ${grade.toFixed(1)} / 10</h3>
    <p>El estudiante <strong>${studentName}</strong> ha completado la tarea.</p>
    <ul>
      <li>Aciertos: ${score}</li>
      <li>Total Preguntas: ${total}</li>
    </ul>
    <hr/>
    <!--JSON:${jsonPayload}-->
  `;

  return await callMoodle("mod_forum_add_discussion", { 
    forumid: SUBMISSIONS_FORUM_ID, 
    subject: subject, 
    message: message 
  });
};

// LEER ENTREGAS (Desde el Foro 7 - Recuperar memoria del alumno)
export const getMoodleSubmissions = async () => {
  // ID del Foro de Entregas
  const SUBMISSIONS_FORUM_ID = 7; 
  
  const data = await callMoodle("mod_forum_get_forum_discussions", { forumid: SUBMISSIONS_FORUM_ID });
  
  if (!data || !data.discussions) return [];

  return data.discussions.map((disc: any) => {
    const match = disc.message.match(/<!--JSON:(.*?)-->/);
    const jsonData = match ? JSON.parse(match[1]) : {};

    // Extraer task_id del subject si viene en formato "Entrega: TaskTitle - StudentName"
    const taskTitle = disc.subject.replace('Entrega: ', '').split(' - ')[0];

    return {
      id: `sub-${disc.discussion}`,
      task_id: jsonData.taskId || taskTitle, // Guardar referencia a la tarea
      task_title: jsonData.taskTitle || taskTitle,
      student_id: String(disc.userid || ''), // ID numérico del usuario en Moodle
      student_name: jsonData.studentName || disc.userfullname, // Nombre real del alumno
      student_email: disc.useremail || '', // Email si está disponible
      score: jsonData.score || 0,
      total: jsonData.total || 0,
      grade: jsonData.grade || 0,
      answers: jsonData.answers || [], // Respuestas guardadas
      submitted_at: new Date(disc.created * 1000).toISOString(),
      status: 'submitted'
    };
  });
};

// CREAR CURSO (Nueva Clase)
export const createCourse = async (fullname: string, shortname: string) => {
  return await callMoodle("core_course_create_courses", {
    "courses[0][fullname]": fullname,
    "courses[0][shortname]": shortname,
    "courses[0][categoryid]": 1, // Default category
    "courses[0][format]": "topics"
  });
};

// BORRAR TAREA (Elimina el post del foro)
export const deleteMoodleTask = async (discussionId: string | number) => {
  // CORRECCIÓN: Asegurar que es string antes de replace
  const cleanId = String(discussionId).replace(/\D/g, '');
  
  // Usamos delete_post que borra el hilo entero si es el post inicial
  return await callMoodle("mod_forum_delete_post", { postid: cleanId });
};

// ACTUALIZAR TAREA (Edita el post del foro)
export const updateMoodleTask = async (discussionId: string | number, title: string, description: string, jsonSettings: any) => {
  const payload = JSON.stringify(jsonSettings);
  const message = `${description}<br/><br/><p style="display:none;">[LUINGO_DATA]${payload}[/LUINGO_DATA]</p>`;
  
  // CORRECCIÓN: Asegurar que es string antes de replace
  const cleanId = String(discussionId).replace(/\D/g, '');
  
  return await callMoodle("mod_forum_update_discussion_post", { 
    postid: cleanId, 
    subject: title, 
    message: message 
  });
};