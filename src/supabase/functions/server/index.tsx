import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Configuración CORS Permisiva
app.use("/*", cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
}));

app.use('*', logger(console.log));

// Health check
app.get("/make-server-ebbb5c67/health", (c) => c.json({ status: "ok" }));

// ==========================================
// 👤 SIGNUP
// ==========================================
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

// ==========================================
// 🎓 PROXY MOODLE
// ==========================================
app.post("/make-server-ebbb5c67/moodle-proxy", async (c) => {
  try {
    const body = await c.req.json();
    const { functionName, params, settings } = body;
    const MOODLE_URL = settings?.url;
    const MOODLE_TOKEN = settings?.token;

    if (!MOODLE_URL || !MOODLE_TOKEN) return c.json({ error: "Missing config" }, 400);

    const url = new URL(MOODLE_URL);
    url.searchParams.append("wstoken", MOODLE_TOKEN);
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
  } catch (e) {
    return c.json({ error: "Failed to fetch from Moodle" }, 500);
  }
});

// ==========================================
// 📂 PROXIES DRIVE/ONEDRIVE
// ==========================================
app.get("/make-server-ebbb5c67/drive-proxy", async (c) => {
  const id = c.req.query("id");
  if (!id) return c.json({ error: "Falta ID" }, 400);
  try {
    const response = await fetch(`https://drive.google.com/uc?export=view&id=${id}`);
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Content-Type", "application/pdf");
    return new Response(response.body, { status: response.status, headers: newHeaders });
  } catch (e) { return c.json({ error: "Error Drive" }, 500); }
});

app.get("/make-server-ebbb5c67/onedrive-proxy", async (c) => {
  let fileUrl = c.req.query("url");
  if (!fileUrl) return c.json({ error: "Falta URL" }, 400);
  
  if (fileUrl.includes('<iframe')) {
      const srcMatch = fileUrl.match(/src="([^"]+)"/);
      if (srcMatch && srcMatch[1]) fileUrl = srcMatch[1];
  }
  fileUrl = fileUrl.replace(/["']/g, "").trim();

  try {
    let downloadUrl = fileUrl
      .replace("onedrive.live.com/embed", "onedrive.live.com/download")
      .replace("1drv.ms/b/s!", "1drv.ms/u/s!"); 

    const response = await fetch(downloadUrl);
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Content-Type", "application/pdf"); 
    return new Response(response.body, { status: response.status, headers: newHeaders });
  } catch (e) { return c.json({ error: "Error OneDrive" }, 500); }
});

Deno.serve(app.fetch);
