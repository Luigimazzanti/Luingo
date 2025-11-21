import { projectId, publicAnonKey } from '../utils/supabase/info';

// CONFIGURACIÓN MOODLE
// IMPORTANTE: Reemplaza esta URL con la de tu servidor real.
// 'sandbox.moodledemo.net' es solo para pruebas y evitar errores de DNS.
const MOODLE_URL = "https://sandbox.moodledemo.net/webservice/rest/server.php"; 
const MOODLE_TOKEN = "8b1869dbac3f73adb6ed03421fdd8535"; // Tu token (Nota: no funcionará en el sandbox)

interface MoodleParams {
  [key: string]: string | number | boolean;
}

// Función genérica para llamar a Moodle a través del Proxy
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
        settings: {
            url: MOODLE_URL,
            token: MOODLE_TOKEN
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
      return null;
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
  return data ? data[0] : null;
};
