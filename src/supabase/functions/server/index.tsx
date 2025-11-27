import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-ebbb5c67/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-ebbb5c67/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: role || 'student' },
      email_confirm: true
    });

    if (error) {
      console.error("Error creating user:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (e) {
    console.error("Signup exception:", e);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Moodle Proxy
app.post("/make-server-ebbb5c67/moodle-proxy", async (c) => {
  try {
    const body = await c.req.json();
    const { functionName, params, settings } = body;

    // Prefer settings passed from client, fallback to internal defaults/env if needed
    // This allows the frontend to control which Moodle instance to connect to
    const MOODLE_URL = settings?.url;
    const MOODLE_TOKEN = settings?.token;

    if (!MOODLE_URL || !MOODLE_TOKEN) {
        return c.json({ error: "Missing Moodle URL or Token in request settings" }, 400);
    }

    const url = new URL(MOODLE_URL);
    // Solo enviamos el token y el formato en la URL
    url.searchParams.append("wstoken", MOODLE_TOKEN);
    url.searchParams.append("moodlewsrestformat", "json");

    // ✅ CORRECCIÓN: Preparamos los datos para enviarlos por POST en el body
    const formData = new URLSearchParams();
    formData.append("wsfunction", functionName);
    
    if (params) {
      Object.keys(params).forEach((key) => {
        formData.append(key, String(params[key]));
      });
    }

    // ✅ CORRECCIÓN: Usamos POST para evitar errores de longitud de URL con comentarios largos
    const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData
    });

    const data = await response.json();
    
    return c.json(data);
  } catch (e) {
    console.error("Moodle proxy error:", e);
    return c.json({ error: "Failed to fetch from Moodle", details: String(e) }, 500);
  }
});

// ✅ PROXY PARA GOOGLE DRIVE (Túnel gratuito para PDFs)
// Esto permite que los PDFs de Drive se vean sin errores de CORS
app.get("/make-server-ebbb5c67/drive-proxy", async (c) => {
  const id = c.req.query("id");
  if (!id) {
    return c.json({ error: "Falta el ID del archivo de Drive" }, 400);
  }

  // URL de descarga directa de Google Drive
  const driveUrl = `https://drive.google.com/uc?export=view&id=${id}`;
  
  try {
    console.log(`📄 Proxy de Drive: Obteniendo archivo ${id}...`);
    const response = await fetch(driveUrl);
    
    if (!response.ok) {
      console.error(`❌ Error al obtener archivo de Drive: ${response.status}`);
      return c.json({ error: "No se pudo obtener el archivo de Drive" }, response.status);
    }
    
    // Copiamos los headers del archivo original pero añadimos CORS
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*"); // ¡Esto permite que tu web lo lea!
    newHeaders.set("Content-Type", "application/pdf"); // Forzamos tipo PDF
    newHeaders.set("Cache-Control", "public, max-age=3600"); // Cache de 1 hora

    console.log(`✅ Archivo de Drive servido correctamente`);
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  } catch (e) {
    console.error("❌ Error en proxy de Drive:", e);
    return c.json({ error: "Error al obtener archivo de Drive", details: String(e) }, 500);
  }
});

// ✅ PROXY ONEDRIVE BLINDADO (A PRUEBA DE ERRORES)
app.get("/make-server-ebbb5c67/onedrive-proxy", async (c) => {
  let fileUrl = c.req.query("url");
  if (!fileUrl) return c.json({ error: "Falta URL" }, 400);

  console.log("Proxy OneDrive recibió:", fileUrl);

  // 1. LIMPIEZA DE EMERGENCIA: Si llega un <iframe>, extraemos el link
  if (fileUrl.includes('<iframe')) {
      const srcMatch = fileUrl.match(/src="([^"]+)"/);
      if (srcMatch && srcMatch[1]) {
          fileUrl = srcMatch[1]; // Nos quedamos solo con la URL limpia
          console.log("URL extraída del iframe:", fileUrl);
      } else {
          return c.json({ error: "No se pudo extraer URL del iframe" }, 400);
      }
  }

  // 2. Limpieza extra de comillas o espacios
  fileUrl = fileUrl.replace(/["']/g, "").trim();

  // 3. VALIDACIÓN: ¿Es una URL válida?
  try {
      new URL(fileUrl);
  } catch (e) {
      console.error("URL inválida:", fileUrl);
      return c.json({ error: "URL inválida recibida" }, 400);
  }

  try {
    // 4. CONVERSIÓN: De 'Visualizar' a 'Descargar'
    // OneDrive suele dar links de 'embed' o 'redir' que no son el archivo directo
    let downloadUrl = fileUrl
      .replace("onedrive.live.com/embed", "onedrive.live.com/download")
      .replace("1drv.ms/b/s!", "1drv.ms/u/s!"); // Intento para shortlinks

    // Hacemos la petición. Fetch seguirá las redirecciones automáticamente.
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
        console.error("Error fetching from OneDrive:", response.status);
        return c.json({ error: "No se pudo descargar el archivo de OneDrive" }, 500);
    }
    
    // 5. RESPUESTA: Entregar PDF con permisos CORS
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Content-Type", "application/pdf"); // Forzamos tipo PDF

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  } catch (e) {
    console.error("OneDrive Proxy Exception:", e);
    return c.json({ error: "Error interno en proxy OneDrive" }, 500);
  }
});

Deno.serve(app.fetch);