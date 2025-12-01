import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// ==========================================
// SECCIÓN DE BASE DE DATOS (INTEGRADA)
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

// ==========================================
// CONFIGURACIÓN DEL SERVIDOR
// ==========================================
const app = new Hono();

// Logger y CORS
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

// 1. Health check
app.get("/make-server-ebbb5c67/health", (c) => {
  return c.json({ status: "ok" });
});

// 2. Sign up
app.post("/make-server-ebbb5c67/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role: role || "student" },
        email_confirm: true,
      });

    if (error) {
      console.error("Error creating user:", error);
      return c.json({ error: error.message }, 400);
    }
    return c.json({ user: data.user });
  } catch (e) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 3. Moodle Proxy (CRÍTICO PARA EL TEST)
app.post("/make-server-ebbb5c67/moodle-proxy", async (c) => {
  try {
    const body = await c.req.json();
    const { functionName, params, settings, mode } = body;

    const MOODLE_URL = settings?.url;
    if (!MOODLE_URL) return c.json({ error: "Missing URL" }, 400);

    // MODO LOGIN
    if (mode === "login") {
      const loginUrl = new URL(`${MOODLE_URL}/login/token.php`);
      loginUrl.searchParams.append("username", params.username);
      loginUrl.searchParams.append("password", params.password);
      loginUrl.searchParams.append("service", "moodle_mobile_app");

      const response = await fetch(loginUrl.toString(), { method: "POST" });
      const data = await response.json();
      return c.json(data);
    }

    // MODO API
    const MOODLE_TOKEN = settings?.token;
    if (!MOODLE_TOKEN) return c.json({ error: "Missing Token" }, 400);

    const url = new URL(`${MOODLE_URL}/webservice/rest/server.php`);
    url.searchParams.append("wstoken", MOODLE_TOKEN);
    url.searchParams.append("moodlewsrestformat", "json");

    const formData = new URLSearchParams();
    formData.append("wsfunction", functionName);

    if (params) {
      Object.keys(params).forEach((key) => {
        formData.append(key, String(params[key]));
      });
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    const data = await response.json();
    return c.json(data);
  } catch (e) {
    console.error("Moodle proxy error:", e);
    return c.json({ error: "Failed to fetch from Moodle", details: String(e) }, 500);
  }
});

// 4. Preferencias de Usuario
app.post("/make-server-ebbb5c67/user-prefs", async (c) => {
  try {
    const { userId, data, action } = await c.req.json();
    if (!userId) return c.json({ error: "Missing userId" }, 400);
    const key = `user_prefs:${userId}`;

    if (action === "get") {
      const prefs = await kv.get(key);
      return c.json(prefs || {});
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

// 5. Envío de Emails (RESEND)
app.post("/make-server-ebbb5c67/send-email", async (c) => {
  try {
    const { to, subject, html } = await c.req.json();
    const RESEND_KEY = "re_d6oDB5rh_6EHLuWjQxqzWiXtJxmjcM2kB"; 

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: "LuinGo <hola@luingo.es>",
        to: to,
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();
    return c.json(data);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// 6. Evaluación con IA (Groq) + Notificación
app.post("/make-server-ebbb5c67/evaluate-level-test", async (c) => {
  try {
    const { studentName, studentEmail, answers, writingText } = await c.req.json();
    
    // 1. Configuración de claves
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || ""; // Configurado en Supabase Secrets
    const RESEND_KEY = "re_d6oDB5rh_6EHLuWjQxqzWiXtJxmjcM2kB";

    if (!GROQ_API_KEY) {
      console.error("⚠️ GROQ_API_KEY no configurada");
      return c.json({ 
        success: true, 
        result: { 
          level: "Pendiente", 
          feedback: "Tu test ha sido recibido. El profesor lo revisará manualmente pronto." 
        } 
      });
    }

    // 2. Prompt para el Evaluador (Groq)
    const systemPrompt = `
      Eres un examinador experto del Instituto Cervantes.
      Evalúa este Test de Nivel de Español.
      
      DATOS:
      - Respuestas Test: ${JSON.stringify(answers)}
      - Redacción: "${writingText}"
      
      TAREA:
      1. Analiza los errores gramaticales en las respuestas.
      2. Evalúa la redacción (coherencia, vocabulario, gramática).
      3. Determina el nivel CEFR exacto (A1, A2, B1, B2, C1, C2).
      4. Redacta un feedback breve, motivador y constructivo.
      
      SALIDA JSON ESTRICTA:
      {
        "level": "B1",
        "score": 75,
        "feedback": "...",
        "strengths": "...",
        "weaknesses": "..."
      }
    `;

    // 3. Llamada a Groq
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    const groqData = await groqResponse.json();
    const result = JSON.parse(groqData.choices[0]?.message?.content || "{}");

    // 4. Enviar Email con Resultado (Resend)
    if (studentEmail) {
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; background: #f0f4f8;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; text-align: center; border: 1px solid #e2e8f0;">
            <h1 style="color: #6344A6; margin: 0;">Resultados del Test</h1>
            <p style="color: #64748b;">Hola <strong>${studentName}</strong>, aquí está tu evaluación oficial.</p>
            
            <div style="background: #F3F0F9; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #6344A6; font-weight: bold; text-transform: uppercase;">Nivel Alcanzado</p>
              <p style="margin: 10px 0 0; font-size: 48px; font-weight: 900; color: #211259; line-height: 1;">${result.level}</p>
            </div>

            <div style="text-align: left; color: #334155; line-height: 1.6;">
              <p><strong>Feedback:</strong> ${result.feedback}</p>
              <p><strong>Fortalezas:</strong> ${result.strengths}</p>
              <p><strong>A mejorar:</strong> ${result.weaknesses}</p>
            </div>

            <div style="margin-top: 40px;">
              <a href="https://luingo.web.app" style="background-color: #F2B705; color: #211259; text-decoration: none; padding: 12px 24px; border-radius: 50px; font-weight: bold;">Volver a LuinGo</a>
            </div>
          </div>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from: "LuinGo <hola@luingo.es>",
          to: [studentEmail], // Enviar copia al profesor si se desea: cc: ["profe@luingo.es"]
          subject: `📈 Tu Nivel de Español es: ${result.level}`,
          html: emailHtml,
        }),
      });
    }

    return c.json({ success: true, result });

  } catch (e) {
    console.error("Evaluation error:", e);
    // Fallback elegante si falla la IA
    return c.json({ 
      success: true, 
      result: { 
        level: "Pendiente", 
        feedback: "Tu test ha sido recibido. El profesor lo revisará manualmente pronto." 
      } 
    }); 
  }
});

Deno.serve(app.fetch);