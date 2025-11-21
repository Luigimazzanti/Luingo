// --- CORE ARCHITECTURE: LIBRARY VS ASSIGNMENTS ---

// 1. TABLE: TASKS_LIBRARY (La Biblioteca)
// Definición pura de la tarea, sin datos de alumnos.
export interface TaskTemplate {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  content_data: any; // El JSON del ejercicio/formulario/PDF
  level_tag: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'ALL'; // Para sugerencias
  category: 'homework' | 'quiz' | 'project' | 'reading';
  estimated_time?: number;
  rubric?: any;
  created_at: string;
}

// 2. TABLE: ASSIGNMENTS (El Vínculo)
// Conecta una TaskTemplate con un Student. Aquí vive el estado.
export interface Assignment {
  id: string;
  task_id: string; // FK -> Tasks_Library
  student_id: string; // FK -> Students
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded';
  
  // Data del Alumno
  submission_data?: any; // Respuestas del alumno
  submitted_at?: string;
  
  // Data del Profesor (Feedback)
  grade?: number;
  feedback_text?: string;
  feedback_audio_url?: string;
  graded_at?: string;
  
  // Metadatos de visualización
  due_date?: string;
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
