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

// --- FUNCIONES BASE ---
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

export const createCourse = async (fullname: string, shortname: string) => 
  callMoodle("core_course_create_courses", { 
    "courses[0][fullname]": fullname, 
    "courses[0][shortname]": shortname, 
    "courses[0][categoryid]": 1,
    "courses[0][format]": "topics"
  });

// --- TAREAS ---
export const createMoodleTask = async (title: string, description: string, jsonSettings: any) => {
  const message = `${description}<br/><br/><span style="display:none;">[LUINGO_DATA]${JSON.stringify(jsonSettings)}[/LUINGO_DATA]</span>`;
  return await callMoodle("mod_forum_add_discussion", { 
    forumid: TASKS_FORUM_ID, 
    subject: title, 
    message 
  });
};

export const updateMoodleTask = async (discussionId: string | number, title: string, description: string, jsonSettings: any) => {
  const cleanId = String(discussionId).replace(/\D/g, '');
  const message = `${description}<br/><br/><span style="display:none;">[LUINGO_DATA]${JSON.stringify(jsonSettings)}[/LUINGO_DATA]</span>`;
  return await callMoodle("mod_forum_update_discussion_post", { 
    postid: cleanId, 
    subject: title, 
    message 
  });
};

export const deleteMoodleTask = async (discussionId: string | number) => {
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
      postId: disc.id, // ID del post principal para editar
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

// --- ENTREGAS AVANZADAS (SISTEMA HILOS) ---

// ✅ 1. Obtener posts de una discusión (para ver historial de intentos)
export const getSubmissionHistory = async (discussionId: string | number) => {
  const cleanId = String(discussionId).replace(/\D/g, '');
  console.log(`📜 Obteniendo historial de intentos para discusión ${cleanId}...`);
  
  const data = await callMoodle("mod_forum_get_discussion_posts", { discussionid: cleanId });
  if (!data || !data.posts) return [];
  
  // Mapear posts a intentos
  const attempts = data.posts.map((post: any) => {
    const match = post.message.match(/\[LUINGO_DATA\](.*?)\[\/LUINGO_DATA\]/);
    const json = match ? JSON.parse(match[1]) : {};
    
    return {
      id: post.id,
      isMain: post.isfirstpost || false,
      created: new Date(post.created * 1000).toISOString(),
      answers: json.answers || [],
      score: json.score || 0,
      total: json.total || 0,
      grade: json.grade || 0,
      teacher_feedback: json.teacher_feedback || '',
      graded_at: json.graded_at || null
    };
  });
  
  console.log(`✅ ${attempts.length} intentos encontrados`);
  return attempts;
};

// ✅ 2. Enviar o Actualizar Entrega (SISTEMA INTELIGENTE)
export const submitTaskResult = async (
  taskId: string, 
  taskTitle: string, 
  studentId: string, 
  studentName: string, 
  score: number, 
  total: number, 
  answers: any[] = []
) => {
  const grade = total > 0 ? (score / total) * 10 : 0;
  const safeAnswers = Array.isArray(answers) ? answers : [];
  
  console.log(`📤 Guardando resultado para ${studentName} en tarea "${taskTitle}"...`);
  
  // ✅ Buscamos si ya existe una discusión para esta tarea/alumno
  const existingSubs = await callMoodle("mod_forum_get_forum_discussions", { forumid: SUBMISSIONS_FORUM_ID });
  const subjectToFind = `Entrega: ${taskTitle} - ${studentName}`;
  const existingDisc = existingSubs?.discussions?.find((d: any) => d.subject === subjectToFind);
  
  const attemptData = { 
    score, 
    total, 
    grade, 
    answers: safeAnswers, 
    timestamp: new Date().toISOString() 
  };
  const attemptJson = JSON.stringify(attemptData);
  const attemptHtml = `<p>Intento registrado el ${new Date().toLocaleString()}</p><span style="display:none;">[LUINGO_DATA]${attemptJson}[/LUINGO_DATA]</span>`;
  
  if (existingDisc) {
    console.log(`♻️ Ya existe entrega. Añadiendo nuevo intento...`);
    
    // A) YA EXISTE: Añadir REPLY (Nuevo Intento)
    await callMoodle("mod_forum_add_discussion_post", {
      postid: existingDisc.id, // Reply al post principal
      subject: `Intento Nuevo`,
      message: attemptHtml
    });
    
    // B) ACTUALIZAR PRINCIPAL (Resumen)
    // Recuperamos datos viejos para sumar intentos
    const oldMatch = existingDisc.message.match(/\[LUINGO_DATA\](.*?)\[\/LUINGO_DATA\]/);
    const oldJson = oldMatch ? JSON.parse(oldMatch[1]) : { attempts: 0, bestGrade: 0 };
    
    const newAttemptsCount = (oldJson.attempts || 1) + 1;
    const newBestGrade = Math.max(oldJson.bestGrade || 0, grade);
    
    console.log(`📊 Actualizando resumen: ${newAttemptsCount} intentos | Mejor nota: ${newBestGrade.toFixed(1)}`);
    
    // Guardamos en el principal el "Estado Global"
    const mainPayload = { 
      ...oldJson, 
      taskId, 
      taskTitle, 
      studentId, 
      studentName, 
      attempts: newAttemptsCount, 
      grade: newBestGrade, // Nota visible en listas = La Mejor
      bestGrade: newBestGrade,
      last_answers: safeAnswers, // Guardamos las últimas para acceso rápido
      updated_at: new Date().toISOString()
    };
    
    const mainMessage = `
      <div class="luingo-result">
        <h3>Nota Actual: ${newBestGrade.toFixed(1)} / 10</h3>
        <p>Estudiante: ${studentName}</p>
        <p>Intentos: ${newAttemptsCount}</p>
        <p>Última actualización: ${new Date().toLocaleString()}</p>
      </div>
      <span style="display:none;">[LUINGO_DATA]${JSON.stringify(mainPayload)}[/LUINGO_DATA]</span>
    `;
    
    const result = await callMoodle("mod_forum_update_discussion_post", { 
      postid: existingDisc.id, 
      subject: existingDisc.subject, 
      message: mainMessage 
    });
    
    console.log(`✅ Entrega actualizada: Intento #${newAttemptsCount} guardado`);
    return result;
    
  } else {
    console.log(`🆕 Primera entrega. Creando hilo nuevo...`);
    
    // C) NO EXISTE: Crear Hilo Nuevo (Intento 1)
    const mainPayload = {
      taskId, 
      taskTitle, 
      studentId, 
      studentName,
      attempts: 1,
      grade: grade,
      bestGrade: grade,
      answers: safeAnswers,
      created_at: new Date().toISOString()
    };
    
    const message = `
      <div class="luingo-result">
        <h3>Nota: ${grade.toFixed(1)} / 10</h3>
        <p>Estudiante: ${studentName}</p>
        <p>Intentos: 1</p>
      </div>
      <span style="display:none;">[LUINGO_DATA]${JSON.stringify(mainPayload)}[/LUINGO_DATA]</span>
    `;
    
    const result = await callMoodle("mod_forum_add_discussion", { 
      forumid: SUBMISSIONS_FORUM_ID, 
      subject: `Entrega: ${taskTitle} - ${studentName}`, 
      message: message 
    });
    
    console.log(`✅ Primera entrega creada correctamente`);
    return result;
  }
};

// ✅ 3. Obtener submissions con contador real de intentos
export const getMoodleSubmissions = async () => {
  const data = await callMoodle("mod_forum_get_forum_discussions", { forumid: SUBMISSIONS_FORUM_ID });
  if (!data || !data.discussions) return [];
  
  console.log(`📥 Recuperando submissions del Foro ${SUBMISSIONS_FORUM_ID}...`);
  
  return data.discussions.map((disc: any) => {
    const match = disc.message.match(/\[LUINGO_DATA\](.*?)\[\/LUINGO_DATA\]/);
    const json = match ? JSON.parse(match[1]) : {};
    
    return {
      id: `sub-${disc.discussion}`,
      discussion_id: disc.discussion, // ✅ ID CLAVE PARA BUSCAR REPLIES
      task_id: json.taskId || 'unknown',
      task_title: json.taskTitle || disc.subject,
      student_id: json.studentId || '',
      student_name: json.studentName || disc.userfullname,
      grade: json.grade || json.bestGrade || 0,
      best_grade: json.bestGrade || json.grade || 0,
      attempts: json.attempts || 1, // ✅ LEEMOS INTENTOS REALES
      answers: json.answers || json.last_answers || [],
      teacher_feedback: json.teacher_feedback || '',
      graded_at: json.graded_at || null,
      submitted_at: new Date(disc.created * 1000).toISOString(),
      updated_at: json.updated_at || null,
      status: 'submitted'
    };
  });
};

// ✅ 4. Calificar submission (mantenido para compatibilidad con TeacherDashboard)
export const gradeSubmission = async (
  submissionId: string, 
  newGrade: number, 
  feedback: string, 
  originalData: any
) => {
  const cleanId = String(submissionId).replace(/\D/g, '');
  
  console.log("📝 Calificando submission:", { submissionId, cleanId, newGrade, feedback });

  const updatedPayload = {
    ...originalData,
    grade: newGrade,
    bestGrade: Math.max(originalData.bestGrade || 0, newGrade),
    teacher_feedback: feedback,
    graded_at: new Date().toISOString()
  };

  const jsonString = JSON.stringify(updatedPayload);

  const message = `
    <div class="luingo-result">
      <h3>Nota Final: ${newGrade.toFixed(1)} / 10</h3>
      <p>Estudiante: ${originalData.studentName}</p>
      <p>Intentos: ${originalData.attempts || 1}</p>
      <div style="background:#f0f9ff; padding:12px; border:1px solid #bae6fd; border-radius:8px; margin-top:8px;">
        <strong>✍️ Feedback del Profesor:</strong><br/>
        ${feedback || 'Sin comentarios'}
      </div>
    </div>
    <br/>
    <span style="display:none;">[LUINGO_DATA]${jsonString}[/LUINGO_DATA]</span>
  `;

  const result = await callMoodle("mod_forum_update_discussion_post", {
    postid: cleanId,
    subject: `✅ Corregido: ${originalData.taskTitle} - ${originalData.studentName}`,
    message: message
  });
  
  console.log("✅ Corrección guardada en Moodle");
  return result;
};
