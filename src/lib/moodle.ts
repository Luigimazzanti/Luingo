import { projectId, publicAnonKey } from '../utils/supabase/info';

// Variables mutables para la configuración en tiempo de ejecución
let currentUrl = localStorage.getItem('moodle_url') || "https://luingo.moodiy.com/webservice/rest/server.php";
let currentToken = localStorage.getItem('moodle_token') || "";

export const configureMoodle = (url: string, token: string) => {
  currentUrl = url;
  currentToken = token;
  // Persistir en localStorage para recargas
  localStorage.setItem('moodle_url', url);
  localStorage.setItem('moodle_token', token);
};

export const getMoodleConfig = () => ({
  url: currentUrl,
  token: currentToken
});

interface MoodleParams {
  [key: string]: string | number | boolean;
}

// Función genérica para llamar a Moodle a través del Proxy
const callMoodle = async (functionName: string, params: MoodleParams = {}) => {
  if (!currentUrl || !currentToken) {
    return { error: "Configuración incompleta. Por favor ingresa URL y Token." };
  }

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
            url: currentUrl,
            token: currentToken
        }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Error Proxy (${response.status}):`, text);
      return null;
    }

    const data = await response.json();
    
    if (data.exception) {
      console.error(`❌ Error Moodle (${functionName}):`, data.message);
      return { error: data.message, exception: data.exception }; // Retornar el error para manejarlo en UI
    }
    
    return data;
  } catch (error) {
    console.error("❌ Error de Red (Proxy):", error);
    return null;
  }
};

// --- FUNCIONES PÚBLICAS ---

// 1. Probar conexión
export const getSiteInfo = async () => {
  return await callMoodle("core_webservice_get_site_info");
};

// 2. Obtener cursos
export const getCourses = async () => {
  return await callMoodle("core_course_get_courses");
};

// 3. Obtener contenido de un curso (Tareas/Recursos)
export const getCourseContent = async (courseId: number) => {
  return await callMoodle("core_course_get_contents", { courseid: courseId });
};

// 4. Obtener usuario por ID (Sustituye a la llamada vieja)
export const getUserById = async (userId: number) => {
  // Usamos la función moderna 'get_users_by_field'
  const data = await callMoodle("core_user_get_users_by_field", {
    field: "id",
    "values[0]": userId
  });
  // Manejo robusto de respuesta array
  return Array.isArray(data) ? data[0] : null;
};
