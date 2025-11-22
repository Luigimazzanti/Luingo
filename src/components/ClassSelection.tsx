import React from 'react';
import { Users, ArrowRight, Plus, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';

interface ClassSelectionProps {
  courses: any[];
  onSelectClass: (courseId: string) => void;
  onCreateClass?: (name: string) => void;
}

export const ClassSelection: React.FC<ClassSelectionProps> = ({ courses, onSelectClass, onCreateClass }) => {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newClassName, setNewClassName] = React.useState('');
  
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
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Mis Clases</h1>
          <p className="text-slate-500 font-bold">Hola Profe, ¿dónde vamos a enseñar hoy?</p>
        </div>
        <Button className="bg-slate-800 text-white rounded-2xl h-12 px-6 font-bold hover:bg-slate-700 shadow-lg hover:-translate-y-1 transition-all" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nueva Clase
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const style = getCourseStyle(course.id);
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
                <div className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-6">
                <Users className="w-4 h-4" />
                {course.enrolledusercount || 0} Estudiantes
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
                        ))}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
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
  );
};