import React from 'react';
import { Folder, File, Database, Code, Palette, Sparkles } from 'lucide-react';

/**
 * COMPONENTE INFORMATIVO: ESTRUCTURA DEL PROYECTO
 * 
 * Visualiza la arquitectura completa del sistema LMS
 */
export const ProjectStructure: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h2 className="text-gray-900 mb-6 flex items-center gap-3">
          <Code className="w-8 h-8 text-[#A8D8FF]" />
          Estructura del Proyecto LMS EdTech
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Estructura de carpetas */}
          <div className="bg-gradient-to-br from-[#A8D8FF] to-[#B5F8D4] bg-opacity-10 rounded-xl p-6 border border-[#A8D8FF] border-opacity-30">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5 text-[#A8D8FF]" />
              Estructura de Archivos
            </h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center gap-2 text-gray-700">
                <Folder className="w-4 h-4 text-[#FFF4B7]" />
                <span>/</span>
              </div>
              <div className="ml-4 space-y-1">
                <div className="flex items-center gap-2 text-gray-700">
                  <File className="w-4 h-4 text-[#FFB5A7]" />
                  <span>App.tsx</span>
                  <span className="text-xs text-gray-500">- Componente principal</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Folder className="w-4 h-4 text-[#FFF4B7]" />
                  <span>components/</span>
                </div>
                <div className="ml-6 space-y-1">
                  <div className="flex items-center gap-2 text-gray-600">
                    <File className="w-3 h-3" />
                    <span>TeacherDashboard.tsx</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <File className="w-3 h-3" />
                    <span>CommentWall.tsx</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <File className="w-3 h-3" />
                    <span>StudentCard.tsx</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <File className="w-3 h-3" />
                    <span>MediaViewer.tsx</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Folder className="w-3 h-3" />
                    <span>ui/ (componentes reutilizables)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Folder className="w-4 h-4 text-[#FFF4B7]" />
                  <span>types/</span>
                </div>
                <div className="ml-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <File className="w-3 h-3" />
                    <span>index.ts</span>
                    <span className="text-xs text-gray-500">- Esquema BD + Types</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Folder className="w-4 h-4 text-[#FFF4B7]" />
                  <span>lib/</span>
                </div>
                <div className="ml-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <File className="w-3 h-3" />
                    <span>mockData.ts</span>
                    <span className="text-xs text-gray-500">- Datos de ejemplo</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Folder className="w-4 h-4 text-[#FFF4B7]" />
                  <span>styles/</span>
                </div>
                <div className="ml-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <File className="w-3 h-3" />
                    <span>globals.css</span>
                    <span className="text-xs text-gray-500">- Paleta pastel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stack tecnológico */}
          <div className="bg-gradient-to-br from-[#FFE5D9] to-[#E0BBE4] bg-opacity-10 rounded-xl p-6 border border-[#FFE5D9] border-opacity-30">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E0BBE4]" />
              Stack Tecnológico
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-800 mb-2">Frontend</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#A8D8FF] text-gray-800 rounded-full text-xs">
                    React 18
                  </span>
                  <span className="px-3 py-1 bg-[#B5F8D4] text-gray-800 rounded-full text-xs">
                    TypeScript
                  </span>
                  <span className="px-3 py-1 bg-[#FFF4B7] text-gray-800 rounded-full text-xs">
                    Tailwind CSS
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-sm text-gray-800 mb-2">Backend (Sugerido)</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#FFB5A7] text-gray-800 rounded-full text-xs">
                    Node.js / FastAPI
                  </span>
                  <span className="px-3 py-1 bg-[#E0BBE4] text-gray-800 rounded-full text-xs">
                    Supabase / Firebase
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-sm text-gray-800 mb-2">Integraciones</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#FFE5D9] text-gray-800 rounded-full text-xs">
                    OpenAI API
                  </span>
                  <span className="px-3 py-1 bg-[#A8D8FF] text-gray-800 rounded-full text-xs">
                    OAuth 2.0
                  </span>
                  <span className="px-3 py-1 bg-[#B5F8D4] text-gray-800 rounded-full text-xs">
                    PDF.js
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-sm text-gray-800 mb-2">Almacenamiento</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#FFF4B7] text-gray-800 rounded-full text-xs">
                    AWS S3
                  </span>
                  <span className="px-3 py-1 bg-[#FFB5A7] text-gray-800 rounded-full text-xs">
                    Cloudinary
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Esquema de base de datos */}
        <div className="bg-gradient-to-br from-[#FFF4B7] to-[#FFE5D9] rounded-xl p-6 mb-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#FF9800]" />
            Esquema de Base de Datos (PostgreSQL)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tabla Users */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-sm text-gray-900 mb-2 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#A8D8FF]"></div>
                users
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• id (UUID, PK)</li>
                <li>• email (VARCHAR)</li>
                <li>• name (VARCHAR)</li>
                <li>• role (ENUM)</li>
                <li>• avatar_url (TEXT)</li>
              </ul>
            </div>

            {/* Tabla Classrooms */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-sm text-gray-900 mb-2 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#B5F8D4]"></div>
                classrooms
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• id (UUID, PK)</li>
                <li>• teacher_id (FK → users)</li>
                <li>• name (VARCHAR)</li>
                <li>• invite_code (VARCHAR)</li>
                <li>• color_theme (VARCHAR)</li>
              </ul>
            </div>

            {/* Tabla Tasks */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-sm text-gray-900 mb-2 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#FFF4B7]"></div>
                tasks
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• id (UUID, PK)</li>
                <li>• classroom_id (FK)</li>
                <li>• title (VARCHAR)</li>
                <li>• rubric (JSON)</li>
                <li>• ai_generated (BOOLEAN)</li>
                <li>• due_date (TIMESTAMP)</li>
              </ul>
            </div>

            {/* Tabla Materials */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-sm text-gray-900 mb-2 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#FFB5A7]"></div>
                materials
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• id (UUID, PK)</li>
                <li>• task_id (FK → tasks)</li>
                <li>• type (ENUM)</li>
                <li>• url (TEXT)</li>
                <li>• embed_code (TEXT)</li>
              </ul>
            </div>

            {/* Tabla Comments */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-sm text-gray-900 mb-2 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#E0BBE4]"></div>
                comments
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• id (UUID, PK)</li>
                <li>• material_id (FK)</li>
                <li>• user_id (FK → users)</li>
                <li>• content (TEXT)</li>
                <li>• corrections (JSON)</li>
                <li>• is_corrected (BOOLEAN)</li>
              </ul>
            </div>

            {/* Tabla PDF Annotations */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-sm text-gray-900 mb-2 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#FFE5D9]"></div>
                pdf_annotations
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• id (UUID, PK)</li>
                <li>• material_id (FK)</li>
                <li>• user_id (FK → users)</li>
                <li>• page_number (INT)</li>
                <li>• coordinates (JSON)</li>
                <li>• drawing_path (JSON)</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white border-opacity-50">
            <p className="text-xs text-gray-700">
              <strong>Relaciones:</strong> users 1:N classrooms, classrooms M:N students,
              classrooms 1:N tasks, tasks 1:N materials, materials 1:N comments (con
              self-referencing para respuestas), materials 1:N pdf_annotations
            </p>
          </div>
        </div>

        {/* Características principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#A8D8FF] to-[#8CC5F0] rounded-xl p-4">
            <h4 className="text-gray-900 mb-2">🎨 Diseño Clean & Playful</h4>
            <p className="text-sm text-gray-800">
              Paleta de colores pasteles vibrantes, bordes redondeados, sombras suaves y
              mucho espacio en blanco
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#B5F8D4] to-[#9AEFBC] rounded-xl p-4">
            <h4 className="text-gray-900 mb-2">🤖 IA Integrada</h4>
            <p className="text-sm text-gray-800">
              Generación automática de tareas, descripciones, rúbricas de evaluación y
              recursos educativos
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#FFE5D9] to-[#FFD4C2] rounded-xl p-4">
            <h4 className="text-gray-900 mb-2">👨‍🏫 Corrección del Profesor</h4>
            <p className="text-sm text-gray-800">
              Sistema único de corrección en comentarios tipo "Control de Cambios" con
              permisos Super-Admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
