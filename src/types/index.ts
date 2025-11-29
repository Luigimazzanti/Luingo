// --- CORE ARCHITECTURE: LIBRARY VS ASSIGNMENTS ---

// ✅ TIPOS DE TAREA
export type TaskType = 'quiz' | 'writing' | 'document';
export type TaskCategory = 'homework' | 'quiz' | 'project' | 'reading' | 'writing' | 'document';

// ✅ TIPOS DE RECURSOS MULTIMEDIA
export type ResourceType = 'image' | 'video' | 'pdf' | 'none';

// ✅ TIPOS DE CORRECCIÓN
export type CorrectionType = 'grammar' | 'vocabulary' | 'spelling' | 'style' | 'coherence';

// ✅ INTERFAZ DE ANOTACIÓN PDF
export interface PDFAnnotation {
  id: string;
  type: 'path' | 'text' | 'stamp';
  x: number; // Porcentaje relativo (0-100)
  y: number; // Porcentaje relativo (0-100)
  color?: string;
  content?: string; // Para texto o tipo de sello
  pathData?: string; // Para trazos SVG
  width?: number; // Para texto
  height?: number; // Para texto
  strokeWidth?: number; // ✅ FIX: Grosor del trazo para lápiz
  fontSize?: number; // ✅ FIX: Tamaño de fuente para texto
  scale?: number; // ✅ FIX: Escala para sellos (0.6=Pequeño, 1.0=Medio, 1.5=Grande)
  timestamp?: string;
  author?: string; // 'student' o 'teacher'
}

// ✅ INTERFAZ DE CONTENIDO EXTENDIDA
export interface ContentData {
  type: 'form' | 'writing' | 'document';
  
  // Campos para Quiz/Form
  questions?: Question[];
  
  // Campos para Writing
  writing_prompt?: string;
  min_words?: number;
  max_words?: number;
  resource_url?: string;
  resource_type?: ResourceType;
  rubric?: string; // Rúbrica de evaluación
  
  // Campos para Document (PDF)
  pdf_url?: string;
  instructions?: string; // Instrucciones del profesor para el documento
}

// 1. TABLE: TASKS_LIBRARY (La Biblioteca)
// Definición pura de la tarea, sin datos de alumnos.
export interface TaskTemplate {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  content_data: ContentData; // ✅ AHORA TIPADO
  level_tag: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'ALL'; // Para sugerencias
  category: TaskCategory; // ✅ ACTUALIZADO
  estimated_time?: number;
  rubric?: any;
  max_attempts?: number; // Límite de intentos (undefined = ilimitado)
  created_at: string;
}

// 2. TABLE: ASSIGNMENTS (El Vínculo)
// Conecta una TaskTemplate con un Student. Aquí vive el estado.
export interface Assignment {
  id: string;
  task_id: string; // FK -> Tasks_Library
  task_title?: string; // Título de la tarea
  student_id: string; // FK -> Students
  student_name?: string; // Nombre del estudiante
  status: 'assigned' | 'in_progress' | 'draft' | 'submitted' | 'graded'; // ✅ AÑADIDO 'draft'
  
  // ✅ SISTEMA MULTI-INTENTOS
  attempts?: number; // Número de intentos realizados
  best_grade?: number; // Mejor nota obtenida
  
  // Data del Alumno
  submission_data?: any; // Respuestas del alumno
  answers?: any[]; // Array de respuestas detalladas
  text_content?: string; // ✅ NUEVO: El texto del alumno (para writing)
  word_count?: number; // ✅ NUEVO: Contador de palabras
  pdf_annotations?: PDFAnnotation[]; // ✅ NUEVO: Anotaciones del alumno en PDF
  submitted_at?: string;
  updated_at?: string; // Última actualización
  
  // Data del Profesor (Feedback)
  grade?: number;
  score?: number; // Puntos obtenidos
  total?: number; // Puntos totales
  feedback_text?: string;
  teacher_feedback?: string; // Feedback del profesor
  feedback_audio_url?: string;
  corrections?: WritingCorrection[]; // ✅ NUEVO: Correcciones del profesor
  teacher_annotations?: PDFAnnotation[]; // ✅ NUEVO: Anotaciones del profesor en PDF
  graded_at?: string; // ✅ Fecha de calificación
  
  // Metadatos de Moodle
  original_payload?: any; // ✅ JSON completo para no perder datos al calificar
  postId?: number; // ✅ ID del post en Moodle
  discussionId?: number; // ✅ ID de la discusión en Moodle
  
  // Metadatos de visualización
  due_date?: string;
  discussion_id?: string; // ✅ ID de la discusión en Moodle (para buscar replies)
}

// Alias para compatibilidad con código anterior si es necesario, 
// pero intentaremos usar Assignment explícitamente.
export type Submission = Assignment; 
export type Task = TaskTemplate; // En el frontend a veces las mezclamos visualmente, pero en DB están separadas.
export type TaskContent = any;

// --- END CORE ARCHITECTURE ---

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'student';
  avatar_url: string;
  created_at: string;
  updated_at: string;
  xp_points?: number; // XP acumulado por el usuario
  level?: number; // Nivel calculado desde XP (1-7)
  streak_days?: number; // Racha de días consecutivos de login
}

export interface Student extends User {
  joined_at: string;
  total_tasks: number;
  completed_tasks: number;
  average_grade: number;
  xp_points: number;
  level: number;
  current_level_code: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'; // New prop for filtering
  materials_viewed: string[];
}

export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  description: string;
  invite_code: string;
  color_theme: string;
  created_at: string;
  updated_at: string;
}

export interface Correction {
  start: number;
  end: number;
  original: string;
  correction: string;
  type: 'grammar' | 'vocabulary' | 'spelling';
}

// ✅ INTERFAZ EXTENDIDA PARA CORRECCIONES DE WRITING
export interface WritingCorrection {
  type: CorrectionType;
  start: number;
  end: number;
  original: string;
  correction: string;
  explanation?: string;
}

export interface Comment {
  id: string;
  material_id: string;
  user_id: string;
  user: User;
  content: string;
  original_content?: string;
  is_corrected: boolean;
  corrected_by?: string;
  corrections?: Correction[];
  parent_id?: string; // Threading
  created_at: string;
  updated_at: string;
}

// New Content Structure
export type MaterialType = 'video' | 'article' | 'link' | 'pdf';

export interface ArticleContent {
  body_markdown: string; // Or HTML
  glossary?: { term: string; definition: string }[];
  estimated_read_time: number;
}

export interface Material {
  id: string;
  classroom_id: string;
  type: MaterialType;
  title: string;
  description: string; // The "Prompt" from the teacher
  
  // Visibility Logic
  target_levels: ('A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'ALL')[];
  
  // Content Payload
  url?: string; // For videos/links
  thumbnail_url?: string;
  article_content?: ArticleContent; // For internal blogs

  // Meta
  author_id: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  view_count: number;
}

export type SubmissionStatus = Submission['status'];

// Exercise Types for the JSON Player
export interface Question {
  id: number;
  type: 'choice' | 'fill_gap' | 'drag_drop';
  question_text: string;
  options?: string[];
  correct_answer: string | string[];
  explanation?: string;
}

export interface Exercise {
  title: string;
  level: string;
  banana_reward_total: number;
  questions: Question[];
}