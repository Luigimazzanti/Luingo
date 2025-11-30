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
    const { functionName, params, settings, mode } = body;

    const MOODLE_URL = settings?.url;
    if (!MOODLE_URL) return c.json({ error: "Missing URL" }, 400);

    // 🔑 MODO LOGIN: Solicitar Token de Usuario
    if (mode === 'login') {
        const loginUrl = new URL(`${MOODLE_URL}/login/token.php`);
        loginUrl.searchParams.append("username", params.username);
        loginUrl.searchParams.append("password", params.password);
        loginUrl.searchParams.append("service", "moodle_mobile_app"); 

        const response = await fetch(loginUrl.toString(), { method: 'POST' });
        const data = await response.json();
        return c.json(data);
    }

    // 📡 MODO API: Llamada normal con Token
    const MOODLE_TOKEN = settings?.token;
    if (!MOODLE_TOKEN) {
        return c.json({ error: "Missing Moodle Token in request settings" }, 400);
    }

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

// Endpoint para Preferencias de Usuario (Avatar, Nivel, etc.)
app.post("/make-server-ebbb5c67/user-prefs", async (c) => {
  try {
    const { userId, data, action } = await c.req.json();
    
    if (!userId) return c.json({ error: "Missing userId" }, 400);
    const key = `user_prefs:${userId}`;

    if (action === 'get') {
       const prefs = await kv.get(key);
       return c.json(prefs || {});
    }

    if (action === 'save') {
       const existing = await kv.get(key) || {};
       const merged = { ...existing, ...data };
       await kv.set(key, merged);
       return c.json({ success: true, data: merged });
    }

    return c.json({ error: "Invalid action" }, 400);
  } catch (e) {
    console.error("User prefs error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// ✅ EMAIL SERVICE (RESEND)
app.post("/make-server-ebbb5c67/send-email", async (c) => {
  try {
    const { to, subject, html } = await c.req.json();
    
    // 🔑 CLAVE REAL DE RESEND
    const RESEND_KEY = "re_d6oDB5rh_6EHLuWjQxqzWiXtJxmjcM2kB"; 

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_KEY}`
      },
      body: JSON.stringify({
        from: 'LuinGo <onboarding@resend.dev>', // Cambia esto si verificas tu dominio en Resend
        to: to, 
        subject: subject,
        html: html
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error("Resend API error:", data);
      return c.json({ error: data }, res.status);
    }
    
    console.log("✅ Email enviado exitosamente:", data);
    return c.json(data);

  } catch (e) {
    console.error("Email error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// ✅ AI PROXY (GROQ - Fix CORS)
app.post("/make-server-ebbb5c67/ai-proxy", async (c) => {
  try {
    const { messages, model, apiKey } = await c.req.json();
    
    if (!apiKey) {
      return c.json({ error: "API Key is required" }, 400);
    }

    console.log("🤖 Llamando a Groq API con modelo:", model);
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ 
        model: model || "llama3-70b-8192", 
        messages, 
        temperature: 0.5 
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Groq API error:", data);
      return c.json({ error: data }, response.status);
    }
    
    console.log("✅ IA respondió exitosamente");
    return c.json(data);

  } catch (e) {
    console.error("AI Proxy error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

Deno.serve(app.fetch);