// Usa importaciones estándar universales para evitar errores de compilación (400)
import { Hono } from "https://esm.sh/hono@3.11.7";
import { cors } from "https://esm.sh/hono@3.11.7/cors";
import { logger } from "https://esm.sh/hono@3.11.7/logger";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

app.post("/make-server-ebbb5c67/send-email", async (c) => {
  try {
    const { to, subject, html } = await c.req.json();
    const RESEND_KEY = "re_d6oDB5rh_6EHLuWjQxqzWiXtJxmjcM2kB"; 
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({ from: "LuinGo <hola@luingo.es>", to, subject, html }),
    });
    return c.json(await res.json());
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ✅ ENDPOINT DE EVALUACIÓN
app.post("/make-server-ebbb5c67/evaluate-level-test", async (c) => {
  try {
    const { studentName, studentEmail, answers, writingText } = await c.req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const RESEND_KEY = "re_d6oDB5rh_6EHLuWjQxqzWiXtJxmjcM2kB";

    if (!GROQ_API_KEY) {
      return c.json({ success: true, result: { level: "Pendiente", feedback: "Evaluación manual requerida (Falta API Key)." } });
    }

    const systemPrompt = `
      Eres un examinador experto del Instituto Cervantes. Evalúa este Test de Nivel.
      DATOS:
      - Respuestas: ${JSON.stringify(answers)}
      - Redacción: "${writingText}"
      
      Genera un JSON ESTRICTO con: level (CEFR), score (0-100), feedback, strengths, weaknesses.
    `;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content;
    const result = content ? JSON.parse(content) : { level: "Error", feedback: "No se pudo generar el reporte." };

    // Enviar Email
    if (studentEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: "LuinGo <hola@luingo.es>",
          to: [studentEmail],
          subject: `📈 Resultado LuinGo: Nivel ${result.level}`,
          html: `<p>Hola ${studentName}, tu nivel es <strong>${result.level}</strong>.<br/>Feedback: ${result.feedback}</p>`
        }),
      });
    }

    return c.json({ success: true, result });
  } catch (e) {
    return c.json({ success: false, error: String(e) }); // Devolver 200 con error para no romper el cliente
  }
});

Deno.serve(app.fetch);
