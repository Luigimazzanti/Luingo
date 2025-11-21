
/**
 * ESQUEMA DE BASE DE DATOS - Plataforma LMS EdTech
 */

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

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  joined_at: string;
  total_tasks: number;
  completed_tasks: number;
  average_grade: number;
  xp_points: number; // XP Points (LuinPoints)
  level: number;
  materials_viewed: string[];
}

export type TaskStatus = 'draft' | 'published' | 'archived';
export type TaskCategory = 'homework' | 'project' | 'quiz' | 'reading';

export type QuestionType = 'choice' | 'fill_blank' | 'order_sentence';

export interface Question {
  id: number;
  type: QuestionType;
  question_text: string;
  options?: string[]; 
  correct_answer?: string; 
  scrambled_parts?: string[];
  correct_order?: string[];
  explanation: string;
}

export interface TaskContent {
  type: 'pdf' | 'form' | 'mixed';
  resource_url?: string;
  pages?: number;
  questions?: Question[];
}

export interface Task {
  id: string;
  classroom_id: string;
  title: string;
  description: string;
  rubric?: any;
  ai_generated: boolean;
  
  // 🚀 CONTENT DEFINITION
  content_data: TaskContent;
  
  due_date?: string;
  status: TaskStatus;
  category: TaskCategory;
  audience?: 'kids' | 'adult'; // NEW: Context for the UI/AI
  color_tag: string;
  created_at: string;
  updated_at: string;
}

export type SubmissionStatus = 'assigned' | 'in_progress' | 'submitted' | 'graded';

export interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  type: 'pen' | 'highlight' | 'eraser';
}

export interface Submission {
  id: string;
  task_id: string;
  student_id: string;
  status: SubmissionStatus;
  content: string;
  
  // 🚀 JSON STORAGE STRATEGY
  student_annotations: DrawingStroke[]; // Capa del alumno
  teacher_corrections: DrawingStroke[]; // Capa del profesor (roja)
  
  grade?: number;
  teacher_feedback?: string;
  submitted_at?: string;
  reviewed_at?: string;
}

export type MaterialType = 'video' | 'pdf' | 'genially' | 'link' | 'image';

export interface Material {
  id: string;
  task_id: string;
  type: MaterialType;
  title: string;
  url: string;
  embed_code?: string;
  thumbnail_url?: string;
  duration?: number;
  created_at: string;
  view_count: number; 
  viewed_by: string[]; 
}

export interface Correction {
  start: number;
  end: number;
  original: string;
  correction: string;
  type: 'spelling' | 'grammar' | 'concept';
}

export interface Comment {
  id: string;
  material_id: string;
  user_id: string;
  user: User;
  content: string;
  original_content?: string;
  corrected_by?: string;
  corrections?: Correction[];
  is_corrected: boolean;
  parent_id?: string;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
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
