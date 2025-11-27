import { projectId, publicAnonKey } from '../utils/supabase/info';

// ========== CONFIGURACIÓN ==========
const MOODLE_URL = "https://luingo.moodiy.com/webservice/rest/server.php";
const MOODLE_TOKEN = "8b1869dbac3f73adb6ed03421fdd8535";

const TASKS_FORUM_ID = 4;
const SUBMISSIONS_FORUM_ID = 7;
const COMMUNITY_FORUM_ID = 13; 

interface MoodleParams {
  [key: string]: string | number | boolean;
}

// ========== HELPER: DATES SAFE PARSER ==========
const safeDate = (timestamp: any): string => {
  try {
    if (!timestamp || isNaN(Number(timestamp))) return new Date().toISOString();
    const date = new Date(Number(timestamp) * 1000);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
};

// ========== LLAMADA A API (PROXY) ==========
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
        console.warn(`⚠️ Moodle Warning (${functionName}):`, data.message); 
        if (data.errorcode === 'accessdenied') return null;
      }
      return data;
    } catch { return null; }
  } catch (error) { return null; }
};

const cleanMoodleJSON = (raw: string) => {
  try {
    let clean = raw.replace(/&quot;/g, '"').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/&#039;/g, "'").replace(/&apos;/g, "'").replace(/<[^>]*>/g, '').replace(/[\r\n]+/g, ' ').trim();
    return JSON.parse(clean);
  } catch { return null; }
};

// ========== FUNCIONES BÁSICAS ==========
export const getSiteInfo = async () => callMoodle("core_webservice_get_site_info");
export const getCourses = async () => callMoodle("core_course_get_courses");
export const getEnrolledUsers = async (courseId: number) => callMoodle("core_enrol_get_enrolled_users", { courseid: courseId });
export const getUserByUsername = async (username: string) => {
  const data = await callMoodle("core_user_get_users_by_field", { field: 'username', "values[0]": username.trim().toLowerCase() });
  return (Array.isArray(data) && data.length > 0) ? data[0] : null;
};
export const createCourse = async (fullname: string, shortname: string) => callMoodle("core_course_create_courses", { "courses[0][fullname]": fullname, "courses[0][shortname]": shortname, "courses[0][categoryid]": 1, "courses[0][format]": "topics" });

// ========== TAREAS ==========
export const createMoodleTask = async (title: string, description: string, jsonSettings: any) => {
  const message = `${description}<br/><br/><span style="display:none;">[LUINGO_DATA]${JSON.stringify(jsonSettings)}[/LUINGO_DATA]</span>`;
  return await callMoodle("mod_forum_add_discussion", { forumid: TASKS_FORUM_ID, subject: title, message });
};
export const updateMoodleTask = async (discussionId: string | number, title: string, description: string, jsonSettings: any) => {
  const cleanId = String(discussionId).replace(/\D/g, '');
  const message = `${description}<br/><br/><span style="display:none;">[LUINGO_DATA]${JSON.stringify(jsonSettings)}[/LUINGO_DATA]</span>`;
  let postId = cleanId;
  const posts = await callMoodle("mod_forum_get_discussion_posts", { discussionid: cleanId });
  if (posts?.posts?.length) postId = posts.posts[0].id;
  return await callMoodle("mod_forum_update_discussion_post", { postid: postId, subject: title, message });
};
const smartDelete = async (discussionId: string | number) => {
    const cleanId = String(discussionId).replace(/\D/g, '');
    const resDisc = await callMoodle("mod_forum_delete_discussion", { discussionid: cleanId });
    if (resDisc && !resDisc.exception) return true;
    const postsData = await callMoodle("mod_forum_get_discussion_posts", { discussionid: cleanId });
    if (postsData?.posts?.length) {
        const parentPost = postsData.posts.sort((a: any, b: any) => a.id - b.id)[0];
        const resPost = await callMoodle("mod_forum_delete_post", { postid: parentPost.id });
        return resPost && resPost.status === true;
    }
    return false;
};
export const deleteMoodleTask = async (discussionId: string | number) => await smartDelete(discussionId);

export const getMoodleTasks = async () => {
  const data = await callMoodle("mod_forum_get_forum_discussions", { forumid: TASKS_FORUM_ID });
  if (!data?.discussions) return [];
  return data.discussions.map((disc: any) => {
    const match = disc.message.match(/\[LUINGO_DATA\]([\s\S]*?)\[\/LUINGO_DATA\]/);
    const contentData = match ? cleanMoodleJSON(match[1]) || { type: 'quiz', questions: [] } : { type: 'quiz', questions: [] };
    return {
      id: `discussion-${disc.discussion}`, postId: disc.id, discussionId: disc.discussion, title: disc.subject,
      description: disc.message.split('[LUINGO_DATA]')[0].replace(/<[^>]*>?/gm, ''),
      content_data: contentData, category: 'homework', status: 'published', level_tag: contentData.level || 'A1', due_date: contentData.due_date || null, created_at: safeDate(disc.created)
    };
  });
};

// ========== SUBMISSIONS ==========
export const getMoodleSubmissions = async () => {
  const data = await callMoodle("mod_forum_get_forum_discussions", { forumid: SUBMISSIONS_FORUM_ID });
  if (!data?.discussions) return [];
  let allAttempts: any[] = [];
  const BATCH_SIZE = 5;
  for (let i = 0; i < data.discussions.length; i += BATCH_SIZE) {
    const batch = data.discussions.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (disc: any) => {
      const postsData = await callMoodle("mod_forum_get_discussion_posts", { discussionid: disc.discussion });
      if (!postsData?.posts) return [];
      return postsData.posts.map((post: any) => {
        const match = post.message.match(/\[LUINGO_DATA\]([\s\S]*?)\[\/LUINGO_DATA\]/);
        const json = match ? cleanMoodleJSON(match[1]) : null;
        if (!json) return null;
        return {
          id: `post-${post.id}`, postId: post.id, discussionId: disc.discussion, task_id: json.taskId || 'unknown', task_title: json.taskTitle || disc.subject,
          student_id: json.studentId || '', student_name: json.studentName || disc.userfullname, grade: json.grade || 0, score: json.score || 0, total: json.total || 0,
          answers: json.answers || [], teacher_feedback: json.teacher_feedback || null, submitted_at: safeDate(post.created), status: json.status || 'submitted',
          textContent: json.textContent || '', corrections: json.corrections || [], original_payload: json
        };
      }).filter(Boolean);
    });
    const results = await Promise.all(promises);
    results.forEach(res => allAttempts.push(...res));
  }
  return allAttempts.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
};
export const submitTaskResult = async (taskId: string, taskTitle: string, studentId: string, studentName: string, score: number, total: number, answers: any[], textContent?: string, status = 'submitted', corrections?: any[]) => {
  const payload = { taskId, taskTitle, studentId, studentName, score, total, grade: (score/total)*10, answers, textContent, status, corrections, timestamp: new Date().toISOString() };
  const messageHtml = `<div class="luingo-res">Result</div><span style="display:none;">[LUINGO_DATA]${JSON.stringify(payload)}[/LUINGO_DATA]</span>`;
  const forumData = await callMoodle("mod_forum_get_forum_discussions", { forumid: SUBMISSIONS_FORUM_ID });
  const existing = forumData?.discussions?.find((d: any) => d.subject === `Entrega: ${taskTitle} - ${studentName}`);
  if (existing) return await callMoodle("mod_forum_add_discussion_post", { postid: existing.id, subject: "Re: Entrega", message: messageHtml });
  return await callMoodle("mod_forum_add_discussion", { forumid: SUBMISSIONS_FORUM_ID, subject: `Entrega: ${taskTitle} - ${studentName}`, message: messageHtml });
};
export const gradeSubmission = async (postId: string | number, grade: number, feedback: string, originalPayload: any, corrections?: any[]) => {
  const cleanId = String(postId).replace(/\D/g, '');
  const payload = { ...originalPayload, grade, teacher_feedback: feedback, corrections: corrections || [], status: 'graded', graded_at: new Date().toISOString() };
  const message = `<div>Calificado: ${grade}/10</div><span style="display:none;">[LUINGO_DATA]${JSON.stringify(payload)}[/LUINGO_DATA]</span>`;
  return await callMoodle("mod_forum_update_discussion_post", { postid: cleanId, subject: `Calificado: ${payload.taskTitle}`, message });
};
export const deleteMoodlePost = async (postId: string | number, discussionId?: string | number) => {
  const cleanId = String(postId).replace(/\D/g, '');
  const res = await callMoodle("mod_forum_delete_post", { postid: cleanId });
  if (res?.status) return true;
  if (discussionId) return await smartDelete(discussionId);
  return false;
};

// ========== COMUNIDAD (SOCIAL) ==========
export const getCommunityPosts = async () => {
  const data = await callMoodle("mod_forum_get_forum_discussions", { forumid: COMMUNITY_FORUM_ID });
  if (!data?.discussions) return [];
  
  return data.discussions.map((disc: any) => {
    const match = disc.message.match(/\[LUINGO_DATA\]([\s\S]*?)\[\/LUINGO_DATA\]/);
    const meta = match ? cleanMoodleJSON(match[1]) : {};
    
    // ✅ FIX: Asegurar que likes sea siempre un array de strings
    const likesArray = Array.isArray(meta?.likes) ? meta.likes : [];

    return {
      id: `comm-${disc.discussion}`, 
      discussionId: disc.discussion, 
      postId: disc.id, 
      author: disc.userfullname, 
      avatar: disc.userpictureurl,
      title: disc.subject, 
      blocks: meta?.blocks || [], 
      content: disc.message.split('<span')[0].replace(/<[^>]*>?/gm, ''), 
      targetLevel: meta?.level || 'ALL',
      likes: likesArray, // ✅ Usamos la variable segura
      date: safeDate(disc.created), 
      commentsCount: disc.numreplies || 0
    };
  });
};

export const createCommunityPost = async (title: string, blocks: any[], level: string) => {
  const meta = { level, type: 'mixed', blocks, likes: [] };
  const message = `Post...<br/><span style="display:none;">[LUINGO_DATA]${JSON.stringify(meta)}[/LUINGO_DATA]</span>`;
  return (await callMoodle("mod_forum_add_discussion", { forumid: COMMUNITY_FORUM_ID, subject: title, message }))?.discussionid;
};
export const updateCommunityPost = async (postId: string | number, title: string, blocks: any[], level: string, existingLikes: string[] = []) => {
  const meta = { level, type: 'mixed', blocks, likes: existingLikes };
  const message = `Update...<br/><span style="display:none;">[LUINGO_DATA]${JSON.stringify(meta)}[/LUINGO_DATA]</span>`;
  return (await callMoodle("mod_forum_update_discussion_post", { postid: String(postId).replace(/\D/g, ''), subject: title, message }))?.status;
};
export const toggleCommunityLike = async (post: any, userId: string) => {
  const currentLikes = Array.isArray(post.likes) ? post.likes : [];
  const newLikes = currentLikes.includes(String(userId)) ? currentLikes.filter((id: string) => id !== String(userId)) : [...currentLikes, String(userId)];
  const meta = { level: post.targetLevel, type: 'mixed', blocks: post.blocks, likes: newLikes };
  // ✅ FIX: Reconstruir la vista previa HTML para no romper el post en Moodle Web
  let htmlPreview = '<div class="luingo-post">';
  if (Array.isArray(post.blocks)) {
      post.blocks.forEach((b: any) => {
        if (b.type === 'text') htmlPreview += `<p>${b.content.substring(0, 100)}...</p>`;
        else htmlPreview += `<p>[${b.type}]</p>`;
      });
  }
  htmlPreview += '</div>';

  const message = `${htmlPreview}<br/><br/><span style="display:none;">[LUINGO_DATA]${JSON.stringify(meta)}[/LUINGO_DATA]</span>`;
  let targetId = String(post.postId).replace(/\D/g, '');
  const result = await callMoodle("mod_forum_update_discussion_post", { postid: targetId, subject: post.title, message });
  return result?.status === true || result?.status === 'true' || (result && !result.exception);
};

// ✅ COMENTARIOS CON FIRMA Y ROL
export const addCommunityComment = async (discussionId: string | number, message: string, author: { id: string, name: string, avatar?: string, role?: string }, replyToId?: string) => {
  const cleanDiscId = String(discussionId).replace(/\D/g, '');
  
  // Buscar padre para obtener subject
  const postsData = await callMoodle("mod_forum_get_discussion_posts", { discussionid: cleanDiscId });
  if (!postsData?.posts?.length) return false;
  
  // Determinar post padre real (si es reply o comentario raíz)
  let targetParentId = replyToId || postsData.posts.sort((a: any, b: any) => a.id - b.id)[0].id;
  
  // Obtener subject para replicarlo (Moodle estricto)
  const parentPost = postsData.posts.find((p: any) => String(p.id) === String(targetParentId)) || postsData.posts[0];
  let subject = parentPost.subject;
  if (!subject.startsWith("Re:")) subject = `Re: ${subject}`;
  
  const authorData = { id: author.id, name: author.name, avatar: author.avatar || '', role: author.role || 'student' };
  const signedMessage = `${message}\n\n[LUINGO_AUTHOR]${JSON.stringify(authorData)}[/LUINGO_AUTHOR]`;

  const response = await callMoodle("mod_forum_add_discussion_post", {
    postid: targetParentId,
    subject: subject,
    message: `<p>${signedMessage}</p>`,
    "options[0][name]": "discussionsubscribe", "options[0][value]": true
  });

  return response && response.postid;
};

// ✅ EDITAR COMENTARIO (MANTENIENDO FIRMA)
export const editCommunityComment = async (postId: string, message: string, author: { id: string, name: string, avatar?: string, role?: string }) => {
    const authorData = { id: author.id, name: author.name, avatar: author.avatar || '', role: author.role || 'student' };
    const signedMessage = `${message}\n\n[LUINGO_AUTHOR]${JSON.stringify(authorData)}[/LUINGO_AUTHOR]`;
    
    return (await callMoodle("mod_forum_update_discussion_post", {
        postid: String(postId).replace(/\D/g, ''),
        subject: '', // Enviamos vacío para que Moodle mantenga el original
        message: `<p>${signedMessage}</p>`
    }))?.status;
};

// ✅ FIX: LECTURA ROBUSTA DE FIRMA CON ROL Y PARENT
export const getPostComments = async (discussionId: string | number) => {
  const data = await callMoodle("mod_forum_get_discussion_posts", { discussionid: String(discussionId).replace(/\D/g, '') });
  if (!data?.posts) return [];
  
  const sorted = data.posts.sort((a: any, b: any) => a.id - b.id);
  const parentId = sorted[0]?.id; // El post principal del hilo (el Material)
  
  return sorted
    .filter((p: any) => p.id !== parentId)
    .map((p: any) => {
      let realAuthorId = p.userid;
      let realAuthorName = p.userfullname;
      let realAvatar = p.userpictureurl;
      let realRole = 'student'; // Default
      let content = p.message;

      const metaMatch = p.message.match(/\[LUINGO_AUTHOR\]([\s\S]*?)\[\/LUINGO_AUTHOR\]/);
      
      if (metaMatch && metaMatch[1]) {
        try {
            const rawJson = metaMatch[1].replace(/<[^>]+>/g, '').trim(); 
            const authorData = JSON.parse(rawJson);
            realAuthorId = authorData.id;
            realAuthorName = authorData.name;
            realAvatar = authorData.avatar;
            realRole = authorData.role || 'student';
            content = p.message.replace(metaMatch[0], '').trim();
        } catch (e) { }
      } 
      content = content.replace(/<[^>]*>?/gm, '').trim();

      return {
        id: p.id,
        parentId: p.parentid, // Necesario para anidar
        author: realAuthorName,
        userId: realAuthorId, 
        role: realRole,
        avatar: realAvatar,
        content: content,
        date: safeDate(p.created)
      };
    })
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const deleteCommunityPost = async (discussionId: string | number) => {
  return await smartDelete(discussionId);
};
