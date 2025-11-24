import { projectId, publicAnonKey } from '../utils/supabase/info';

// ========== CONFIGURACIÓN ==========
const MOODLE_URL = "https://luingo.moodiy.com/webservice/rest/server.php";
const MOODLE_TOKEN = "8b1869dbac3f73adb6ed03421fdd8535";
const TASKS_FORUM_ID = 4;
const SUBMISSIONS_FORUM_ID = 7;

interface MoodleParams {
  [key: string]: string | number | boolean;
}

// ========== PROXY CENTRALIZADO ==========
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
    
    if (data.exception) {
      console.error(`❌ Moodle Error (${functionName}):`, data.exception);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Network Error (${functionName}):`, error);
    return null;
  }
};

// ========== FUNCIONES BÁSICAS ==========
export const getSiteInfo = async () => {
  return await callMoodle("core_webservice_get_site_info");
};

export const getCourses = async () => {
  return await callMoodle("core_course_get_courses");
};

export const getEnrolledUsers = async (courseId: number) => {
  return await callMoodle("core_enrol_get_enrolled_users", { courseid: courseId });
};

export const createCourse = async (fullname: string, shortname: string) => {
  return await callMoodle("core_course_create_courses", {
    "courses[0][fullname]": fullname,
    "courses[0][shortname]": shortname,
    "courses[0][categoryid]": 1,
    "courses[0][format]": "topics"
  });
};

export const getUserByUsername = async (username: string) => {
  const data = await callMoodle("core_user_get_users_by_field", {
    field: 'username',
    "values[0]": username.trim().toLowerCase()
  });
  
  return (Array.isArray(data) && data.length > 0) ? data[0] : null;
};

// ========== GESTIÓN DE TAREAS ==========
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
  
  return await callMoodle("mod_forum_delete_post", {
    postid: cleanId
  });
};

export const getMoodleTasks = async () => {
  const data = await callMoodle("mod_forum_get_forum_discussions", {
    forumid: TASKS_FORUM_ID
  });
  
  if (!data || !data.discussions) return [];
  
  return data.discussions.map((disc: any) => {
    const match = disc.message.match(/\[LUINGO_DATA\](.*?)\[\/LUINGO_DATA\]/);
    const contentData = match ? JSON.parse(match[1]) : { type: 'form', questions: [] };
    
    // ✅ FECHA SEGURA (Fix Crash)
    let created = new Date();
    try {
      if (disc.created && !isNaN(disc.created)) {
        created = new Date(disc.created * 1000);
      }
    } catch (e) {
      console.warn(`⚠️ Fecha inválida en tarea ${disc.discussion}:`, e);
    }
    
    return {
      id: `discussion-${disc.discussion}`,
      postId: disc.id,
      title: disc.subject,
      description: disc.message.split('[LUINGO_DATA]')[0].replace(/<[^>]*>?/gm, ''),
      content_data: contentData,
      category: 'homework',
      status: 'published',
      level_tag: contentData.level || 'A1',
      color_tag: '#A8D8FF',
      created_at: created.toISOString()
    };
  });
};

// ========== BORRAR POST (INTENTO) ==========
export const deleteMoodlePost = async (postId: string | number) => {
  const cleanId = String(postId).replace('post-', '');
  console.log("🗑️ Borrando intento (postId):", cleanId);
  
  return await callMoodle("mod_forum_delete_post", {
    postid: cleanId
  });
};

// ========== ✅ ENTREGAS OPTIMIZADAS (PARALELO) ==========
export const submitTaskResult = async (
  taskId: string,
  taskTitle: string,
  studentId: string,
  studentName: string,
  score: number,
  total: number,
  answers: any[]
) => {
  const grade = total > 0 ? (score / total) * 10 : 0;
  const safeAnswers = Array.isArray(answers) ? answers : [];
  
  // ✅ 1. BUSCAR HILO EXISTENTE (Optimización: Solo discusiones, no posts completos)
  const forumData = await callMoodle("mod_forum_get_forum_discussions", {
    forumid: SUBMISSIONS_FORUM_ID
  });
  
  const targetSubject = `Entrega: ${taskTitle} - ${studentName}`;
  const existingDisc = forumData?.discussions?.find((d: any) => d.subject === targetSubject);
  
  const payload = {
    taskId,
    taskTitle,
    studentId,
    studentName,
    score,
    total,
    grade,
    answers: safeAnswers,
    timestamp: new Date().toISOString()
  };
  
  const jsonString = JSON.stringify(payload);
  const messageHtml = `<div class="luingo-result">✅ Nota: ${grade.toFixed(1)}/10</div><span style="display:none;">[LUINGO_DATA]${jsonString}[/LUINGO_DATA]</span>`;

  if (existingDisc) {
    // ✅ A) ACTUALIZAR POST PRINCIPAL + AÑADIR REPLY
    console.log("🔄 Añadiendo intento a hilo existente:", existingDisc.discussion);
    
    // Actualizar el post principal con el último resultado
    await callMoodle("mod_forum_update_discussion_post", {
      postid: existingDisc.id,
      subject: existingDisc.subject,
      message: messageHtml
    });
    
    // Añadir reply como historial
    return await callMoodle("mod_forum_add_discussion_post", {
      postid: existingDisc.id,
      subject: "Intento",
      message: messageHtml
    });
  } else {
    // ✅ B) CREAR HILO NUEVO (Primer intento)
    console.log("✨ Creando nuevo hilo de entrega");
    
    return await callMoodle("mod_forum_add_discussion", {
      forumid: SUBMISSIONS_FORUM_ID,
      subject: targetSubject,
      message: messageHtml
    });
  }
};

// ========== ✅ CARGA PARALELA MASIVA (TURBO) ==========
export const getMoodleSubmissions = async () => {
  console.time("⚡ getMoodleSubmissions");
  
  const data = await callMoodle("mod_forum_get_forum_discussions", {
    forumid: SUBMISSIONS_FORUM_ID
  });
  
  if (!data || !data.discussions) {
    console.timeEnd("⚡ getMoodleSubmissions");
    return [];
  }

  console.log(`📦 Procesando ${data.discussions.length} hilos en PARALELO...`);

  // ✅ PROMISE.ALL: TODAS LAS PETICIONES EN PARALELO
  const promises = data.discussions.map(async (disc: any) => {
    try {
      const postsData = await callMoodle("mod_forum_get_discussion_posts", {
        discussionid: disc.discussion
      });
      
      if (!postsData || !postsData.posts) return [];
      
      return postsData.posts.map((post: any) => {
        const match = post.message.match(/\[LUINGO_DATA\](.*?)\[\/LUINGO_DATA\]/);
        if (!match) return null;
        
        try {
          const json = JSON.parse(match[1]);
          
          // ✅ FECHA SEGURA (Fix Crash)
          let dateStr = new Date().toISOString();
          try {
            if (post.created && !isNaN(post.created)) {
              dateStr = new Date(post.created * 1000).toISOString();
            }
          } catch (dateError) {
            console.warn(`⚠️ Fecha inválida en post ${post.id}:`, dateError);
          }
          
          return {
            id: `post-${post.id}`,
            postId: post.id,
            discussionId: disc.discussion,
            task_id: json.taskId || 'unknown',
            task_title: json.taskTitle || disc.subject.replace('Entrega: ', '').split(' - ')[0],
            student_id: json.studentId || '',
            student_name: json.studentName || disc.userfullname,
            grade: json.grade || 0,
            score: json.score || 0,
            total: json.total || 0,
            answers: json.answers || [],
            submitted_at: dateStr,
            status: 'submitted'
          };
        } catch (jsonError) {
          console.warn(`⚠️ JSON corrupto en post ${post.id}:`, jsonError);
          return null;
        }
      }).filter(Boolean); // ✅ Limpiar nulos
      
    } catch (threadError) {
      console.warn(`⚠️ Error leyendo hilo ${disc.discussion}:`, threadError);
      return [];
    }
  });

  // ✅ ESPERAR A QUE TODAS LAS PROMESAS SE RESUELVAN
  const results = await Promise.all(promises);
  const allAttempts = results.flat();
  
  console.log(`✅ Total de intentos cargados: ${allAttempts.length}`);
  console.timeEnd("⚡ getMoodleSubmissions");
  
  return allAttempts;
};

// ========== CALIFICACIÓN MANUAL ==========
export const gradeSubmission = async (postId: string | number, grade: number, feedback: string) => {
  const cleanId = String(postId).replace('post-', '');
  
  return await callMoodle("mod_forum_update_discussion_post", {
    postid: cleanId,
    subject: "Calificado",
    message: `<strong>Calificación: ${grade}/10</strong><br/>${feedback}`
  });
};
