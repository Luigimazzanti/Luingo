import { projectId, publicAnonKey } from '../utils/supabase/info';

// ========== CONFIGURACIÓN ==========
const MOODLE_URL = "https://luingo.moodiy.com/webservice/rest/server.php";
const MOODLE_TOKEN = "8b1869dbac3f73adb6ed03421fdd8535";

const TASKS_FORUM_ID = 4;
const SUBMISSIONS_FORUM_ID = 7;
const COMMUNITY_FORUM_ID = 13; // ✅ ID CORRECTO

interface MoodleParams {
  [key: string]: string | number | boolean;
}

// ========== ✅ SAFE PARSE CON LIMPIEZA HTML ==========
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

// ========== 🧹 SANITIZER DE JSON (FIX CRÍTICO) ==========
const cleanMoodleJSON = (raw: string) => {
  try {
    console.log("🧹 Limpiando JSON raw:", raw.substring(0, 100));
    
    // 1️⃣ Decodificar entidades HTML comunes
    let clean = raw
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'");
    
    // 2️⃣ Eliminar etiquetas HTML que Moodle haya inyectado (ej: <br>, <p>, etc.)
    clean = clean.replace(/<[^>]*>/g, '');
    
    // 3️⃣ Limpiar saltos de línea problemáticos
    clean = clean.replace(/[\r\n]+/g, ' ');
    
    // 4️⃣ Trim espacios en blanco
    clean = clean.trim();
    
    console.log("✅ JSON limpio:", clean.substring(0, 100));
    
    return JSON.parse(clean);
  } catch (e) {
    console.error("❌ Fallo al limpiar/parsear JSON:", e);
    console.error("Raw recibido:", raw.substring(0, 200));
    return null;
  }
};

// ========== 🔧 HELPER: DECODIFICAR HTML ENTITIES ==========
const decodeHTML = (html: string) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
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
    // ✅ REGEX MEJORADA (multilínea con [\s\S])
    const match = disc.message.match(/\[LUINGO_DATA\]([\s\S]*?)\[\/LUINGO_DATA\]/);
    const contentData = match 
      ? cleanMoodleJSON(match[1]) || { type: 'quiz', questions: [] } 
      : { type: 'quiz', questions: [] };
    
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
      due_date: contentData.due_date || null,
      created_at: created.toISOString()
    };
  });
};

// ========== BORRAR POST (INTENTO) ==========
export const deleteMoodlePost = async (
  postId: string | number, 
  discussionId?: string | number
): Promise<boolean> => {
  const cleanPostId = String(postId).replace(/post-|sub-|discussion-/g, '');
  console.log("🗑️ Intentando borrar Post:", cleanPostId);

  try {
    const resPost = await callMoodle("mod_forum_delete_post", { 
      postid: cleanPostId 
    });

    console.log("📋 Respuesta de mod_forum_delete_post:", resPost);

    if (resPost && resPost.status === true) {
      console.log("✅ Post borrado correctamente de Moodle");
      return true;
    }

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

// ========== ENTREGAS (CON SOPORTE WRITING) ==========
export const submitTaskResult = async (
  taskId: string,
  taskTitle: string,
  studentId: string,
  studentName: string,
  score: number,
  total: number,
  answers: any[],
  textContent?: string,
  status: 'submitted' | 'draft' = 'submitted',
  corrections?: any[]
) => {
  const grade = total > 0 ? (score / total) * 10 : 0;
  const safeAnswers = Array.isArray(answers) ? answers : [];
  
  const payload = {
    taskId,
    taskTitle,
    studentId,
    studentName,
    score,
    total,
    grade,
    answers: safeAnswers,
    textContent,
    status,
    corrections,
    timestamp: new Date().toISOString()
  };
  
  const jsonString = JSON.stringify(payload);
  
  let displayHtml = '';
  if (textContent) {
    const wordCount = textContent.split(/\s+/).filter((w: string) => w.length > 0).length;
    const statusLabel = status === 'draft' ? '📝 Borrador' : status === 'submitted' ? '📤 Enviado' : '✅ Calificado';
    displayHtml = `<div class="luingo-writing">
      <strong>${statusLabel}</strong><br/>
      Palabras: ${wordCount}
    </div>`;
  } else {
    displayHtml = `<div class="luingo-result">✅ Nota: ${grade.toFixed(1)}/10</div>`;
  }
  
  const messageHtml = `${displayHtml}<span style="display:none;">[LUINGO_DATA]${jsonString}[/LUINGO_DATA]</span>`;

  const forumData = await callMoodle("mod_forum_get_forum_discussions", {
    forumid: SUBMISSIONS_FORUM_ID
  });
  
  const targetSubject = `Entrega: ${taskTitle} - ${studentName}`;
  const existingDisc = forumData?.discussions?.find((d: any) => d.subject === targetSubject);

  if (existingDisc) {
    console.log("🔄 Añadiendo intento a hilo existente:", existingDisc.discussion);
    
    await callMoodle("mod_forum_update_discussion_post", {
      postid: existingDisc.id,
      subject: existingDisc.subject,
      message: messageHtml
    });
    
    const replySubject = status === 'draft' ? "Borrador Guardado" : "Entrega Final";
    return await callMoodle("mod_forum_add_discussion_post", {
      postid: existingDisc.id,
      subject: replySubject,
      message: messageHtml
    });
  } else {
    console.log("✨ Creando nuevo hilo de entrega");
    
    return await callMoodle("mod_forum_add_discussion", {
      forumid: SUBMISSIONS_FORUM_ID,
      subject: targetSubject,
      message: messageHtml
    });
  }
};

// ========== ✅ CARGA BATCH SAFE CON SANITIZER ==========
export const getMoodleSubmissions = async () => {
  console.log("🔄 Cargando entregas con sanitizer...");
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
  const BATCH_SIZE = 5;

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
          // ✅ REGEX MEJORADA (multilínea con [\s\S])
          const match = post.message.match(/\[LUINGO_DATA\]([\s\S]*?)\[\/LUINGO_DATA\]/);
          if (!match) return null;
          
          // ✅ SANITIZAR JSON ANTES DE PARSEAR
          const json = cleanMoodleJSON(match[1]);
          if (!json) return null;
          
          // 🔍 LOG DE DEBUGGING (REMOVER EN PRODUCCIÓN)
          if (json.textContent) {
            console.log('✅ Encontrado textContent en submission:', {
              taskTitle: json.taskTitle,
              studentName: json.studentName,
              textLength: json.textContent.length,
              status: json.status
            });
          }
          
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
            // ✅ CAMPOS WRITING
            status: json.status || 'submitted',
            textContent: json.textContent || '', // ✅ CAMPO REDACCIÓN
            corrections: json.corrections || [],
            original_payload: json
          };
        }).filter(Boolean);
        
      } catch (threadError) {
        console.warn(`⚠️ Error leyendo hilo ${disc.discussion}:`, threadError);
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach(res => allAttempts.push(...res));
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  allAttempts.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  
  console.log(`✅ Total de intentos cargados: ${allAttempts.length}`);
  console.timeEnd("⚡ getMoodleSubmissions");
  
  return allAttempts;
};

// ========== CALIFICACIÓN MANUAL ==========
export const gradeSubmission = async (
  postId: string | number,
  grade: number,
  feedback: string,
  originalPayload: any,
  corrections?: any[] // ✅ NUEVO ARGUMENTO PARA GUARDAR CORRECCIONES
) => {
  const cleanId = String(postId).replace(/post-|sub-/g, '');
  
  const updatedPayload = {
    ...originalPayload,
    grade: grade,
    teacher_feedback: feedback,
    corrections: corrections || originalPayload.corrections || [], // ✅ GUARDAR CORRECCIONES AQUÍ
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

  console.log(`✅ Calificando post ${cleanId} con datos fusionados (incluyendo ${corrections?.length || 0} correcciones)`);

  return await callMoodle("mod_forum_update_discussion_post", {
    postid: cleanId,
    subject: `Calificado: ${originalPayload.taskTitle || 'Tarea'} - ${originalPayload.studentName || 'Estudiante'}`,
    message: message
  });
};

// ========== 📱 COMUNIDAD (SOCIAL FEED - SISTEMA HÍBRIDO) ==========

// ✅ LEER POSTS DE COMUNIDAD (JSON para Likes/Metadata + Replies Nativos)
export const getCommunityPosts = async () => {
  console.log("📱 Cargando posts de comunidad...");
  
  const data = await callMoodle("mod_forum_get_forum_discussions", { 
    forumid: COMMUNITY_FORUM_ID 
  });
  
  if (!data || !data.discussions) return [];
  
  return data.discussions.map((disc: any) => {
    // Extraer metadata JSON con sanitizer
    const match = disc.message.match(/\[LUINGO_DATA\]([\s\S]*?)\[\/LUINGO_DATA\]/);
    let meta: any = { level: 'ALL', type: 'mixed', blocks: [], likes: [] };
    
    if (match) {
      try {
        meta = cleanMoodleJSON(match[1]) || meta;
      } catch (e) {
        console.warn("⚠️ Error parseando metadata de post:", e);
      }
    }
    
    // Extraer contenido HTML limpio para preview
    const contentHtml = disc.message.split('<span')[0].replace(/<[^>]*>?/gm, '').trim();
    
    return {
      id: `comm-${disc.discussion}`,
      discussionId: disc.discussion,
      postId: disc.id,
      author: disc.userfullname || 'Usuario',
      avatar: disc.userpictureurl || '',
      title: disc.subject,
      content: contentHtml,
      // Datos ricos del JSON
      blocks: Array.isArray(meta.blocks) ? meta.blocks : [],
      type: meta.type || 'mixed',
      url: meta.url || '',
      targetLevel: meta.level || 'ALL',
      likes: Array.isArray(meta.likes) ? meta.likes : [], // ✅ ARRAY DE USER IDs
      date: new Date(disc.created * 1000).toISOString(),
      commentsCount: disc.numreplies || 0 // ✅ CONTADOR NATIVO DE MOODLE
    };
  });
};

// ✅ CREAR POST (Guarda BLOQUES en JSON, Likes como Array)
export const createCommunityPost = async (
  title: string, 
  blocks: any[], 
  level: string
) => {
  console.log("📤 Publicando en comunidad:", title, "con", blocks.length, "bloques");
  
  // Metadata para Likes y Renderizado
  const meta = { 
    level, 
    type: 'mixed', 
    blocks: blocks,
    likes: [] // ✅ Array de user IDs
  };
  
  // Generar HTML básico para Moodle Web (fallback)
  let htmlPreview = '<div class="luingo-post">';
  blocks.forEach(b => {
    if (b.type === 'text') htmlPreview += `<p>${b.content}</p>`;
    else htmlPreview += `<p>[Recurso: ${b.type}]</p>`;
  });
  htmlPreview += '</div>';
  
  const message = `${htmlPreview}<br/><br/><span style="display:none;">[LUINGO_DATA]${JSON.stringify(meta)}[/LUINGO_DATA]</span>`;
  
  const res = await callMoodle("mod_forum_add_discussion", { 
    forumid: COMMUNITY_FORUM_ID, 
    subject: title, 
    message 
  });
  
  if (res && (res.discussionid || res.discussion)) {
    console.log("✅ Publicado con ID:", res.discussionid || res.discussion);
    return true;
  }
  
  console.error("❌ Error al publicar:", res);
  return false;
};

// ✅ ACTUALIZAR POST (Editar bloques - Mantener Likes)
export const updateCommunityPost = async (
  postId: string | number, 
  title: string, 
  blocks: any[], 
  level: string,
  existingLikes: string[] = []
) => {
  const cleanId = String(postId).replace(/\D/g, '');
  console.log("📝 Actualizando post:", cleanId, "con", blocks.length, "bloques");
  
  const meta = { 
    level, 
    type: 'mixed', 
    blocks: blocks, 
    likes: existingLikes // ✅ MANTENER LIKES EXISTENTES
  };
  
  let htmlPreview = '<div class="luingo-post">';
  blocks.forEach(b => {
    if (b.type === 'text') htmlPreview += `<p>${b.content}</p>`;
    else htmlPreview += `<p>[Recurso: ${b.type}]</p>`;
  });
  htmlPreview += '</div>';
  
  const message = `${htmlPreview}<br/><br/><span style="display:none;">[LUINGO_DATA]${JSON.stringify(meta)}[/LUINGO_DATA]</span>`;
  
  const res = await callMoodle("mod_forum_update_discussion_post", { 
    postid: cleanId, 
    subject: title, 
    message 
  });
  
  if (res && res.status !== false) {
    console.log("✅ Post actualizado");
    return true;
  }
  
  console.error("❌ Error al actualizar:", res);
  return false;
};

// ✅ AÑADIR COMENTARIO (REPLY NATIVO - SIN JSON)
export const addCommunityComment = async (discussionId: string | number, message: string) => {
  const cleanDiscId = String(discussionId).replace(/\D/g, '');
  
  console.log("💬 Iniciando comentario en discusión:", cleanDiscId);

  // 1. Buscar el ID del post padre (el origen del hilo)
  const postsData = await callMoodle("mod_forum_get_discussion_posts", { 
    discussionid: cleanDiscId 
  });

  if (!postsData?.posts?.length) {
    console.error("❌ Error: Discusión vacía o no encontrada:", cleanDiscId);
    return false;
  }

  console.log(`📋 ${postsData.posts.length} posts encontrados en la discusión`);

  // 2. El padre es el que tiene id más bajo (creado primero)
  const parentPost = postsData.posts.sort((a: any, b: any) => a.id - b.id)[0];

  console.log(`💬 Respondiendo a Post ${parentPost.id} en Discusión ${cleanDiscId}`);

  // 3. Enviar Reply Nativo (SIN groupid, SIN [LUINGO_DATA])
  // IMPORTANTE: Es un comentario de texto plano, no tiene metadata JSON
  const response = await callMoodle("mod_forum_add_discussion_post", {
    postid: parentPost.id,
    subject: "Re: Comentario",
    message: `<p>${message}</p>`
  });

  if (response && response.postid) {
    console.log("✅ Comentario creado con ID:", response.postid);
    return true;
  }

  console.error("❌ Error Moodle al comentar:", response);
  return false;
};

// ✅ TOGGLE LIKE (Sistema JSON con Array de User IDs)
export const toggleCommunityLike = async (post: any, userId: string) => {
  console.log("❤️ Toggle like en post:", post.postId, "por usuario:", userId);
  
  const currentLikes = Array.isArray(post.likes) ? post.likes : [];
  let newLikes: string[] = [];
  
  // Toggle: Si ya dio like, quitar. Si no, añadir.
  if (currentLikes.includes(String(userId))) {
    newLikes = currentLikes.filter((id: string) => id !== String(userId));
    console.log("💔 Quitando like");
  } else {
    newLikes = [...currentLikes, String(userId)];
    console.log("❤️ Añadiendo like");
  }
  
  // Metadata actualizada (mantener blocks, level, etc.)
  const meta = {
    level: post.targetLevel,
    type: post.type || 'mixed',
    blocks: post.blocks || [],
    likes: newLikes
  };
  
  // Reconstruir HTML preview
  let htmlPreview = '<div class="luingo-post">';
  (post.blocks || []).forEach((b: any) => {
    if (b.type === 'text') htmlPreview += `<p>${b.content}</p>`;
    else htmlPreview += `<p>[Recurso: ${b.type}]</p>`;
  });
  htmlPreview += '</div>';
  
  const message = `${htmlPreview}<br/><br/><span style="display:none;">[LUINGO_DATA]${JSON.stringify(meta)}[/LUINGO_DATA]</span>`;
  
  const cleanPostId = String(post.postId).replace(/\D/g, '');
  const res = await callMoodle("mod_forum_update_discussion_post", { 
    postid: cleanPostId, 
    subject: post.title, 
    message 
  });
  
  if (res && res.status !== false) {
    console.log(`✅ Like guardado. Total: ${newLikes.length}`);
    return true;
  }
  
  console.error("❌ Error al guardar like");
  return false;
};

// ✅ LEER COMENTARIOS (REPLIES NATIVOS)
export const getPostComments = async (discussionId: string | number) => {
  const cleanDiscId = String(discussionId).replace(/\D/g, '');
  
  console.log("💬 Cargando comentarios de discusión:", cleanDiscId);
  
  const data = await callMoodle("mod_forum_get_discussion_posts", {
    discussionid: cleanDiscId
  });
  
  if (!data?.posts) {
    console.warn("⚠️ No se pudieron cargar comentarios");
    return [];
  }

  // Ordenar por ID para identificar al padre (el de menor ID)
  const sorted = data.posts.sort((a: any, b: any) => a.id - b.id);
  const parentId = sorted[0]?.id;
  
  console.log(`📌 Post raíz identificado: ${parentId}`);
  
  // Los comentarios son todos MENOS el padre
  return sorted
    .filter((p: any) => p.id !== parentId)
    .map((p: any) => {
      // ✅ MANEJO SEGURO DE FECHAS
      let dateStr = new Date().toISOString();
      try {
        if (p.created && !isNaN(p.created) && p.created > 0) {
          const timestamp = Number(p.created) * 1000;
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            dateStr = date.toISOString();
          }
        }
      } catch (e) {
        console.warn(`⚠️ Error parseando fecha en comentario ${p.id}:`, e);
      }

      return {
        id: p.id,
        author: p.userfullname || 'Usuario',
        avatar: p.userpictureurl || '',
        content: p.message.replace(/<[^>]*>?/gm, '').trim(), // ✅ Texto limpio (sin HTML)
        date: dateStr,
        isMine: false // TODO: Comparar con userId actual si está disponible
      };
    });
};

// ✅ BORRAR POST DE COMUNIDAD
export const deleteCommunityPost = async (discussionId: string | number) => {
  const cleanId = String(discussionId).replace(/\D/g, '');
  console.log("🗑️ Borrando discusión de comunidad:", cleanId);
  
  const res = await callMoodle("mod_forum_delete_discussion", { 
    discussionid: cleanId 
  });
  
  if (res && (res.status === true || res.warnings?.length === 0)) {
    console.log("✅ Discusión borrada");
    return true;
  }
  
  console.error("❌ Error al borrar discusión:", res);
  return false;
};