import { projectId, publicAnonKey } from '../utils/supabase/info';

const MOODLE_URL = "https://luingo.moodiy.com/webservice/rest/server.php";
const MOODLE_TOKEN = "8b1869dbac3f73adb6ed03421fdd8535";
const TASKS_FORUM_ID = 4;
const SUBMISSIONS_FORUM_ID = 7;

interface MoodleParams { 
  [key: string]: string | number | boolean; 
}

const callMoodle = async (functionName: string, params: MoodleParams = {}) => {
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
        settings: { url: MOODLE_URL, token: MOODLE_TOKEN } 
      })
    });
    const data = await response.json();
    if (data.exception) return null;
    return data;
  } catch (error) { 
    return null; 
  }
};

export const getSiteInfo = async () => callMoodle("core_webservice_get_site_info");

export const getCourses = async () => callMoodle("core_course_get_courses");

export const getEnrolledUsers = async (courseId: number) => 
  callMoodle("core_enrol_get_enrolled_users", { courseid: courseId });

export const getUserByUsername = async (username: string) => {
  const data = await callMoodle("core_user_get_users_by_field", { 
    field: 'username', 
    "values[0]": username.trim().toLowerCase() 
  });
  return (Array.isArray(data) && data.length > 0) ? data[0] : null;
};

// GUARDAR TAREA (Incluyendo configuración de intentos)
export const createMoodleTask = async (title: string, description: string, jsonSettings: any) => {
  // Asegurar que max_attempts va en el JSON
  const payload = JSON.stringify(jsonSettings);
  const message = `${description}<br/><br/><p style="display:none;">[LUINGO_DATA]${payload}[/LUINGO_DATA]</p>`;
  return await callMoodle("mod_forum_add_discussion", { 
    forumid: TASKS_FORUM_ID, 
    subject: title, 
    message 
  });
};

export const updateMoodleTask = async (discussionId: string, title: string, description: string, jsonSettings: any) => {
  const cleanId = String(discussionId).replace(/\D/g, '');
  const payload = JSON.stringify(jsonSettings);
  const message = `${description}<br/><br/><p style="display:none;">[LUINGO_DATA]${payload}[/LUINGO_DATA]</p>`;
  return await callMoodle("mod_forum_update_discussion_post", { 
    postid: cleanId, 
    subject: title, 
    message 
  });
};

export const deleteMoodleTask = async (discussionId: string) => {
  const cleanId = String(discussionId).replace(/\D/g, '');
  return await callMoodle("mod_forum_delete_post", { postid: cleanId });
};

export const getMoodleTasks = async () => {
  const data = await callMoodle("mod_forum_get_forum_discussions", { forumid: TASKS_FORUM_ID });
  if (!data || !data.discussions) return [];
  
  return data.discussions.map((disc: any) => {
    const match = disc.message.match(/\[LUINGO_DATA\](.*?)\[\/LUINGO_DATA\]/);
    const contentData = match ? JSON.parse(match[1]) : { type: 'form', questions: [] };
    
    return {
      id: `discussion-${disc.discussion}`,
      title: disc.subject,
      description: disc.message.split('[LUINGO_DATA]')[0].replace(/<[^>]+?>/gm, ''),
      content_data: contentData,
      category: 'homework',
      status: 'published',
      color_tag: '#A8D8FF',
      created_at: new Date(disc.created * 1000).toISOString()
    };
  });
};

// GUARDAR ENTREGA (Con Respuestas Detalladas)
export const submitTaskResult = async (
  taskTitle: string, 
  studentName: string, 
  score: number, 
  total: number, 
  answers: any[]
) => {
  const grade = total > 0 ? (score / total) * 10 : 0;
  
  // ✅ LOG PARA DEPURAR
  console.log("📤 Enviando a Moodle:", { 
    taskTitle, 
    studentName, 
    score,
    total,
    grade: grade.toFixed(1),
    answers: answers,
    answersLength: answers.length 
  });
  
  // ✅ ESTRUCTURA JSON ROBUSTA
  const payload = { 
    score, 
    total, 
    grade: Number(grade.toFixed(2)), 
    answers, // Aquí va el array completo
    studentName, 
    taskTitle,
    timestamp: new Date().toISOString()
  };
  
  // ✅ Serializamos con cuidado
  const jsonString = JSON.stringify(payload);
  
  console.log("📦 Payload JSON (longitud):", jsonString.length);
  console.log("📦 Primeros 200 caracteres:", jsonString.substring(0, 200));
  
  const message = `
    <h3>Nota: ${grade.toFixed(1)} / 10</h3>
    <p>Alumno: ${studentName}</p>
    <p>Fecha: ${new Date().toLocaleDateString()}</p>
    <hr/>
    <!--JSON:${jsonString}-->
  `;
  
  const result = await callMoodle("mod_forum_add_discussion", { 
    forumid: SUBMISSIONS_FORUM_ID, // ID FIJO DEL BUZÓN DE ENTREGAS
    subject: `Entrega: ${taskTitle} - ${studentName}`, 
    message: message 
  });
  
  console.log("✅ Resultado guardado en Moodle");
  return result;
};

export const getMoodleSubmissions = async () => {
  const data = await callMoodle("mod_forum_get_forum_discussions", { forumid: SUBMISSIONS_FORUM_ID });
  if (!data || !data.discussions) return [];
  
  return data.discussions.map((disc: any) => {
    const match = disc.message.match(/<!--JSON:(.*?)-->/);
    const jsonData = match ? JSON.parse(match[1]) : {};
    
    return {
      id: `sub-${disc.discussion}`,
      task_title: jsonData.taskTitle || disc.subject,
      student_name: jsonData.studentName || disc.userfullname,
      grade: jsonData.grade || 0,
      score: jsonData.score || 0,
      total: jsonData.total || 0,
      answers: jsonData.answers || [], // AQUÍ ESTÁN LAS RESPUESTAS
      submitted_at: new Date(disc.created * 1000).toISOString(),
      status: 'submitted'
    };
  });
};

export const createCourse = async (fullname: string, shortname: string) => {
  const result = await callMoodle("core_course_create_courses", {
    "courses[0][fullname]": fullname,
    "courses[0][shortname]": shortname,
    "courses[0][categoryid]": 1,
  });
  return result;
};