# 🐵 LuinGo - Plataforma LMS Ultra-Ligera con Personalidad de Mono

## 🎯 Visión del Proyecto

**LuinGo** es una plataforma LMS (Learning Management System) web ultra-ligera, funcional y moderna que se siente como una App nativa (PWA). El proyecto prioriza la **velocidad de carga**, la **privacidad del alumno** y un **flujo de trabajo visual** para el profesor, todo envuelto en la personalidad ágil y divertida de un mono.

### Logo y Personalidad
- **Logo**: Un mono gracioso y vistoso 🐵
- **Personalidad**: Ágil, divertida, motivadora, pero siempre enfocada en el aprendizaje
- **Tono**: Cercano, amigable, ligeramente divertido sin ser cursi

---

## 🎨 Identidad Visual Pastel "Clean & Playful"

### Paleta de Colores
```css
--pastel-sky-blue: #A8D8FF    /* Azul Cielo - Información/Tareas */
--pastel-vanilla: #FFF4B7     /* Amarillo Vainilla - XP/Pendientes */
--pastel-coral: #FFB5A7       /* Coral Suave - Urgentes/Correcciones */
--pastel-mint: #B5F8D4        /* Verde Menta - Completadas */
--pastel-lavender: #E0BBE4    /* Lavanda - IA/Gamificación */
--pastel-peach: #FFE5D9       /* Durazno - Secundario */
```

### Estilo Visual
- ✅ Tarjetas (Cards) con bordes redondeados (1rem)
- ✅ Sombras suaves (estilo Material Design 3)
- ✅ Espaciado generoso para evitar saturación cognitiva
- ✅ Animaciones fluidas de 300ms
- ✅ Tipografía: Poppins (sans-serif moderna y legible)

---

## 🍌 Sistema de Gamificación "Sistema Banana"

### Niveles LuinGo
| Nivel | XP Mínimo | XP Máximo | Título | Emoji |
|-------|-----------|-----------|--------|-------|
| 1 | 0 | 199 | Mono Curioso | 🐵 |
| 2 | 200 | 499 | Mono Explorador | 🙈 |
| 3 | 500 | 799 | Mono Estudioso | 🙉 |
| 4 | 800 | 1099 | Mono Sabio | 🙊 |
| 5 | 1100+ | ∞ | Mono Maestro | 🐒 |

### Valores de XP por Acción
- 📝 Entregar tarea: **100 XP**
- 💬 Publicar comentario: **10 XP**
- 👁️ Ver material (video/PDF): **20 XP**
- ⭐ Calificación perfecta: **150 XP** (bonus)

### Implementación Visual
```typescript
// Badge sutil en dashboard del alumno
<XPBadge xp={850} level={4} />

// Mini badge en tarjetas de estudiantes
<MiniXPBadge xp={850} level={4} />

// Barra de progreso con animación
<div className="h-2 bg-gradient-to-r from-[#FFF4B7] to-[#FFE082]" />
```

---

## 👁️ Analytics de Consumo Básico

### Indicadores para el Profesor
El dashboard del profesor muestra **quién** ha visto cada material:

```typescript
interface MaterialAnalytics {
  material_id: string;
  viewed_count: number;          // 4 de 6 estudiantes
  view_percentage: number;       // 66.7%
  viewed_by: string[];           // ['student-1', 'student-2', ...]
}
```

### Visualización en StudentCard
- ✅ **Icono de ojo verde**: Vio todos los materiales
- ⚠️ **Icono de ojo naranja**: No ha visto todos los materiales
- 📊 **Barra de progreso**: X/Y materiales vistos

**Ejemplo visual**:
```
Materiales: 2/3 materiales
[████████░░░] 66%
```

---

## 🤖 Personalidad de IA - "LuinGo el Mono Maestro"

### System Prompt para la API de IA

```javascript
const luingoSystemPrompt = `
Eres LuinGo, un mono maestro muy sabio y divertido. Tu misión es ayudar a los profesores
a crear tareas educativas motivadoras. Debes ser:
- Motivador y entusiasta (pero sin exagerar)
- Educativo y claro en tus instrucciones
- Ligeramente divertido (usa emojis con moderación: 🐵 🍌 ⭐ 🎯)
- Enfocado en el aprendizaje activo

Cuando generes una tarea, usa un tono que inspire a los estudiantes a aprender.
No seas cursi, pero sí cercano y amigable.
`;
```

### Ejemplo de Generación de Tarea

**Input del profesor**:  
Tema: "El ciclo del agua"

**Output de LuinGo IA**:
```javascript
{
  title: "🌊 El Increíble Viaje del Agua",
  description: `¡Hola exploradores! 🐵
  
  Vamos a descubrir cómo el agua viaja desde los océanos hasta las nubes y 
  regresa a la tierra. Es un ciclo que nunca se detiene, ¡como un mono 
  saltando de árbol en árbol!
  
  📝 Tu misión:
  1. Ver el video sobre el ciclo del agua
  2. Crear un dibujo o diagrama que explique cada etapa
  3. Escribir 3 cosas que aprendiste
  
  🎯 Tip: Piensa en cómo usas el agua todos los días. ¡Eso te dará ideas!`,
  
  rubric: {
    criteria: [
      { name: "Comprensión", description: "Entendiste el ciclo", points: 40 },
      { name: "Creatividad", description: "Tu diagrama es original", points: 30 },
      { name: "Claridad", description: "Explicas bien tus ideas", points: 30 }
    ],
    total_points: 100
  },
  
  suggested_resources: [
    "Video: El Ciclo del Agua para Niños",
    "Infografía interactiva (Genially)",
    "Hoja de trabajo para dibujar"
  ]
}
```

---

## 🔔 Sistema de Notificaciones en Tiempo Real

### Tipos de Notificaciones
| Tipo | Trigger | Visual | Prioridad |
|------|---------|--------|-----------|
| `task_assigned` | Profesor asigna tarea nueva | 📄 Azul | Media |
| `comment_corrected` | Profesor corrige comentario del alumno | 💬 Coral | Alta |
| `grade_received` | Alumno recibe calificación | 🏆 Amarillo | Media |
| `level_up` | Alumno sube de nivel | ⭐ Lavanda | Alta |

### Componente NotificationBell
```typescript
<NotificationBell
  notifications={notifications}
  onMarkAsRead={handleMarkAsRead}
  onClearAll={handleClearAll}
/>
```

### Características
- 🔴 **Badge con contador**: Muestra número de notificaciones no leídas
- ⏱️ **Timestamps**: "Hace 30 minutos"
- 🎨 **Código de color**: Cada tipo tiene su gradiente pastel
- ✅ **Marcar como leída**: Click individual
- 🧹 **Limpiar todas**: Botón de acción rápida

### Integración con Supabase Real-time
```javascript
// Suscripción a nuevas notificaciones
supabase
  .from('notifications')
  .on('INSERT', payload => {
    setNotifications(prev => [payload.new, ...prev]);
    showToast(`Nueva notificación: ${payload.new.title}`);
  })
  .subscribe();
```

---

## 📊 Estructura de Base de Datos (PostgreSQL + Supabase)

### Tablas Nuevas Agregadas

#### **xp_events** (Sistema Banana)
```sql
CREATE TABLE xp_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type event_type NOT NULL, -- 'task_submitted', 'comment_posted', etc.
    xp_earned INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_xp_events_student ON xp_events(student_id, created_at DESC);
```

#### **notifications** (Sistema de Alertas)
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL, -- 'task_assigned', 'comment_corrected', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id UUID, -- ID de tarea, comentario, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- Real-time subscription habilitada
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

#### **material_views** (Analytics de Consumo)
```sql
CREATE TABLE material_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT NOW(),
    time_spent INTEGER, -- Segundos
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(material_id, student_id)
);

CREATE INDEX idx_material_views ON material_views(material_id, student_id);
```

---

## 🏗️ Stack Tecnológico Completo

### Frontend (Implementado)
```json
{
  "react": "^18.3.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^4.0.0",
  "lucide-react": "latest",
  "motion": "latest"
}
```

### Backend (Recomendado)
```
📦 NestJS (Node.js con estructura profesional)
   ├── @nestjs/core
   ├── @nestjs/common
   ├── @nestjs/websockets (para real-time)
   └── @supabase/supabase-js

🗄️ Supabase (Backend-as-a-Service)
   ├── PostgreSQL (Base de datos)
   ├── Auth (OAuth 2.0: Google, Microsoft)
   ├── Storage (S3-compatible para PDFs y videos)
   ├── Realtime (WebSockets nativos)
   └── Edge Functions (Serverless)

🤖 OpenAI / Anthropic Claude
   └── API para generación de tareas con personalidad LuinGo
```

### Ventajas de Supabase para LuinGo
✅ **Tiempo real nativo**: Notificaciones instantáneas sin configurar WebSockets manualmente  
✅ **Auth integrado**: OAuth 2.0 de Google/Microsoft sin complejidad  
✅ **Almacenamiento**: Subida de archivos con URLs firmadas  
✅ **Políticas RLS**: Seguridad a nivel de fila (Row-Level Security)  
✅ **Gratis hasta 500MB**: Perfecto para MVP y pruebas  

---

## 🚀 Arquitectura de Componentes

```
LuinGo/
├── App.tsx (Root component)
├── components/
│   ├── TeacherDashboard.tsx      # Dashboard Kanban del profesor
│   ├── StudentCard.tsx            # Tarjeta de estudiante con analytics
│   ├── CommentWall.tsx            # Muro de comentarios con corrección
│   ├── MediaViewer.tsx            # Visor multimedia (video/PDF/Genially)
│   ├── NotificationBell.tsx       # 🔔 Campana de notificaciones
│   ├── XPBadge.tsx                # 🍌 Badge de nivel y XP
│   └── ui/                        # Componentes reutilizables (buttons, inputs...)
├── types/
│   └── index.ts                   # TypeScript types + Esquema BD completo
├── lib/
│   ├── mockData.ts                # Datos de ejemplo con XP y notificaciones
│   └── supabaseClient.ts          # Cliente de Supabase (a implementar)
└── styles/
    └── globals.css                # Paleta pastel personalizada
```

---

## 🎯 Funcionalidades Core Implementadas

### ✅ 1. Identidad Visual Pastel
- Paleta de colores completa
- Diseño "Clean & Playful"
- Tipografía Poppins
- Animaciones fluidas

### ✅ 2. UX de Privacidad (Privacy First)
- Sistema de invitación "invite-only"
- Magic Links + Códigos QR
- Solo email y nombre requeridos
- OAuth 2.0 preparado

### ✅ 3. Funcionalidades Core
- **IA con personalidad**: System prompt de LuinGo
- **Multimedia**: YouTube, PDF, Genially
- **Comentarios con corrección**: Única funcionalidad tipo "Control de Cambios"

### ✅ 4. Sistema Banana (Gamificación)
- 5 niveles de Mono
- XP por acciones
- Badges sutiles
- Progreso visual

### ✅ 5. Analytics de Consumo
- Indicador de materiales vistos
- Vista por estudiante
- Iconos visuales en StudentCard

### ✅ 6. Personalidad de IA
- System prompt motivador
- Tono divertido pero educativo
- Emojis con moderación

### ✅ 7. Notificaciones en Tiempo Real
- Campana con badge de contador
- 4 tipos de notificaciones
- Colores por categoría
- Preparado para Supabase Realtime

---

## 🔌 Integración con Supabase (Guía de Implementación)

### Paso 1: Crear cliente de Supabase
```typescript
// /lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Paso 2: Autenticación OAuth
```typescript
// Login con Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'email profile', // Solo datos mínimos
    redirectTo: 'https://luingo.app/dashboard'
  }
});
```

### Paso 3: Notificaciones en Tiempo Real
```typescript
useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      },
      (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        // Mostrar toast o animación
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentUser]);
```

### Paso 4: Tracking de Visualización de Materiales
```typescript
const handleMaterialView = async (materialId: string) => {
  // Registrar que el estudiante vio el material
  const { data, error } = await supabase
    .from('material_views')
    .upsert({
      material_id: materialId,
      student_id: currentUser.id,
      viewed_at: new Date().toISOString(),
      completed: true
    });

  // Otorgar XP por ver material
  if (!error) {
    await awardXP(currentUser.id, 'material_viewed', 20);
  }
};
```

### Paso 5: Sistema de XP con Triggers
```sql
-- Función que otorga XP y actualiza nivel
CREATE OR REPLACE FUNCTION award_xp(
  p_student_id UUID,
  p_event_type event_type,
  p_xp_amount INTEGER
)
RETURNS void AS $$
DECLARE
  v_new_total INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Insertar evento de XP
  INSERT INTO xp_events (student_id, event_type, xp_earned, description)
  VALUES (p_student_id, p_event_type, p_xp_amount, '');

  -- Calcular nuevo total de XP
  SELECT COALESCE(SUM(xp_earned), 0)
  INTO v_new_total
  FROM xp_events
  WHERE student_id = p_student_id;

  -- Determinar nuevo nivel basado en XP
  v_new_level := CASE
    WHEN v_new_total >= 1100 THEN 5
    WHEN v_new_total >= 800 THEN 4
    WHEN v_new_total >= 500 THEN 3
    WHEN v_new_total >= 200 THEN 2
    ELSE 1
  END;

  -- Actualizar perfil del estudiante
  UPDATE classroom_students
  SET xp_points = v_new_total, level = v_new_level
  WHERE student_id = p_student_id;

  -- Si subió de nivel, crear notificación
  IF v_new_level > (SELECT level FROM classroom_students WHERE student_id = p_student_id LIMIT 1) THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      p_student_id,
      'level_up',
      '¡Subiste de nivel! 🐵',
      'Ahora eres un ' || (SELECT title FROM levels WHERE level = v_new_level) || '. ¡Sigue así!'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎨 Componentes UI Destacados

### 1. XPBadge (Sistema Banana)
```tsx
<XPBadge xp={850} level={4} size="md" showDetails={true} />
```
**Features**:
- Muestra emoji del nivel actual
- Barra de progreso hasta el siguiente nivel
- Mensaje motivador cerca de subir de nivel

### 2. NotificationBell
```tsx
<NotificationBell
  notifications={notifications}
  onMarkAsRead={handleMarkAsRead}
  onClearAll={handleClearAll}
/>
```
**Features**:
- Badge animado con contador
- Popover con scroll
- Notificaciones agrupadas por tipo

### 3. StudentCard con Analytics
```tsx
<StudentCard
  student={student}
  onClick={() => setSelectedStudent(student.id)}
  totalMaterials={3}
/>
```
**Features**:
- Badge de XP (🍌 Sistema Banana)
- Indicador de materiales vistos (👁️)
- Código de color según rendimiento
- Animación al hover

---

## 📱 PWA (Progressive Web App)

### Características para sentirse como App Nativa
```json
// manifest.json
{
  "name": "LuinGo - Aprende Jugando",
  "short_name": "LuinGo",
  "description": "Plataforma LMS ultra-ligera con personalidad de mono",
  "theme_color": "#FFF4B7",
  "background_color": "#FAFBFC",
  "display": "standalone",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "start_url": "/dashboard"
}
```

### Optimizaciones de Velocidad
- ✅ **Code Splitting**: Componentes cargados bajo demanda
- ✅ **Lazy Loading**: Imágenes y videos
- ✅ **Service Workers**: Caché inteligente
- ✅ **Compresión**: Gzip/Brotli en producción
- ✅ **CDN**: Cloudflare o Vercel Edge

**Objetivo**: First Contentful Paint (FCP) < 1.5s

---

## 🔒 Seguridad y Privacidad

### Datos Mínimos Requeridos
```typescript
interface MinimalUserData {
  email: string;    // Solo para login
  name: string;     // Para personalización
  // NO recopilamos: teléfono, dirección, fecha de nacimiento, etc.
}
```

### Políticas de Seguridad (Supabase RLS)
```sql
-- Solo los profesores pueden ver estudiantes de sus clases
CREATE POLICY "Teachers can view their students"
ON classroom_students FOR SELECT
USING (
  classroom_id IN (
    SELECT id FROM classrooms WHERE teacher_id = auth.uid()
  )
);

-- Los estudiantes solo ven sus propias calificaciones
CREATE POLICY "Students view own submissions"
ON task_submissions FOR SELECT
USING (student_id = auth.uid());
```

### Cumplimiento
- ✅ **GDPR**: Right to be forgotten, data export
- ✅ **FERPA**: No compartir datos educativos sin consentimiento
- ✅ **COPPA**: Confirmación de edad para menores de 13 años

---

## 📈 Métricas de Éxito

### Performance
- ⚡ Tiempo de carga inicial: **< 2 segundos**
- ⚡ Time to Interactive (TTI): **< 3 segundos**
- ⚡ Lighthouse Score: **> 90/100**

### UX
- 🎯 Onboarding completo: **< 5 minutos**
- 🎯 Crear tarea con IA: **< 30 segundos**
- 🎯 Corregir comentario: **< 1 minuto**

### Gamificación
- 🍌 Tasa de engagement: **> 80%** (estudiantes activos semanalmente)
- 🍌 Completitud de tareas: **> 85%**
- 🍌 Interacción en comentarios: **> 3 comentarios/alumno/semana**

---

## 🎉 Diferenciadores Clave de LuinGo

| Feature | LuinGo | Google Classroom | Moodle |
|---------|--------|------------------|--------|
| **Personalidad de marca** | 🐵 Mono divertido y motivador | Corporativo | Académico serio |
| **Gamificación** | ✅ Sistema Banana (XP y niveles) | ❌ | Plugins complejos |
| **IA con personalidad** | ✅ LuinGo genera tareas motivadoras | ❌ | ❌ |
| **Corrección de comentarios** | ✅ Tipo "Control de Cambios" | ❌ | ❌ |
| **Analytics visual** | ✅ Indicadores de consumo | Básico | Complejo |
| **Notificaciones real-time** | ✅ Con Supabase | Emails | Emails |
| **PWA ultra-ligera** | ✅ < 2s carga | App pesada | App muy pesada |
| **Privacidad** | ✅ Solo email y nombre | Cuenta Google completa | Muchos datos |
| **Onboarding** | Magic Links + QR | Códigos de clase | Muy complejo |

---

## 🛠️ Próximos Pasos de Desarrollo

### Fase 1: Backend con Supabase (2 semanas)
- [ ] Configurar proyecto de Supabase
- [ ] Crear esquema de BD con migraciones
- [ ] Implementar OAuth 2.0 (Google + Microsoft)
- [ ] Configurar Real-time subscriptions
- [ ] Habilitar Storage para PDFs y videos

### Fase 2: Integración Frontend-Backend (2 semanas)
- [ ] Conectar Supabase client
- [ ] Implementar autenticación
- [ ] Real-time notifications funcionando
- [ ] Sistema de XP con triggers
- [ ] Analytics de consumo de materiales

### Fase 3: IA y Personalidad (1 semana)
- [ ] Integrar OpenAI/Claude API
- [ ] Implementar system prompt de LuinGo
- [ ] Generación de tareas completa
- [ ] Sugerencias inteligentes de recursos

### Fase 4: PWA y Optimización (1 semana)
- [ ] Configurar Service Workers
- [ ] Manifest.json completo
- [ ] Optimización de imágenes
- [ ] Code splitting avanzado
- [ ] Lighthouse > 90

### Fase 5: Testing y Lanzamiento (1 semana)
- [ ] Tests E2E con Playwright
- [ ] Tests unitarios de componentes críticos
- [ ] Beta testing con 1 aula real
- [ ] Ajustes basados en feedback
- [ ] 🚀 Lanzamiento MVP

---

## 📞 Contacto y Soporte

**Desarrollado para**: Profesores que quieren una plataforma LMS moderna, rápida y divertida  
**Ideal para**: Primaria y Secundaria (6-16 años)

---

**LuinGo** - Aprende jugando 🐵🍌  
*Plataforma LMS ultra-ligera con personalidad de mono*

**Stack**: React · TypeScript · Tailwind CSS · Supabase · NestJS  
**Versión**: 1.0.0 MVP  
**Última actualización**: Noviembre 2024
