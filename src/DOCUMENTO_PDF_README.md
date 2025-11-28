# 📄 Sistema de Tareas con Documentos PDF - LuinGo

## 🎯 Visión General

El sistema de "Tareas de Documento PDF" permite a los profesores asignar documentos PDF que los estudiantes pueden anotar directamente en la plataforma. Los profesores pueden luego revisar las anotaciones y agregar sus propias correcciones con sellos visuales.

---

## 🏗️ Arquitectura "Ligera"

### Filosofía de Diseño

Para **evitar sobrecargar el servidor y la base de datos**, implementamos una **arquitectura de superposición (overlay)**:

1. **PDF Inmutable**: El archivo PDF se sube UNA sola vez a Supabase Storage
2. **Anotaciones JSON**: Todos los trazos, textos y sellos son objetos JSON ligeros con coordenadas relativas (%)
3. **Renderizado en Cliente**: El componente `PDFAnnotator` combina PDF + JSON en tiempo real

```
┌─────────────────────────────────────────┐
│  SUPABASE STORAGE (assignments/pdfs/)   │
│  • documento.pdf (binario, inmutable)   │
└─────────────────────────────────────────┘
              ↓ URL pública
┌─────────────────────────────────────────┐
│  BASE DE DATOS (Moodle Forum)          │
│  • JSON de anotaciones del estudiante   │
│  • JSON de correcciones del profesor    │
│  • Metadatos (grade, feedback, etc.)    │
└─────────────────────────────────────────┘
              ↓ Renderizado
┌─────────────────────────────────────────┐
│  CLIENTE (React + react-pdf)            │
│  • PDF de fondo + SVG overlay           │
│  • Coordenadas relativas (responsive)   │
└─────────────────────────────────────────┘
```

---

## 📐 Estructura de Datos

### PDFAnnotation Interface

```typescript
export interface PDFAnnotation {
  id: string;
  type: 'path' | 'text' | 'stamp';
  x: number; // Porcentaje relativo (0-100)
  y: number; // Porcentaje relativo (0-100)
  color?: string;
  content?: string; // Para texto o tipo de sello ('check' | 'x')
  pathData?: string; // Para trazos SVG
  width?: number;
  height?: number;
  timestamp?: string;
  author?: string; // 'student' o 'teacher'
}
```

### Ejemplo de Anotación

```json
{
  "id": "stamp-1732800123456",
  "type": "stamp",
  "x": 45.5,
  "y": 30.2,
  "content": "check",
  "color": "#22c55e",
  "author": "teacher",
  "timestamp": "2024-11-28T10:15:23.456Z"
}
```

**¿Por qué coordenadas relativas?**
- ✅ Responsive: Funcionan en cualquier tamaño de pantalla
- ✅ Zoom-safe: No se mueven al hacer zoom
- ✅ Ligeras: Solo 2 números en lugar de píxeles absolutos

---

## 🛠️ Componentes Implementados

### 1. `/components/PDFAnnotator.tsx`

**Componente principal de anotación de PDF**

#### Props

```typescript
interface PDFAnnotatorProps {
  mode: 'student' | 'teacher';
  pdfUrl: string;
  initialAnnotations?: PDFAnnotation[];
  onSave?: (annotations: PDFAnnotation[]) => void;
  readOnly?: boolean;
}
```

#### Herramientas Disponibles

| Herramienta | Icono | Descripción | Disponible para |
|-------------|-------|-------------|-----------------|
| **Selección** | MousePointer2 | Seleccionar/mover anotaciones | Todos |
| **Lápiz** | Pencil | Dibujar trazos libres | Todos |
| **Texto** | Type | Agregar notas de texto | Todos |
| **Borrador** | Eraser | Eliminar anotaciones | Todos |
| **Sello ✓** | CheckCircle2 | Marcar como correcto | Solo Profesor |
| **Sello ✗** | XCircle | Marcar como incorrecto | Solo Profesor |
| **Zoom +/-** | ZoomIn/Out | Ampliar/reducir vista | Todos |
| **Deshacer** | Undo | Revertir última acción | Todos |
| **Rehacer** | Redo | Restaurar acción | Todos |

#### Uso

```tsx
<PDFAnnotator
  mode="student"
  pdfUrl="https://example.com/document.pdf"
  initialAnnotations={existingAnnotations}
  onSave={(annotations) => {
    console.log('Guardando', annotations.length, 'anotaciones');
  }}
/>
```

---

### 2. `/components/TaskBuilder.tsx`

**Actualizado para soportar tipo 'document'**

#### Nuevos Estados

```typescript
const [taskType, setTaskType] = useState<'quiz' | 'writing' | 'document'>('quiz');
const [pdfFile, setPdfFile] = useState<File | null>(null);
const [pdfUrl, setPdfUrl] = useState('');
const [pdfInstructions, setPdfInstructions] = useState('');
const [isUploadingPdf, setIsUploadingPdf] = useState(false);
```

#### Función de Upload

```typescript
const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  
  // Validaciones
  if (file.type !== 'application/pdf') return;
  if (file.size > 10 * 1024 * 1024) return; // 10MB máximo
  
  // Upload a Supabase Storage
  const supabase = createClient(/* ... */);
  const fileName = `${Date.now()}_${file.name}`;
  
  await supabase.storage
    .from('assignments')
    .upload(`pdfs/${fileName}`, file);
  
  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('assignments')
    .getPublicUrl(`pdfs/${fileName}`);
  
  setPdfUrl(publicUrl);
};
```

---

### 3. `/App.tsx`

**Flujo de Estudiante**

```typescript
onSelectTask={(task) => {
  if (task.content_data?.type === 'document') {
    setSelectedTask(task);
    setView('pdf-annotator');
  }
}}
```

**Vista de Anotación**

```tsx
{view === 'pdf-annotator' && (
  <PDFAnnotator
    mode="student"
    pdfUrl={selectedTask.content_data.pdf_url}
    initialAnnotations={existingSubmission?.pdf_annotations || []}
    onSave={async (annotations) => {
      await submitTaskResult(
        taskId,
        taskTitle,
        studentId,
        studentName,
        0, // Score pendiente
        10,
        annotations as any, // Guardadas en 'answers'
        '', // Sin text_content
        'submitted',
        []
      );
    }}
  />
)}
```

---

### 4. `/components/TeacherDashboard.tsx`

**Vista de Corrección del Profesor**

```tsx
{/* VISOR DOCUMENTO PDF */}
{(() => {
  const relatedTask = tasks.find(t => t.id === group.task_id);
  const isDocumentTask = relatedTask?.content_data?.type === 'document';
  
  if (isDocumentTask) {
    const studentAnnotations = att.answers as PDFAnnotation[];
    const teacherAnnotations = att.teacher_annotations || [];
    
    return (
      <PDFAnnotator
        mode="teacher"
        pdfUrl={relatedTask.content_data.pdf_url}
        initialAnnotations={[...studentAnnotations, ...teacherAnnotations]}
        onSave={(newAnnotations) => {
          const teacherAnns = newAnnotations.filter(a => a.author === 'teacher');
          att.teacher_annotations = teacherAnns;
        }}
      />
    );
  }
})()}
```

---

## 🔄 Flujo Completo

### Flujo del Profesor

```
1. Crea Nueva Tarea
   ↓
2. Selecciona tipo "Documento PDF"
   ↓
3. Sube archivo PDF (máx 10MB)
   ↓ (Upload a Supabase Storage: assignments/pdfs/)
4. Escribe instrucciones
   ↓
5. Guarda la tarea
   ↓
6. Tarea asignada a estudiantes
```

### Flujo del Estudiante

```
1. Ve la tarea en su dashboard
   ↓
2. Hace clic en "Anotar Documento"
   ↓
3. PDF se carga con react-pdf
   ↓
4. Usa herramientas para anotar:
   • Lápiz: Subrayar/circular
   • Texto: Escribir notas
   ↓
5. Hace clic en "Guardar"
   ↓
6. Anotaciones guardadas como JSON en Moodle
   ↓
7. Estado cambia a "Esperando Revisión"
```

### Flujo de Corrección

```
1. Profesor ve submission en "Por Calificar"
   ↓
2. Hace clic en el grupo
   ↓
3. PDF carga con anotaciones del estudiante (azul)
   ↓
4. Profesor usa sellos ✓/✗ para corregir
   ↓
5. Profesor escribe nota y feedback
   ↓
6. Hace clic en "Guardar Calificación"
   ↓
7. Anotaciones del profesor guardadas separadas
   ↓
8. Estudiante puede ver corrección
```

---

## 🎨 Colores y Visualización

### Esquema de Colores

```typescript
const COLORS = {
  student: {
    pen: '#3b82f6', // Azul
    text: '#dbeafe', // Azul claro (fondo)
  },
  teacher: {
    pen: '#ef4444', // Rojo
    text: '#fee2e2', // Rojo claro (fondo)
    stampCheck: '#22c55e', // Verde
    stampX: '#ef4444', // Rojo
  }
};
```

### Ejemplo Visual

```
┌────────────────────────────────────────┐
│  DOCUMENTO PDF                         │
│                                        │
│  Este es un texto del documento...     │
│  ~~~~~~~~~~~~~~~~~~~~~~~ (trazo azul)  │
│                                        │
│  [ ✓ ] Correcto   (sello verde)       │
│                                        │
│  Error aquí [ ✗ ] (sello rojo)        │
│  ^^^^^^^^^ (trazo rojo del profesor)  │
│                                        │
│  📝 "Revisa la gramática" (nota prof) │
│                                        │
└────────────────────────────────────────┘
```

---

## ⚙️ Configuración Requerida

### 1. Bucket de Supabase Storage

**Nombre**: `assignments`

**Estructura de carpetas**:
```
assignments/
└── pdfs/
    ├── 1732800123456_documento1.pdf
    ├── 1732800234567_documento2.pdf
    └── ...
```

**Políticas de Seguridad**:

```sql
-- Permitir lectura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignments');

-- Permitir upload autenticado
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignments' 
  AND auth.role() = 'authenticated'
);
```

### 2. Crear Bucket (Si no existe)

```typescript
const supabase = createClient(/* ... */);

// Verificar si existe
const { data: buckets } = await supabase.storage.listBuckets();
const exists = buckets?.some(b => b.name === 'assignments');

if (!exists) {
  // Crear bucket público
  await supabase.storage.createBucket('assignments', {
    public: true,
    fileSizeLimit: 10485760 // 10MB
  });
}
```

---

## 🧪 Testing

### Test 1: Upload de PDF

```typescript
// ✅ CASO VÁLIDO
const validPdf = new File([pdfBlob], 'documento.pdf', { type: 'application/pdf' });
await handlePdfUpload({ target: { files: [validPdf] } });
// Expect: pdfUrl establecido, toast de éxito

// ❌ CASO INVÁLIDO: No es PDF
const invalidFile = new File([blob], 'imagen.jpg', { type: 'image/jpeg' });
await handlePdfUpload({ target: { files: [invalidFile] } });
// Expect: Error "Solo se permiten archivos PDF"

// ❌ CASO INVÁLIDO: Muy grande
const largePdf = new File([largeBlob], 'grande.pdf', { type: 'application/pdf' });
// Expect: Error "El PDF no debe exceder 10MB"
```

### Test 2: Anotaciones

```typescript
// Test: Dibujar trazo
1. Seleccionar herramienta "Lápiz"
2. Hacer clic y arrastrar en el PDF
3. Soltar mouse
4. Expect: Nueva anotación en estado con type='path'

// Test: Agregar texto
1. Seleccionar herramienta "Texto"
2. Hacer clic en posición
3. Escribir en prompt: "Esta es una nota"
4. Expect: Nueva anotación con type='text' y content='Esta es una nota'

// Test: Sello del profesor
1. Login como profesor
2. Seleccionar herramienta "Sello ✓"
3. Hacer clic en el PDF
4. Expect: Nueva anotación con type='stamp', content='check', author='teacher'
```

### Test 3: Guardado y Persistencia

```typescript
// Test: Guardar anotaciones
1. Crear 3 anotaciones diferentes
2. Hacer clic en "Guardar"
3. Verificar llamada a submitTaskResult con annotations array
4. Recargar página
5. Expect: Las 3 anotaciones siguen visibles

// Test: Separación estudiante/profesor
1. Estudiante crea 2 anotaciones
2. Guarda
3. Profesor abre la submission
4. Profesor crea 1 sello
5. Guarda calificación
6. Verificar en BD:
   - answers: 2 anotaciones del estudiante
   - teacher_annotations: 1 sello del profesor
```

---

## 🐛 Solución de Problemas

### Problema 1: PDF no carga

**Síntoma**: Pantalla en blanco o error "No se pudo cargar el PDF"

**Soluciones**:
1. Verificar que la URL del PDF sea accesible
2. Verificar políticas de CORS en Supabase Storage
3. Verificar que el bucket 'assignments' sea público
4. Abrir consola del navegador y buscar errores de red

### Problema 2: Anotaciones desalineadas

**Síntoma**: Anotaciones aparecen en posición incorrecta al hacer zoom

**Causa**: Coordenadas almacenadas como píxeles absolutos en lugar de porcentajes

**Solución**:
```typescript
// ❌ INCORRECTO
const x = e.clientX;
const y = e.clientY;

// ✅ CORRECTO
const rect = canvasRef.current.getBoundingClientRect();
const x = ((e.clientX - rect.left) / rect.width) * 100;
const y = ((e.clientY - rect.top) / rect.height) * 100;
```

### Problema 3: Upload falla

**Síntoma**: Error al subir PDF, mensaje "Error al subir el PDF"

**Soluciones**:
1. Verificar que el bucket 'assignments' existe
2. Verificar límites de tamaño del bucket (debe ser ≥ 10MB)
3. Verificar que el usuario esté autenticado
4. Verificar políticas de INSERT en storage.objects

---

## 📊 Comparación con Otros Tipos de Tarea

| Característica | Quiz | Writing | Document PDF |
|----------------|------|---------|--------------|
| **Tipo de entrega** | Respuestas múltiples | Texto largo | Anotaciones JSON |
| **Calificación** | Automática | Manual | Manual |
| **Multi-intentos** | ✅ Sí (configurable) | ❌ No | ❌ No |
| **Corrección visual** | N/A | ✅ TextAnnotator | ✅ PDFAnnotator |
| **Borradores** | N/A | ✅ Sí | ❌ No |
| **Sellos visuales** | N/A | ❌ No | ✅ Sí (check/x) |
| **Archivos subidos** | ❌ No | ❌ No | ✅ Sí (PDF) |

---

## 🚀 Próximas Mejoras

### Versión 1.1 (Futuro)

- [ ] **Vista previa del PDF** antes de subir
- [ ] **Biblioteca de sellos** personalizados (estrella, signo de interrogación, etc.)
- [ ] **Colores personalizables** para el lápiz
- [ ] **Grosor del trazo** ajustable
- [ ] **Exportar PDF anotado** (merge de PDF + anotaciones)
- [ ] **Comentarios con hilos** en anotaciones específicas
- [ ] **Audio annotations** (grabar notas de voz)

### Versión 1.2 (Futuro)

- [ ] **OCR automático** para PDFs escaneados
- [ ] **Detección de plagio** en textos del PDF
- [ ] **Análisis de legibilidad** de las anotaciones
- [ ] **Estadísticas de corrección** (promedio de errores por página)
- [ ] **Templates de rúbricas** para documentos

---

## 📚 Referencias

- [react-pdf Documentation](https://github.com/wojtekmaj/react-pdf)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [SVG Path Commands](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths)

---

## 👥 Contribuidores

- **Arquitecto**: Sistema de coordenadas relativas y overlay
- **Desarrollador Frontend**: PDFAnnotator, TaskBuilder, integración
- **Desarrollador Backend**: Moodle integration, Supabase Storage

---

**Última actualización**: 28 de noviembre de 2024
**Versión**: 1.0.0
