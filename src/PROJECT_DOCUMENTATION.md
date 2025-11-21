# 🎓 EduPlay LMS - Plataforma Educativa Ligera y Moderna

## 📋 Índice
1. [Visión General](#visión-general)
2. [Identidad Visual](#identidad-visual)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Esquema de Base de Datos](#esquema-de-base-de-datos)
6. [Componentes Principales](#componentes-principales)
7. [Funcionalidades Core](#funcionalidades-core)
8. [Stack Tecnológico](#stack-tecnológico)
9. [Guía de Implementación](#guía-de-implementación)

---

## 🎯 Visión General

**EduPlay LMS** es una plataforma de gestión de aprendizaje (LMS) ligera y moderna, diseñada como alternativa a Google Classroom. Prioriza una experiencia de usuario divertida, fluida y no intimidante, con énfasis en la privacidad y facilidad de gestión para el profesorado.

### Principios de Diseño
- **Clean & Playful**: Diseño minimalista pero amigable
- **Privacy First**: Mínima recopilación de datos
- **Teacher Empowerment**: Herramientas poderosas pero simples
- **Student Engagement**: Interfaz motivadora y social

---

## 🎨 Identidad Visual

### Paleta de Colores Pasteles
```css
--pastel-sky-blue: #A8D8FF    /* Azul Cielo - Tareas/Información */
--pastel-vanilla: #FFF4B7     /* Amarillo Vainilla - Pendientes */
--pastel-coral: #FFB5A7       /* Coral Suave - Urgentes */
--pastel-mint: #B5F8D4        /* Verde Menta - Completadas */
--pastel-lavender: #E0BBE4    /* Lavanda - IA/Especial */
--pastel-peach: #FFE5D9       /* Durazno - Secundario */
```

### Tipografía
- **Fuente principal**: Poppins (Google Fonts)
- **Alternativas**: Quicksand, Nunito
- **Características**: Sans-serif, moderna, legible y amigable

### Estilo Visual
- **Bordes redondeados**: 1rem (16px) - `border-radius: 1rem`
- **Sombras suaves**: `shadow-sm`, `shadow-md`, `shadow-lg`
- **Espaciado generoso**: Evitar saturación cognitiva
- **Tarjetas (Cards)**: Elemento principal de UI
- **Animaciones**: Transiciones suaves de 300ms

---

## 🏗️ Arquitectura del Sistema

### Flujo de Usuario

```
┌─────────────────┐
│   OAuth 2.0     │
│  (Google/MS)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Teacher Creates │
│   Classroom     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Generate QR/   │────▶│  Students    │
│  Magic Link     │     │  Join        │
└─────────────────┘     └──────┬───────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  Task Creation   │
                    │  (Manual or AI)  │
                    └────────┬─────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
        ┌──────────────┐        ┌─────────────────┐
        │  Materials   │        │   Submissions   │
        │  (Video/PDF) │        │   & Grading     │
        └──────┬───────┘        └─────────────────┘
               │
               ▼
        ┌──────────────┐
        │  Comments    │
        │  (Social     │
        │   Wall)      │
        └──────────────┘
```

---

## 📁 Estructura de Carpetas

```
/
├── App.tsx                      # Componente principal de la aplicación
├── components/
│   ├── TeacherDashboard.tsx    # Dashboard tipo Kanban del profesor
│   ├── StudentCard.tsx          # Tarjeta individual de estudiante
│   ├── CommentWall.tsx          # Muro de comentarios con corrección
│   ├── MediaViewer.tsx          # Visor multimedia (video/PDF/Genially)
│   ├── ProjectStructure.tsx     # Documentación visual del proyecto
│   └── ui/                      # Componentes UI reutilizables (botones, inputs, etc.)
├── types/
│   └── index.ts                 # TypeScript types + Esquema de BD completo
├── lib/
│   └── mockData.ts              # Datos de ejemplo para desarrollo
├── styles/
│   └── globals.css              # Estilos globales + Paleta pastel personalizada
└── PROJECT_DOCUMENTATION.md     # Este documento
```

---

## 🗄️ Esquema de Base de Datos

### Diagrama de Relaciones

```
users (1) ────< (N) classrooms
                     │
                     │ (1)
                     │
                     ├──< (N) classroom_students >──┐
                     │                                │
                     │ (1)                           │ (N)
                     │                                │
                     └──< (N) tasks                 users (students)
                              │
                              │ (1)
                              │
                              ├──< (N) task_submissions
                              │
                              └──< (N) materials
                                       │
                                       │ (1)
                                       │
                                       ├──< (N) comments ──┐
                                       │                    │ (self-reference)
                                       │                    └─< replies
                                       │
                                       └──< (N) pdf_annotations
```

### Tablas Principales

#### 1. **users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL, -- ENUM('teacher', 'student')
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. **classrooms**
```sql
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    color_theme VARCHAR(7), -- Hex color
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. **classroom_students** (Many-to-Many)
```sql
CREATE TABLE classroom_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(classroom_id, student_id)
);

CREATE INDEX idx_classroom_students ON classroom_students(classroom_id, student_id);
```

#### 4. **tasks**
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    rubric JSON, -- Criterios de evaluación generados por IA
    ai_generated BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMP,
    status task_status DEFAULT 'draft', -- ENUM('draft', 'published', 'archived')
    category task_category, -- ENUM('homework', 'project', 'quiz', 'reading')
    color_tag VARCHAR(7), -- Pastel color
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_classroom ON tasks(classroom_id, status);
```

#### 5. **task_submissions**
```sql
CREATE TABLE task_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    status submission_status DEFAULT 'pending', -- ENUM('pending', 'submitted', 'reviewed', 'returned')
    grade DECIMAL(5,2),
    teacher_feedback TEXT,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. **materials**
```sql
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    type material_type NOT NULL, -- ENUM('video', 'pdf', 'genially', 'link', 'image')
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    embed_code TEXT, -- Para Genially
    thumbnail_url TEXT,
    duration INTEGER, -- Segundos (para videos)
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. **comments** ⭐ (Funcionalidad única de corrección)
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    original_content TEXT, -- Versión antes de corrección
    corrected_by UUID REFERENCES users(id), -- Profesor que corrigió
    corrections JSON, -- Array de {start, end, original, correction, type}
    is_corrected BOOLEAN DEFAULT FALSE,
    parent_id UUID REFERENCES comments(id), -- Para respuestas anidadas
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_material ON comments(material_id, created_at DESC);
```

**Estructura de corrections JSON:**
```json
[
  {
    "start": 31,
    "end": 38,
    "original": "Aprendi",
    "correction": "Aprendí",
    "type": "spelling"
  },
  {
    "start": 97,
    "end": 102,
    "original": "nuves",
    "correction": "nubes",
    "type": "spelling"
  }
]
```

#### 8. **pdf_annotations**
```sql
CREATE TABLE pdf_annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    annotation_type annotation_type NOT NULL, -- ENUM('highlight', 'note', 'drawing')
    content TEXT,
    coordinates JSON, -- {x, y, width, height}
    color VARCHAR(7),
    drawing_path JSON, -- Array de {x, y} para dibujos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pdf_annotations_material ON pdf_annotations(material_id, page_number);
```

---

## 🧩 Componentes Principales

### 1. **TeacherDashboard.tsx**
**Propósito**: Vista principal del profesor con tablero tipo Kanban

**Características**:
- Grid de tarjetas de estudiantes
- Estadísticas del aula (promedio, completitud, tareas activas)
- Diálogo de invitación (QR + Magic Link)
- Diálogo de generación de tareas con IA
- Códigos de color según rendimiento

**Props**:
```typescript
interface TeacherDashboardProps {
  classroom: Classroom;
  students: Student[];
  tasks: Task[];
  onSelectStudent: (studentId: string) => void;
  onGenerateTask: (topic: string) => void;
}
```

### 2. **CommentWall.tsx** ⭐
**Propósito**: Muro de comentarios con función única de corrección del profesor

**Características ÚNICAS**:
- **Modo corrección** (solo profesores): Permite seleccionar texto del comentario del alumno y corregirlo
- **Visualización tipo "Control de Cambios"**: Muestra texto original tachado y corrección en verde
- **Comentarios anidados**: Sistema de respuestas tipo Facebook
- **Permisos Super-Admin**: El profesor puede editar y corregir cualquier comentario de estudiantes

**Flujo de corrección**:
1. Profesor hace clic en "Corregir" en un comentario de estudiante
2. Selecciona el texto incorrecto con el mouse
3. Escribe la corrección
4. Puede agregar múltiples correcciones
5. Guarda todas las correcciones de una vez
6. El comentario se actualiza mostrando correcciones visuales

**Props**:
```typescript
interface CommentWallProps {
  materialId: string;
  comments: Comment[];
  currentUser: User;
  onAddComment: (content: string, parentId?: string) => void;
  onCorrectComment: (commentId: string, corrections: Correction[]) => void;
}
```

### 3. **StudentCard.tsx**
**Propósito**: Tarjeta individual de estudiante en el dashboard

**Características**:
- Avatar con indicador de tareas completadas
- Barra de progreso animada
- Código de color según promedio (verde ≥9, azul ≥8, amarillo ≥7, coral <7)
- Estadísticas: promedio y tareas pendientes
- Animación al hover

### 4. **MediaViewer.tsx**
**Propósito**: Visor multimedia con soporte para múltiples formatos

**Características**:
- **Video**: YouTube/Vimeo embebido con lazy loading
- **PDF**: Visor integrado (en producción usaría PDF.js)
- **Genially**: Soporte para embeds interactivos
- **Links externos**: Preview y redirección
- Panel lateral con lista de materiales filtrable por tipo
- Thumbnails con íconos de tipo de material

---

## ⚙️ Funcionalidades Core

### 1. **Sistema de Invitación (Privacy First)**
```typescript
// Modelo "Invite-Only"
const inviteCode = generateUniqueCode(); // Ej: "CN5B-2024"
const magicLink = `https://edtech.app/join/${inviteCode}`;

// OAuth 2.0 - Solo datos mínimos
const requiredData = {
  email: user.email,
  name: user.name
  // NO se solicita: fecha de nacimiento, teléfono, dirección, etc.
};
```

### 2. **Generación de Tareas con IA** ⭐
```typescript
interface AITaskGenerationRequest {
  topic: string;
  grade_level?: string;
  subject?: string;
  duration?: number;
}

// Integración con OpenAI/Anthropic
const response = await fetch('/api/generate-task', {
  method: 'POST',
  body: JSON.stringify({
    topic: "El ciclo del agua",
    grade_level: "5º Primaria",
    subject: "Ciencias Naturales"
  })
});

// Respuesta automática de la IA:
{
  title: "El Ciclo del Agua: De la Tierra al Cielo",
  description: "Investiga y crea una presentación...",
  rubric: {
    criteria: [
      { name: "Investigación", points: 30 },
      { name: "Creatividad", points: 30 },
      { name: "Claridad", points: 40 }
    ],
    total_points: 100
  },
  suggested_resources: [
    "https://example.com/video-ciclo-agua",
    "https://example.com/pdf-guia"
  ]
}
```

### 3. **Sistema de Corrección del Profesor** ⭐⭐⭐
**FUNCIONALIDAD ÚNICA Y DESTACADA**

```typescript
// Estructura de corrección
interface Correction {
  start: number;      // Índice de inicio del texto
  end: number;        // Índice de fin
  original: string;   // Texto original del alumno
  correction: string; // Corrección del profesor
  type: 'spelling' | 'grammar' | 'concept';
}

// Proceso de corrección
const handleCorrectComment = (commentId: string, corrections: Correction[]) => {
  // 1. Almacenar contenido original
  const originalContent = comment.content;
  
  // 2. Aplicar correcciones al texto
  let correctedContent = originalContent;
  corrections.sort((a, b) => b.start - a.start); // Orden inverso
  
  corrections.forEach(corr => {
    correctedContent = 
      correctedContent.substring(0, corr.start) +
      corr.correction +
      correctedContent.substring(corr.end);
  });
  
  // 3. Actualizar comentario
  updateComment({
    content: correctedContent,
    original_content: originalContent,
    corrections: corrections,
    is_corrected: true,
    corrected_by: teacherId
  });
};
```

**Visualización de correcciones**:
```html
<!-- Antes -->
<p>El agua se evapora por el calor del sol y forma las nuves.</p>

<!-- Después de corrección -->
<p>
  El agua se evapora por el calor del sol y forma las 
  <span class="line-through text-red-500">nuves</span>
  <span class="text-green-600">nubes</span>.
</p>
```

### 4. **Integración Multimedia**

#### Video (YouTube/Vimeo)
```tsx
<iframe
  src={videoUrl}
  loading="lazy"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media"
  allowFullScreen
/>
```

#### PDF con Anotaciones
```typescript
// En producción se usaría PDF.js
import * as pdfjsLib from 'pdfjs-dist';

const annotations: PDFAnnotation[] = [
  {
    page_number: 1,
    annotation_type: 'highlight',
    coordinates: { x: 100, y: 200, width: 150, height: 20 },
    color: '#FFF4B7',
    user_id: studentId
  },
  {
    page_number: 2,
    annotation_type: 'note',
    content: 'Revisar este concepto',
    coordinates: { x: 50, y: 100, width: 30, height: 30 },
    color: '#FFB5A7'
  }
];
```

#### Genially
```tsx
<div dangerouslySetInnerHTML={{ __html: material.embed_code }} />
```

---

## 💻 Stack Tecnológico

### Frontend
- **React 18**: Framework principal
- **TypeScript**: Tipado estático
- **Tailwind CSS 4.0**: Estilos utility-first + paleta pastel personalizada
- **Lucide React**: Iconografía moderna
- **Motion/React** (Framer Motion): Animaciones suaves

### Backend (Sugerido)
- **Node.js** con Express/NestJS, o
- **Python** con FastAPI
- **WebSockets**: Para comentarios en tiempo real
- **OpenAI API**: Generación de tareas con IA

### Base de Datos
- **Supabase** (PostgreSQL + Real-time) o
- **Firebase** (Firestore + Real-time Database)
- **Redis**: Caché para sesiones y datos frecuentes

### Almacenamiento
- **AWS S3** o **Cloudinary**: Videos y PDFs
- **Compresión automática**: Optimización de medios pesados

### Autenticación
- **OAuth 2.0**: Google y Microsoft
- **JWT**: Tokens de sesión
- **Principio de mínimos datos**: Solo email y nombre

### Performance
- **Code Splitting**: Carga bajo demanda de componentes
- **PWA** (Progressive Web App): Funcionalidad offline
- **Lazy Loading**: Imágenes y videos
- **Service Workers**: Caché inteligente

---

## 🚀 Guía de Implementación

### Fase 1: Setup Inicial (Semana 1-2)
```bash
# Instalación de dependencias
npm install react react-dom typescript
npm install tailwindcss@next @tailwindcss/typography
npm install lucide-react motion
npm install @supabase/supabase-js

# Configuración de Tailwind con paleta personalizada
# Ver /styles/globals.css para tokens de color
```

### Fase 2: Autenticación (Semana 3)
```typescript
// Integración OAuth 2.0
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'email profile' // Solo datos mínimos
    }
  });
};
```

### Fase 3: Dashboard y Gestión de Estudiantes (Semana 4-5)
1. Implementar `TeacherDashboard.tsx`
2. Sistema de invitación con QR y Magic Links
3. Visualización tipo Kanban de estudiantes

### Fase 4: Tareas y Materiales (Semana 6-7)
1. CRUD de tareas
2. Integración con OpenAI para generación automática
3. Visor multimedia (`MediaViewer.tsx`)

### Fase 5: Sistema de Comentarios ⭐ (Semana 8-9)
1. Implementar `CommentWall.tsx`
2. **Sistema de corrección del profesor** (funcionalidad única)
3. Comentarios anidados y tiempo real

### Fase 6: PDF Avanzado (Semana 10)
1. Integrar PDF.js
2. Sistema de anotaciones (highlight, notas, dibujo)
3. Sincronización en tiempo real

### Fase 7: Testing y Optimización (Semana 11-12)
1. Tests unitarios y de integración
2. Optimización de performance
3. PWA y funcionalidad offline

---

## 📊 Métricas de Éxito

### UX
- ✅ Tiempo de carga < 2 segundos
- ✅ Animaciones fluidas (60fps)
- ✅ Interfaz intuitiva (< 5 minutos para aprender)

### Privacidad
- ✅ Solo 2 datos requeridos (email, nombre)
- ✅ OAuth 2.0 sin contraseñas
- ✅ Modelo invite-only

### Funcionalidad
- ✅ Generación de tareas con IA en < 30 segundos
- ✅ Corrección de comentarios en < 1 minuto
- ✅ Comentarios en tiempo real (< 500ms latencia)

---

## 🎯 Diferenciadores Clave vs Google Classroom

| Característica | EduPlay LMS | Google Classroom |
|----------------|-------------|------------------|
| **Diseño** | Colores pasteles, clean & playful | Corporativo, formal |
| **Privacidad** | Solo email y nombre | Requiere cuenta Google completa |
| **IA Integrada** | ✅ Generación automática de tareas | ❌ No disponible |
| **Corrección de Comentarios** | ✅ Sistema único tipo "Control de Cambios" | ❌ Solo comentarios normales |
| **PDF Interactivo** | ✅ Anotaciones, resaltado, dibujo | ⚠️ Solo vista básica |
| **Genially Nativo** | ✅ Embeds nativos | ⚠️ Solo enlaces |
| **Onboarding** | Magic Links + QR | Códigos de clase |

---

## 🔒 Consideraciones de Seguridad

1. **Autenticación**: OAuth 2.0 con tokens JWT
2. **Autorización**: RBAC (Role-Based Access Control)
   - Teachers: Permisos completos en sus classrooms
   - Students: Permisos limitados a sus tareas y materiales
3. **Datos sensibles**: Encriptación AES-256
4. **GDPR Compliance**: Right to be forgotten, data export
5. **Rate Limiting**: Prevenir abuso de API
6. **Input Sanitization**: Protección contra XSS e inyección SQL

---

## 📝 Notas de Implementación

### Prioridades
1. 🔴 **Alta**: Dashboard, Comentarios con corrección, Sistema de invitación
2. 🟡 **Media**: IA para tareas, Visor multimedia, PDF básico
3. 🟢 **Baja**: PDF avanzado con anotaciones, Analytics, Gamificación

### Tecnologías Opcionales
- **Chart.js / Recharts**: Para analytics del profesor
- **React DnD**: Drag & drop de materiales
- **Socket.io**: Real-time alternativo a Supabase Realtime
- **Sharp**: Procesamiento de imágenes server-side

---

## 🤝 Contribuciones

Este proyecto es un prototipo conceptual y base para una plataforma LMS completa. Para contribuir:
1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/NuevaFuncionalidad`)
3. Commit cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/NuevaFuncionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles

---

## 👨‍💻 Autor

Desarrollado como concepto de arquitectura para una plataforma LMS moderna y centrada en el usuario.

**Contacto**: [Tu información de contacto]

---

## 🙏 Agradecimientos

- **Tailwind CSS** por el sistema de diseño flexible
- **Lucide** por la iconografía moderna
- **Supabase** por la infraestructura backend
- **OpenAI** por las capacidades de IA generativa

---

**Última actualización**: Noviembre 2024  
**Versión**: 1.0.0
