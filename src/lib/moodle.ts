import { projectId, publicAnonKey } from '../utils/supabase/info';

// ========== CONFIGURACIÓN ==========
const MOODLE_URL = "https://luingo.moodiy.com/webservice/rest/server.php";
const MOODLE_TOKEN = "8b1869dbac3f73adb6ed03421fdd8535";
const TASKS_FORUM_ID = 4;
const SUBMISSIONS_FORUM_ID = 7;

interface MoodleParams {
  [key: string]: string | number | boolean;
}

// ========== ✅ PROXY CON SAFE PARSE (FIX CRASH) ==========
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

    // ✅ SAFE PARSE: Primero leer como texto, luego intentar parsear
    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      if (data.exception) { 
        console.warn(`⚠️ Moodle Exception (${functionName}):`, data.message); 
        return null; 
      }
      return data;
    } catch (parseError) {
      console.error(`❌ Error parseando JSON de Moodle (${functionName}):`, text.substring(0, 100));
      return null;
    }
  } catch (error) {
    console.error(`❌ Error de Red (${functionName}):`, error);
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
    const contentData = match ? JSON.parse(match[1]) : { type: 'quiz', questions: [] };
    
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
      discussionId: disc.discussion,
      title: disc.subject,
      description: disc.message.split('[LUINGO_DATA]')[0].replace(/<[^>]*>?/gm, ''),
      content_data: contentData,
      category: 'homework',
      status: 'published',
      level_tag: contentData.level || 'A1',
      color_tag: '#A8D8FF',
      due_date: contentData.due_date || null, // ✅ FECHA LÍMITE PARA WRITING
      created_at: created.toISOString()
    };
  });
};

// ========== BORRAR POST (INTENTO) - BORRADO INTELIGENTE ==========
export const deleteMoodlePost = async (
  postId: string | number, 
  discussionId?: string | number
): Promise<boolean> => {
  const cleanPostId = String(postId).replace(/post-|sub-|discussion-/g, '');
  console.log("🗑️ Intentando borrar Post:", cleanPostId);

  try {
    // 1️⃣ INTENTAR BORRAR COMO POST NORMAL
    const resPost = await callMoodle("mod_forum_delete_post", { 
      postid: cleanPostId 
    });

    console.log("📋 Respuesta de mod_forum_delete_post:", resPost);

    // ✅ Verificar si el borrado fue exitoso
    if (resPost && resPost.status === true) {
      console.log("✅ Post borrado correctamente de Moodle");
      return true;
    }

    // 2️⃣ FALLBACK: Si falla y tenemos discussionId, intentar borrar la discusión entera
    if (discussionId) {
      const cleanDiscId = String(discussionId).replace(/\D/g, '');
      console.log("⚠️ Falló borrar post. Intentando borrar Discusión completa:", cleanDiscId);

      const resDisc = await callMoodle("mod_forum_delete_discussion", { 
        discussionid: cleanDiscId 
      });

      console.log("📋 Respuesta de mod_forum_delete_discussion:", resDisc);

      if (resDisc && (resDisc.status === true || resDisc.warnings?.length === 0)) {
        console.log("✅ Discusión borrada correctamente de Moodle");
        return true;
      }
    }

    console.error("❌ No se pudo borrar en Moodle. Respuesta:", resPost);
    return false;

  } catch (error) {
    console.error("❌ Error al intentar borrar:", error);
    return false;
  }
};

// ========== ✅ ENTREGAS (CON SOPORTE WRITING) ==========
export const submitTaskResult = async (
  taskId: string,
  taskTitle: string,
  studentId: string,
  studentName: string,
  score: number,
  total: number,
  answers: any[],
  textContent?: string, // ✅ NUEVO: Texto de redacción
  status: 'submitted' | 'draft' | 'graded' = 'submitted', // ✅ NUEVO: Estado
  corrections?: any[] // ✅ NUEVO: Correcciones del profesor
) => {
  const grade = total > 0 ? (score / total) * 10 : 0;
  const safeAnswers = Array.isArray(answers) ? answers : [];
  
  // ✅ 1. BUSCAR HILO EXISTENTE
  const forumData = await callMoodle("mod_forum_get_forum_discussions", {
    forumid: SUBMISSIONS_FORUM_ID
  });
  
  const targetSubject = `Entrega: ${taskTitle} - ${studentName}`;
  const existingDisc = forumData?.discussions?.find((d: any) => d.subject === targetSubject);
  
  // ✅ PAYLOAD EXTENDIDO CON DATOS WRITING
  const payload = {
    taskId,
    taskTitle,
    studentId,
    studentName,
    score,
    total,
    grade,
    answers: safeAnswers,
    textContent, // ✅ Guardamos texto de redacción
    status, // ✅ Guardamos estado (draft, submitted, graded)
    corrections, // ✅ Guardamos correcciones del profesor
    timestamp: new Date().toISOString()
  };
  
  const jsonString = JSON.stringify(payload);
  
  // ✅ MENSAJE VISUAL DIFERENCIADO
  let displayHtml = '';
  if (textContent) {
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
    const statusLabel = status === 'draft' ? '📝 Borrador' : status === 'submitted' ? '📤 Enviado' : '✅ Calificado';
    displayHtml = `<div class="luingo-writing">
      <strong>${statusLabel}</strong><br/>
      Palabras: ${wordCount}
    </div>`;
  } else {
    displayHtml = `<div class="luingo-result">✅ Nota: ${grade.toFixed(1)}/10</div>`;
  }
  
  const messageHtml = `${displayHtml}<span style="display:none;">[LUINGO_DATA]${jsonString}[/LUINGO_DATA]</span>`;

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
    const replySubject = status === 'draft' ? "Borrador Guardado" : status === 'submitted' ? "Entrega Final" : "Intento";
    return await callMoodle("mod_forum_add_discussion_post", {
      postid: existingDisc.id,
      subject: replySubject,
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

// ========== ✅ CARGA BATCH SAFE (FIX CRASH DE RED) ==========
export const getMoodleSubmissions = async () => {
  console.log("🔄 Cargando entregas con batching seguro...");
  console.time("⚡ getMoodleSubmissions");
  
  const data = await callMoodle("mod_forum_get_forum_discussions", {
    forumid: SUBMISSIONS_FORUM_ID
  });
  
  if (!data || !data.discussions) {
    console.timeEnd("⚡ getMoodleSubmissions");
    return [];
  }

  const discussions = data.discussions;
  console.log(`📦 ${discussions.length} hilos encontrados. Procesando en BATCHES...`);

  let allAttempts: any[] = [];
  const BATCH_SIZE = 5; // ✅ PROCESAR SOLO 5 HILOS A LA VEZ

  // ✅ PROCESAMIENTO EN LOTES
  for (let i = 0; i < discussions.length; i += BATCH_SIZE) {
    const batch = discussions.slice(i, i + BATCH_SIZE);
    console.log(`🔄 Procesando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(discussions.length / BATCH_SIZE)}...`);

    const promises = batch.map(async (disc: any) => {
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
            
            // ✅ FECHA SEGURA
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
              teacher_feedback: json.teacher_feedback || null,
              submitted_at: dateStr,
              // ✅ CAMPOS WRITING (compatibilidad con ambos nombres)
              status: json.status || 'submitted', // draft, submitted, graded
              textContent: json.textContent || json.text_content || '', // ✅ Leer ambas versiones
              text_content: json.textContent || json.text_content || '', // ✅ Retrocompatibilidad
              word_count: json.word_count || 0,
              corrections: json.corrections || [],
              original_payload: json
            };
          } catch (jsonError) {
            console.warn(`⚠️ JSON corrupto en post ${post.id}:`, jsonError);
            return null;
          }
        }).filter(Boolean);
        
      } catch (threadError) {
        console.warn(`⚠️ Error leyendo hilo ${disc.discussion}:`, threadError);
        return [];
      }
    });

    // ✅ ESPERAR A QUE TERMINE ESTE LOTE
    const results = await Promise.all(promises);
    results.forEach(res => allAttempts.push(...res));
    
    // ✅ PAUSA PARA RESPIRAR (evita saturación)
    await new Promise(r => setTimeout(r, 200));
  }
  
  // ✅ ORDENAR POR FECHA (más reciente primero)
  allAttempts.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  
  console.log(`✅ Total de intentos cargados: ${allAttempts.length}`);
  console.timeEnd("⚡ getMoodleSubmissions");
  
  return allAttempts;
};

// ========== CALIFICACIÓN MANUAL (SIN PÉRDIDA DE DATOS) ==========
export const gradeSubmission = async (
  postId: string | number,
  grade: number,
  feedback: string,
  originalPayload: any // ✅ CRÍTICO: Recibir payload original
) => {
  const cleanId = String(postId).replace(/post-|sub-/g, '');
  
  // ✅ FUSIONAR DATOS: Mantener metadatos originales + nueva calificación
  const updatedPayload = {
    ...originalPayload,
    grade: grade,
    teacher_feedback: feedback,
    graded_at: new Date().toISOString(),
    status: 'graded'
  };

  const jsonString = JSON.stringify(updatedPayload);

  const message = `<div class="luingo-result">
    <h3>✅ Calificado: ${grade.toFixed(1)} / 10</h3>
    <p><strong>Feedback del Profesor:</strong> ${feedback || 'Sin comentarios'}</p>
    <p style="font-size:0.8em; color:#666;">Alumno: ${originalPayload.studentName || 'N/A'}</p>
  </div>
  <br/>
  <span style="display:none;">[LUINGO_DATA]${jsonString}[/LUINGO_DATA]</span>`;

  console.log(`✅ Calificando post ${cleanId} con datos fusionados`);

  return await callMoodle("mod_forum_update_discussion_post", {
    postid: cleanId,
    subject: `Calificado: ${originalPayload.taskTitle || 'Tarea'} - ${originalPayload.studentName || 'Estudiante'}`,
    message: message
  });
};