// Usa importaciones estándar universales para evitar errores de compilación (400)
import { Hono } from "https://esm.sh/hono@3.11.7";
import { cors } from "https://esm.sh/hono@3.11.7/cors";
import { logger } from "https://esm.sh/hono@3.11.7/logger";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { evaluateLevelTest } from "./levelTestEvaluator.tsx";

// ==========================================
// SECCIÓN DE BASE DE DATOS
// ==========================================
const getSupabaseClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const kv = {
  get: async (key: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("kv_store_ebbb5c67").select("value").eq("key", key).maybeSingle();
    if (error) throw new Error(error.message);
    return data?.value;
  },
  set: async (key: string, value: any) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("kv_store_ebbb5c67").upsert({ key, value });
    if (error) throw new Error(error.message);
  }
};

const app = new Hono();

app.use("*", logger(console.log));
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

// RUTA BASE para compatibilidad con la estructura de carpetas
// Si tu función se llama "make-server-ebbb5c67", Hono recibirá las rutas con ese prefijo o sin él dependiendo del proxy.
// Usamos rutas relativas o wildcard para asegurar que coincidan.

app.get("/make-server-ebbb5c67/health", (c) => c.json({ status: "ok" }));

app.post("/make-server-ebbb5c67/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role } = body;
    if (!email || !password || !name) return c.json({ error: "Missing fields" }, 400);

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role: role || "student" },
        email_confirm: true,
      });

    if (error) return c.json({ error: error.message }, 400);
    return c.json({ user: data.user });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.post("/make-server-ebbb5c67/moodle-proxy", async (c) => {
  try {
    const { functionName, params, settings, mode } = await c.req.json();
    const MOODLE_URL = settings?.url;
    if (!MOODLE_URL) return c.json({ error: "Missing URL" }, 400);

    if (mode === "login") {
      const loginUrl = new URL(`${MOODLE_URL}/login/token.php`);
      loginUrl.searchParams.append("username", params.username);
      loginUrl.searchParams.append("password", params.password);
      loginUrl.searchParams.append("service", "moodle_mobile_app");
      const res = await fetch(loginUrl.toString(), { method: "POST" });
      return c.json(await res.json());
    }

    const MOODLE_TOKEN = settings?.token;
    if (!MOODLE_TOKEN) return c.json({ error: "Missing Token" }, 400);

    const url = new URL(`${MOODLE_URL}/webservice/rest/server.php`);
    url.searchParams.append("wstoken", MOODLE_TOKEN);
    url.searchParams.append("moodlewsrestformat", "json");

    const formData = new URLSearchParams();
    formData.append("wsfunction", functionName);
    if (params) Object.keys(params).forEach(k => formData.append(k, String(params[k])));

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });
    return c.json(await res.json());
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.post("/make-server-ebbb5c67/user-prefs", async (c) => {
  try {
    const { userId, data, action } = await c.req.json();
    if (!userId) return c.json({ error: "Missing userId" }, 400);
    const key = `user_prefs:${userId}`;
    
    if (action === "get") {
      const val = await kv.get(key);
      return c.json(val || {});
    }
    if (action === "save") {
      const existing = (await kv.get(key)) || {};
      const merged = { ...existing, ...data };
      await kv.set(key, merged);
      return c.json({ success: true, data: merged });
    }
    return c.json({ error: "Invalid action" }, 400);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ✅ BLOQUE CORREGIDO: Usamos notificaciones@ para evitar bloqueo por self-spoofing
app.post("/make-server-ebbb5c67/send-email", async (c) => {
  try {
    const body = await c.req.json();
    const { to, subject, html, text } = body;
    
    // Normalizamos 'to' a array por seguridad
    const recipients = Array.isArray(to) ? to : [to];

    const RESEND_KEY = "re_d6oDB5rh_6EHLuWjQxqzWiXtJxmjcM2kB"; 
    
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({ 
        // 🚨 CAMBIO CLAVE: Usamos un subdominio o alias diferente al de recepción
        from: "LuinGo <notificaciones@luingo.es>", 
        to: recipients, 
        subject, 
        html,
        text: text || "" // Añadimos versión texto plano para mejorar entregabilidad
      }),
    });
    
    // Captura de errores específica de Resend para ver en logs
    const data = await res.json();
    if (!res.ok) {
      console.error("Resend API Error:", data);
      return c.json({ error: data }, res.status);
    }
    
    return c.json(data);
  } catch (e) {
    console.error("Server Error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// ✅ ENDPOINT DE EVALUACIÓN CON IA Y NOTIFICACIONES
app.post("/make-server-ebbb5c67/evaluate-level-test", async (c) => {
  console.log('🎯 Endpoint /evaluate-level-test recibido');
  
  try {
    const body = await c.req.json();
    const { 
      studentId, 
      studentName, 
      studentEmail, 
      teacherEmail = "profesor@luingo.es", // Email por defecto del profesor
      answers, 
      writingText, 
      rawScore, 
      totalQuestions 
    } = body;

    console.log(`📊 Evaluando test de: ${studentName} (${studentEmail})`);
    console.log(`📈 Nota bruta: ${rawScore}/${totalQuestions}`);

    // Llamar al evaluador profesional
    const result = await evaluateLevelTest({
      studentId,
      studentName,
      studentEmail,
      teacherEmail,
      answers,
      writingText,
      rawScore,
      totalQuestions
    });

    console.log(`✅ Evaluación completada: Nivel ${result.level}`);

    return c.json({ 
      success: true, 
      result 
    });

  } catch (error) {
    console.error('❌ Error en endpoint de evaluación:', error);
    return c.json({ 
      success: false, 
      error: String(error) 
    }, 500);
  }
});

Deno.serve(app.fetch);