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

Deno.serve(app.fetch);