// Usamos importaciones universales (esm.sh) para máxima estabilidad
import { Hono } from "https://esm.sh/hono@3.11.7";
import { cors } from "https://esm.sh/hono@3.11.7/cors";
import { logger } from "https://esm.sh/hono@3.11.7/logger";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const app = new Hono();

// Configuración CORS
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "x-client-info", "apikey"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.use("*", logger());

// Helper Supabase
const getSupabaseClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// KV Store Interno
const kv = {
  get: async (key: string) => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from("kv_store_ebbb5c67").select("value").eq("key", key).maybeSingle();
    return data?.value;
  },
  set: async (key: string, value: any) => {
    const supabase = getSupabaseClient();
    await supabase.from("kv_store_ebbb5c67").upsert({ key, value });
  }
};

// --- RUTAS DEL SERVIDOR ---

app.get("/make-server-ebbb5c67/health", (c) => c.json({ status: "ok" }));

app.post("/make-server-ebbb5c67/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    if (!email || !password) return c.json({ error: "Missing data" }, 400);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email, password, user_metadata: { name, role: role || "student" }, email_confirm: true
    });
    if (error) throw error;
    return c.json({ user: data.user });
  } catch (e: any) { return c.json({ error: e.message }, 400); }
});

app.post("/make-server-ebbb5c67/moodle-proxy", async (c) => {
  try {
    const { functionName, params, settings, mode } = await c.req.json();
    const MOODLE_URL = settings?.url;
    
    if (mode === "login") {
      const url = new URL(`${MOODLE_URL}/login/token.php`);
      url.searchParams.append("username", params.username);
      url.searchParams.append("password", params.password);
      url.searchParams.append("service", "moodle_mobile_app");
      const res = await fetch(url.toString(), { method: "POST" });
      return c.json(await res.json());
    }

    const MOODLE_TOKEN = settings?.token;
    const url = new URL(`${MOODLE_URL}/webservice/rest/server.php`);
    url.searchParams.append("wstoken", MOODLE_TOKEN);
    url.searchParams.append("moodlewsrestformat", "json");
    
    const formData = new URLSearchParams();
    formData.append("wsfunction", functionName);
    if (params) Object.keys(params).forEach(k => formData.append(k, String(params[k])));

    const res = await fetch(url.toString(), {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formData
    });
    return c.json(await res.json());
  } catch (e: any) { return c.json({ error: e.message }, 500); }
});

app.post("/make-server-ebbb5c67/user-prefs", async (c) => {
  try {
    const { userId, data, action } = await c.req.json();
    const key = `user_prefs:${userId}`;
    if (action === "get") return c.json((await kv.get(key)) || {});
    if (action === "save") {
      const current = (await kv.get(key)) || {};
      const merged = { ...current, ...data };
      await kv.set(key, merged);
      return c.json({ success: true, data: merged });
    }
    return c.json({ error: "Invalid action" }, 400);
  } catch (e: any) { return c.json({ error: e.message }, 500); }
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

// ✅ ENDPOINT DE EVALUACIÓN (ACTUALIZADO: Email a Profe + Tabla de Respuestas)
app.post("/make-server-ebbb5c67/evaluate-level-test", async (c) => {
  try {
    // 1. Recibimos teacherEmail del frontend
    const { studentName, studentEmail, teacherEmail, answers, writingText } = await c.req.json();
    const GROQ_KEY = Deno.env.get("GROQ_API_KEY");
    const RESEND_KEY = "re_d6oDB5rh_6EHLuWjQxqzWiXtJxmjcM2kB";

    // 2. Evaluación IA
    let result = { 
      level: "Pendiente", score: 0, feedback: "Evaluación en proceso...", 
      strengths: "Analizando...", weaknesses: "Analizando..." 
    };

    if (GROQ_KEY) {
      const systemPrompt = `
        Eres un examinador experto del Instituto Cervantes. Evalúa este Test de Nivel.
        
        DATOS:
        - Respuestas Test: ${JSON.stringify(answers)}
        - Redacción del alumno: "${writingText}"
        
        TAREA:
        1. Determina el nivel CEFR (A1-C2).
        2. Calcula puntuación (0-100).
        3. Feedback constructivo.
        
        SALIDA JSON ESTRICTA:
        { "level": "B1", "score": 75, "feedback": "...", "strengths": "...", "weaknesses": "..." }
      `;

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "system", content: systemPrompt }],
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          response_format: { type: "json_object" }
        })
      });
      
      const groqJson = await groqRes.json();
      const content = groqJson.choices?.[0]?.message?.content;
      if (content) result = JSON.parse(content);
    }

    // 3. Generar Tabla de Respuestas (HTML)
    // Crea filas alternas para mejor lectura
    const answersRows = answers.map((ans: any, i: number) => `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; font-size: 11px; color: #475569; vertical-align: top;">${i + 1}. ${ans.questionText.substring(0, 40)}...</td>
        <td style="padding: 8px; font-size: 11px; font-weight: bold; color: ${ans.isCorrect ? '#059669' : '#dc2626'}; vertical-align: top;">
          ${ans.studentAnswer}
        </td>
        <td style="padding: 8px; font-size: 11px; color: #64748b; vertical-align: top;">${ans.correctAnswer}</td>
      </tr>
    `).join('');

    // 4. Email con Branding LuinGo
    // Lista de destinatarios: Estudiante + Profesor
    const recipients = [];
    if (studentEmail) recipients.push(studentEmail);
    if (teacherEmail) recipients.push(teacherEmail);

    if (recipients.length > 0) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F0F4F8;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;">
                  
                  <tr>
                    <td style="background: linear-gradient(135deg, #6344A6 0%, #8B6BC7 100%); padding: 40px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">Informe Oficial de Nivel</h1>
                      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Estudiante: ${studentName}</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px;">
                      
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3F0F9; border-radius: 16px; margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 30px; text-align: center; border: 2px solid #6344A6; border-radius: 16px;">
                            <p style="margin: 0; font-size: 14px; text-transform: uppercase; font-weight: 700; color: #6344A6;">Nivel Certificado</p>
                            <p style="margin: 15px 0; font-size: 64px; font-weight: 900; color: #211259; line-height: 1;">${result.level}</p>
                            <span style="background-color: #F2B705; color: #211259; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 800;">
                              Score: ${result.score}/100
                            </span>
                          </td>
                        </tr>
                      </table>

                      <div style="margin-bottom: 30px;">
                        <h3 style="color: #334155; font-size: 18px; border-bottom: 2px solid #F2B705; display: inline-block; padding-bottom: 5px;">📝 Análisis del Profesor IA</h3>
                        <p style="color: #475569; line-height: 1.6;">${result.feedback}</p>
                        
                        <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
                           <strong style="color: #15803d;">✅ Fortalezas:</strong> ${result.strengths}
                        </div>
                        <div style="margin-top: 10px; padding: 15px; background: #fff7ed; border-radius: 8px; border-left: 4px solid #f97316;">
                           <strong style="color: #c2410c;">🚀 A Mejorar:</strong> ${result.weaknesses}
                        </div>
                      </div>

                      <div style="margin-bottom: 30px;">
                        <h3 style="color: #334155; font-size: 18px; margin-bottom: 10px;">✍️ Tu Redacción</h3>
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; font-style: italic; color: #475569; font-size: 14px;">
                          "${writingText}"
                        </div>
                      </div>

                      <div>
                        <h3 style="color: #334155; font-size: 18px; margin-bottom: 15px;">📊 Detalle de Respuestas</h3>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e2e8f0;">
                          <thead>
                            <tr style="background-color: #f1f5f9;">
                              <th align="left" style="padding: 10px; font-size: 10px; color: #64748b; text-transform: uppercase;">Pregunta</th>
                              <th align="left" style="padding: 10px; font-size: 10px; color: #64748b; text-transform: uppercase;">Respuesta</th>
                              <th align="left" style="padding: 10px; font-size: 10px; color: #64748b; text-transform: uppercase;">Correcta</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${answersRows}
                          </tbody>
                        </table>
                      </div>

                    </td>
                  </tr>
                  
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
                      <p style="margin: 0; color: #94a3b8; font-size: 12px;">LuinGo - Aprendizaje Gamificado</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: "LuinGo <hola@luingo.es>",
          to: recipients,
          subject: `📈 Resultados Test de Nivel: ${studentName} - ${result.level}`,
          html: emailHtml,
        }),
      });
    }

    return c.json({ success: true, result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message });
  }
});

Deno.serve(app.fetch);
