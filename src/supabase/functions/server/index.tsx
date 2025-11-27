import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { createUploadthing, type FileRouter } from "npm:uploadthing@6.5.2/server";
import { createRouteHandler } from "npm:uploadthing@6.5.2/server";

// ==========================================
// 🔐 CONFIGURACIÓN DE UPLOADTHING
// ==========================================
const UT_SECRET = "sk_live_8897a3944568b699bc1b52dc60c0ebfb5dd8a69bed042fc5325e999b91d5bcd2";
const UT_APP_ID = "w0lp8qyjh1"; // Extraído de la secret key

// Inicializar UploadThing
const f = createUploadthing();

const uploadRouter = {
  // Ruta para subir PDFs (máx 4MB, 1 archivo)
  pdfUploader: f({ pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // Aquí podrías verificar auth, por ahora público para facilitar
      console.log("📤 Iniciando subida de PDF...");
      return { userId: "user_123" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Subida completada:", file.url);
      console.log("📁 Archivo:", file.name, "Tamaño:", file.size);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods (incluyendo headers de UploadThing)
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type", 
      "Authorization", 
      "x-uploadthing-package", 
      "x-uploadthing-version",
      "x-uploadthing-api-key",
      "x-uploadthing-fe-package",
      "x-uploadthing-be-adapter"
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-ebbb5c67/health", (c) => {
  return c.json({ status: "ok" });
});

// 🚀 RUTAS DE UPLOADTHING
// Configuramos las rutas de UploadThing con las claves
const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    token: UT_SECRET,
    isDev: true,
    logLevel: "info",
  },
});

// Montar rutas en la URL específica del proyecto
app.get("/make-server-ebbb5c67/api/uploadthing", (c) => GET(c.req.raw));
app.post("/make-server-ebbb5c67/api/uploadthing", (c) => POST(c.req.raw));

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

Deno.serve(app.fetch);
