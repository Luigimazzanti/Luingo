import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Configuración CORS
app.use("/*", cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
}));

app.use('*', logger(console.log));

app.get("/make-server-ebbb5c67/health", (c) => c.json({ status: "ok" }));

// ==========================================
// 👤 SIGNUP (Registro de Usuarios)
// ==========================================
app.post("/make-server-ebbb5c67/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role } = body;
    if (!email || !password || !name) return c.json({ error: "Faltan datos" }, 400);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data, error } = await supabase.auth.admin.createUser({
      email, password, user_metadata: { name, role: role || 'student' }, email_confirm: true
    });

    if (error) return c.json({ error: error.message }, 400);
    return c.json({ user: data.user });
  } catch (e) { return c.json({ error: "Error interno" }, 500); }
});

// ==========================================
// 🎓 PROXY MOODLE (Esencial para la app)
// ==========================================
app.post("/make-server-ebbb5c67/moodle-proxy", async (c) => {
  try {
    const body = await c.req.json();
    const { functionName, params, settings } = body;
    
    if (!settings?.url || !settings?.token) return c.json({ error: "Configuración faltante" }, 400);

    const url = new URL(settings.url);
    url.searchParams.append("wstoken", settings.token);
    url.searchParams.append("moodlewsrestformat", "json");

    const formData = new URLSearchParams();
    formData.append("wsfunction", functionName);
    if (params) Object.keys(params).forEach((k) => formData.append(k, String(params[k])));

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
    });

    const data = await response.json();
    return c.json(data);
  } catch (e) { return c.json({ error: "Error de conexión con Moodle" }, 500); }
});

Deno.serve(app.fetch);
