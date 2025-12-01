import React from 'react';
import { Users, ArrowRight, Plus, Loader2, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { getEnrolledUsers, getUserPreferences } from '../lib/moodle';

interface ClassSelectionProps {
  courses: any[];
  onSelectClass: (courseId: string) => void;
  onCreateClass?: (name: string) => void;
  onLogout: () => void; // ✅ Nueva prop
}

export const ClassSelection: React.FC<ClassSelectionProps> = ({ courses, onSelectClass, onCreateClass, onLogout }) => {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newClassName, setNewClassName] = React.useState('');
  
  // Estado para guardar avatares y conteo real
  const [courseStats, setCourseStats] = React.useState<Record<string, { count: number, avatars: string[] }>>({});

  // ✅ EFECTO: Cargar datos reales de estudiantes + Avatares Personalizados
  React.useEffect(() => {
    const fetchStats = async () => {
      const stats: any = {};
      
      await Promise.all(courses.map(async (course) => {
        try {
          const users = await getEnrolledUsers(course.id);
          
          if (Array.isArray(users)) {
            // 1. Filtrar estudiantes (excluir admins/profes con ID bajo si es necesario)
            const students = users.filter((u: any) => u.id > 2);
            
            // 2. Tomar los primeros 3 para la vista previa
            const previewStudents = students.slice(0, 3);

            // 3. 🔥 MAGIA: Buscar el avatar personalizado de cada uno en paralelo
            const realAvatars = await Promise.all(previewStudents.map(async (s: any) => {
                try {
                    // Consultar preferencia guardada (donde vive el avatar de DiceBear)
                    const prefs = await getUserPreferences(s.id);
                    // Retornar avatar personalizado O el de Moodle como fallback
                    return prefs?.avatar_url || s.profileimageurl;
                } catch (e) {
                    return s.profileimageurl; // Fallback en caso de error
                }
            }));

            stats[course.id] = {
              count: students.length,
              avatars: realAvatars // ✅ Usamos las URLs resueltas
            };
          }
        } catch (e) { console.error(e); }
      }));
      
      setCourseStats(stats);
    };

    if (courses.length > 0) fetchStats();
  }, [courses]);
  
  // Function to assign random styles to courses since Moodle doesn't provide them
  const getCourseStyle = (id: number) => {
    const styles = [
        { theme: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-800', icon: '🥑' },
        { theme: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800', icon: '🦁' },
        { theme: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-800', icon: '📚' },
        { theme: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-800', icon: '🌹' },
        { theme: 'bg-sky-100', border: 'border-sky-200', text: 'text-sky-800', icon: '✈️' },
    ];
    return styles[id % styles.length];
  };

  const handleCreateClass = () => {
    if (newClassName.trim() && onCreateClass) {
      onCreateClass(newClassName.trim());
      setNewClassName('');
      setShowCreateDialog(false);
    }
  };

  if (!courses || courses.length === 0) {
    return (
        <div className="max-w-5xl mx-auto p-6 text-center py-24">
             <h1 className="text-3xl font-black text-slate-800 mb-4">Mis Clases</h1>
             <div className="flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-bold">Cargando cursos desde Moodle...</p>
             </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative">
      {/* ✅ BOTÓN SALIR (Esquina Superior Derecha) */}
      <div className="absolute top-6 right-6">
          <Button variant="ghost" onClick={onLogout} className="text-slate-400 hover:text-rose-500 gap-2">
            <LogOut className="w-5 h-5" /> <span className="font-bold">Salir</span>
          </Button>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Mis Clases</h1>
            <p className="text-slate-500 font-bold">Hola Profe, ¿dónde vamos a enseñar hoy?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const style = getCourseStyle(course.id);
            const stats = courseStats[course.id] || { count: 0, avatars: [] };
            return (
              <div 
                  key={course.id}
                  onClick={() => onSelectClass(String(course.id))}
                  className={`relative group cursor-pointer bg-white rounded-[2rem] p-6 border-b-8 border-r-2 border-l-2 border-t-2 border-slate-100 hover:border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl`}
              >
                  <div className={`w-16 h-16 rounded-2xl ${style.theme} ${style.text} border-2 ${style.border} flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                  {style.icon}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2 line-clamp-2">{course.fullname}</h3>
                  
                  <div className="mt-auto space-y-4 relative">
                      {/* Avatares Reales */}
                      <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                              {stats.avatars.length > 0 ? (
                                  stats.avatars.map((url: string, i: number) => (
                                      <img key={i} src={url} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 object-cover" />
                                  ))
                              ) : (
                                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">?</div>
                              )}
                              {stats.count > 3 && (
                                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+{stats.count - 3}</div>
                              )}
                          </div>
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {stats.count}
                          </span>
                      </div>

                      <Button className="w-full bg-slate-900 text-white hover:bg-indigo-600 rounded-xl h-10 font-bold shadow-md">
                          Entrar al Aula <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                  </div>
              </div>
            );
          })}
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Clase</DialogTitle>
              <DialogDescription>
                Ingresa el nombre de la nueva clase que deseas crear.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col space-y-4">
              <Input
                id="name"
                placeholder="Nombre de la clase"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleCreateClass}>
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ✅ BOTÓN FLOTANTE FAB (Esquina Inferior Derecha) */}
      <button
        onClick={() => setShowCreateDialog(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-slate-800 hover:bg-indigo-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center group z-50"
        title="Nueva Clase"
      >
        <Plus className="w-7 h-7" />
        <span className="absolute right-20 bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Nueva Clase
        </span>
      </button>
    </div>
  );
};