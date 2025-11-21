/**
 * ESQUEMA DE BASE DE DATOS - Plataforma LMS EdTech "LuinGo"
 * Consolidated Types
 */

// --- 1. USERS & AUTH ---

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Student extends User {
  joined_at: string;
  total_tasks: number;
  completed_tasks: number;
  average_grade: number;
  xp_points: number; // XP Points (LuinPoints)
  level: number; // 1-100 scale
  current_level_code: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'; // CEFR
  materials_viewed: string[];
}

export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  description?: string;
  invite_code: string;
  color_theme: string;
  created_at: string;
  updated_at: string;
}

// --- 2. TASK LIBRARY & ASSIGNMENTS (CORE ARCHITECTURE) ---

// TABLE: TASKS_LIBRARY (La Biblioteca)
// Definición pura de la tarea, sin datos de alumnos.
export interface TaskTemplate {
  id: string;
  teacher_id?: string; // Optional for system templates
  classroom_id?: string; // Legacy
  title: string;
  description: string;
  content_data: TaskContent; // JSON polymorph
  level_tag: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'ALL';
  category: 'homework' | 'quiz' | 'project' | 'reading';
  estimated_time?: number;
  rubric?: any;
  ai_generated?: boolean;
  color_tag?: string; // UI Helper
  status?: 'draft' | 'published' | 'archived'; // Library status
  created_at: string;
  updated_at?: string;
}

// TABLE: ASSIGNMENTS (El Vínculo)
// Conecta una TaskTemplate con un Student.
export interface Assignment {
  id: string;
  task_id: string; // FK -> Tasks_Library
  student_id: string; // FK -> Students
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded';
  
  // Data del Alumno
  submission_data?: any; // Respuestas del alumno
  student_annotations?: DrawingStroke[]; // PDF/Image annotations
  content?: string; // Legacy text content
  
  submitted_at?: string;
  
  // Data del Profesor (Feedback)
  grade?: number;
  feedback_text?: string; // Simple feedback
  teacher_feedback?: string; // Legacy alias
  feedback_audio_url?: string;
  teacher_corrections?: DrawingStroke[]; // Red pen strokes
  graded_at?: string;
  
  // Metadatos
  due_date?: string;
}

// ALIASES FOR COMPATIBILITY
export type Task = TaskTemplate; 
export type Submission = Assignment;
export type SubmissionStatus = Assignment['status'];

// --- 3. CONTENT & EXERCISES ---

export type QuestionType = 'choice' | 'fill_blank' | 'order_sentence' | 'fill_gap' | 'drag_drop';

export interface Question {
  id: number;
  type: QuestionType;
  question_text: string;
  options?: string[]; 
  correct_answer?: string | string[]; 
  scrambled_parts?: string[]; // For order_sentence
  correct_order?: string[];
  explanation?: string;
}

export interface TaskContent {
  type: 'pdf' | 'form' | 'mixed';
  resource_url?: string;
  pages?: number;
  questions?: Question[];
}

// --- 4. SOCIAL WALL & MATERIALS ---

export type MaterialType = 'video' | 'article' | 'link' | 'pdf' | 'image' | 'genially';

export interface ArticleContent {
  body_markdown: string;
  glossary?: { term: string; definition: string }[];
  estimated_read_time: number;
}

export interface Material {
  id: string;
  classroom_id: string;
  type: MaterialType;
  title: string;
  description: string;
  
  // Visibility Logic
  target_levels: ('A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'ALL')[];
  
  // Content Payload
  url: string;
  thumbnail_url?: string;
  embed_code?: string;
  article_content?: ArticleContent;
  
  // Meta
  author_id?: string;
  created_at: string;
  view_count: number;
  viewed_by: string[];
  likes_count?: number;
  comments_count?: number;
}

// --- 5. INTERACTION (COMMENTS, ANNOTATIONS) ---

export interface Correction {
  start: number;
  end: number;
  original: string;
  correction: string;
  type: 'spelling' | 'grammar' | 'concept' | 'vocabulary';
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
  parent_id?: string;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

// Drawing & PDF Annotation
export interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  type: 'pen' | 'highlight' | 'eraser';
}

export type AnnotationType = 'highlight' | 'note' | 'drawing';

export interface PDFAnnotation {
  id: string;
  material_id: string;
  user_id: string;
  page_number: number;
  annotation_type: AnnotationType;
  content?: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string;
  drawing_path?: Array<{ x: number; y: number }>;
  created_at: string;
  updated_at: string;
}

// --- 6. SYSTEM ---

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_id?: string;
  created_at: string;
}

export interface Exercise {
  title: string;
  level: string;
  banana_reward_total: number;
  questions: Question[];
}
