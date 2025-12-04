import { User, Student, Task, Material, Comment, Classroom } from '../types';

// Mock user (profesor actual)
export const currentUser: User = {
  id: 'teacher-1',
  email: 'profesor@luingo.com',
  name: 'María González',
  role: 'teacher',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock classroom
export const mockClassroom: Classroom = {
  id: 'classroom-1',
  teacher_id: 'teacher-1',
  name: 'Español Intensivo 2024',
  description: 'Comunidad de aprendizaje activo 🚀',
  invite_code: 'HOLA-2024',
  color_theme: '#A8D8FF',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock students con Niveles Reales
export const mockStudents: Student[] = [
  {
    id: 'student-1',
    name: 'Hans Müller',
    email: 'hans@student.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hans',
    joined_at: new Date().toISOString(),
    total_tasks: 12,
    completed_tasks: 10,
    average_grade: 9.2,
    xp_points: 850,
    level: 4,
    current_level_code: 'B1', // <--- NEW
    materials_viewed: ['material-1', 'material-2', 'material-3'],
    role: 'student'
  },
  {
    id: 'student-2',
    name: 'Sarah Jones',
    email: 'sarah@student.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    joined_at: new Date().toISOString(),
    total_tasks: 12,
    completed_tasks: 11,
    average_grade: 8.8,
    xp_points: 720,
    level: 3,
    current_level_code: 'A2', // <--- NEW
    materials_viewed: ['material-1', 'material-2'],
    role: 'student'
  },
  {
    id: 'student-3',
    name: 'Yuki Tanaka',
    email: 'yuki@student.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
    joined_at: new Date().toISOString(),
    total_tasks: 12,
    completed_tasks: 12,
    average_grade: 9.5,
    xp_points: 1200,
    level: 5,
    current_level_code: 'B2', // <--- NEW
    materials_viewed: ['material-1', 'material-2', 'material-3'],
    role: 'student'
  }
];

// --- SMART WALL MATERIALS ---

export const mockMaterials: Material[] = [
  // 1. Artículo Blog (IA Generated style) - Visible para B1, B2
  {
    id: 'mat-blog-1',
    classroom_id: 'classroom-1',
    type: 'article',
    title: '🍇 Las 12 Uvas de la Suerte',
    description: 'Se acerca Año Nuevo. Leed este artículo sobre nuestras tradiciones y contadme: ¿Qué hacéis vosotros esa noche? 👇',
    target_levels: ['B1', 'B2', 'C1'],
    author_id: 'teacher-1',
    thumbnail_url: 'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    likes_count: 15,
    comments_count: 3,
    view_count: 45,
    article_content: {
      estimated_read_time: 3,
      body_markdown: `
## Una tradición centenaria

En España, la Nochevieja no está completa sin las **12 uvas**. Según la tradición, hay que comer una uva por cada campanada que marca la medianoche del 31 de diciembre.

Si consigues comerlas todas a tiempo, tendrás buena suerte durante los 12 meses del año nuevo. ¡Pero cuidado! No es tan fácil como parece. Las campanadas suenan rápido y mucha gente acaba con la boca llena y riéndose.

### ¿De dónde viene esta costumbre?

Existen varias teorías. Una de las más populares dice que en 1909 hubo una cosecha muy grande de uvas en Alicante. Los agricultores, para vender el excedente, inventaron que eran "uvas de la suerte".

### Vocabulario Importante

Aquí tenéis algunas palabras clave para entender mejor la fiesta:
      `,
      glossary: [
        { term: 'Nochevieja', definition: 'La última noche del año (31 de diciembre).' },
        { term: 'Campanada', definition: 'El sonido que hace una campana al ser golpeada.' },
        { term: 'Cosecha', definition: 'Recolección de los productos agrícolas (frutas, verduras).' },
        { term: 'Excedente', definition: 'Parte que sobra o es más de lo necesario.' }
      ]
    }
  },
  // 2. Video YouTube - Visible para TODOS (Video fácil)
  {
    id: 'mat-vid-1',
    classroom_id: 'classroom-1',
    type: 'video',
    title: '🇪🇸 La Dieta Mediterránea',
    description: 'Un video corto sobre por qué comemos tanto aceite de oliva. ¿Os gusta la comida española?',
    target_levels: ['ALL'],
    url: 'https://www.youtube.com/embed/xyQY8a-ng6g',
    thumbnail_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
    author_id: 'teacher-1',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Ayer
    likes_count: 24,
    comments_count: 12,
    view_count: 89
  },
  // 3. Link a Genially - Solo A1/A2 (Vocabulario básico)
  {
    id: 'mat-link-1',
    classroom_id: 'classroom-1',
    type: 'link',
    title: '🎮 Juego: La Ropa',
    description: 'Practicad el vocabulario de la ropa con este juego interactivo antes del examen del viernes.',
    target_levels: ['A1', 'A2'],
    url: 'https://view.genial.ly/example',
    thumbnail_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    author_id: 'teacher-1',
    created_at: new Date(Date.now() - 172800000).toISOString(), // Anteayer
    likes_count: 8,
    comments_count: 0,
    view_count: 20
  }
];

// Mock Tasks Library (Plantillas)
export const mockTasks: TaskTemplate[] = [
  {
    id: 'template-1',
    teacher_id: 'teacher-1',
    title: 'El Ciclo del Agua 💧',
    description: 'Investigar y completar el diagrama.',
    content_data: { type: 'form', questions: [] },
    level_tag: 'A2',
    category: 'project',
    created_at: new Date().toISOString(),
    rubric: { criteria: [], total_points: 100 }
  },
  {
    id: 'template-2',
    teacher_id: 'teacher-1',
    title: 'Lectura: Don Quijote 📚',
    description: 'Lee el capítulo 1 y responde.',
    content_data: { type: 'pdf', resource_url: '...' },
    level_tag: 'C1',
    category: 'reading',
    created_at: new Date().toISOString()
  }
];

// Mock Assignments (La realidad de los alumnos)
export const mockAssignments: Assignment[] = [
  // Hans tiene la tarea ASIGNADA (Pendiente)
  {
    id: 'assign-1',
    task_id: 'template-1',
    student_id: 'student-1', // Hans
    status: 'assigned',
    due_date: new Date(Date.now() + 86400000).toISOString(),
  },
  // Sarah ya la ENTREGÓ
  {
    id: 'assign-2',
    task_id: 'template-1',
    student_id: 'student-2', // Sarah
    status: 'submitted',
    submission_data: { answers: ['Evaporación', 'Condensación'] },
    submitted_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 86400000).toISOString(),
  }
];

// Re-export for compatibility
export const mockSubmissions = mockAssignments;

// Comentarios con CORRECCIONES VISUALES
export const mockComments: Comment[] = [
  {
    id: 'c1',
    material_id: 'mat-blog-1',
    user_id: 'student-1', // Hans (B1)
    user: mockStudents[0],
    content: 'En Alemania la comida es bueno, pero me gusta más la paella.',
    original_content: 'En Alemania la comida es bueno, pero me gusta más la paella.',
    is_corrected: true,
    corrected_by: 'teacher-1',
    corrections: [
      {
        start: 24,
        end: 29,
        original: 'bueno',
        correction: 'buena',
        type: 'grammar' // Rojo
      }
    ],
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'c2',
    material_id: 'mat-blog-1',
    user_id: 'teacher-1',
    user: currentUser,
    content: '¡Bien dicho Hans! Recuerda la concordancia: "La comida" (femenino) -> "buena". 🥘',
    is_corrected: false,
    parent_id: 'c1',
    created_at: new Date(Date.now() - 1700000).toISOString(),
    updated_at: new Date(Date.now() - 1700000).toISOString(),
  },
  {
    id: 'c3',
    material_id: 'mat-blog-1',
    user_id: 'student-3', // Yuki (B2)
    user: mockStudents[2],
    content: 'Yo nunca he comido las uvas, ¡suena peligroso comer tan rápido!',
    is_corrected: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  }
];

// Legacy exports
export const LUINGO_LEVELS = [
  { level: 1, min_xp: 0, max_xp: 100, label: 'Aprendiz de Tierra', icon: '🪨', color: 'from-stone-400 to-stone-600' },
  { level: 2, min_xp: 101, max_xp: 300, label: 'Adepto de Agua', icon: '💧', color: 'from-blue-400 to-cyan-600' },
  { level: 3, min_xp: 301, max_xp: 600, label: 'Guardián del Bosque', icon: '🍃', color: 'from-emerald-400 to-green-600' },
  { level: 4, min_xp: 601, max_xp: 1000, label: 'Maestro de Fuego', icon: '🔥', color: 'from-orange-400 to-red-600' },
  { level: 5, min_xp: 1001, max_xp: 2000, label: 'Sabio del Aire', icon: '🌪️', color: 'from-sky-400 to-indigo-600' },
  { level: 6, min_xp: 2001, max_xp: 5000, label: 'Espíritu de Éter', icon: '✨', color: 'from-purple-400 to-fuchsia-600' },
  { level: 7, min_xp: 5001, max_xp: 99999, label: 'Leyenda LuinGo', icon: '👑', color: 'from-yellow-400 to-amber-600' },
];
export const XP_VALUES = {};

// NUEVO: Configuración de Trofeos (Jungle Theme)
export const TROPHY_LEVELS = [
  { threshold: 25, label: 'Hormiga Obrera', icon: '🐜', color: 'bg-stone-100 text-stone-600', description: 'El inicio del trabajo duro' },
  { threshold: 35, label: 'Rana Curiosa', icon: '🐸', color: 'bg-green-100 text-green-600', description: 'Dando los primeros saltos' },
  { threshold: 55, label: 'Loro Parlanchín', icon: '🦜', color: 'bg-red-100 text-red-600', description: '¡Ya empiezas a hablar!' },
  { threshold: 85, label: 'Tucán Colorido', icon: '🥘', color: 'bg-orange-100 text-orange-600', description: 'Volando alto con estilo' },
  { threshold: 125, label: 'Mono Ágil', icon: '🐵', color: 'bg-amber-100 text-amber-600', description: 'Ágil y divertido' },
  { threshold: 175, label: 'Jaguar Veloz', icon: '🐆', color: 'bg-yellow-100 text-yellow-700', description: 'Nadie te alcanza' },
  { threshold: 235, label: 'Gorila Fuerte', icon: '🦍', color: 'bg-slate-200 text-slate-700', description: 'Fuerza bruta de conocimiento' },
  { threshold: 300, label: 'Rey León', icon: '🦁', color: 'bg-purple-100 text-purple-700', description: 'Dominas la jungla del español' },
];