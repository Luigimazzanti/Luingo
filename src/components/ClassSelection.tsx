import React from 'react';
import { Users, ArrowRight, Plus } from 'lucide-react';
import { Button } from './ui/button';

interface ClassSelectionProps {
  onSelectClass: (classId: string) => void;
}

export const ClassSelection: React.FC<ClassSelectionProps> = ({ onSelectClass }) => {
  const classes = [
    { id: 'c1', name: 'Español A1 - Principiantes', students: 24, theme: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-800', icon: '🥑' },
    { id: 'c2', name: 'Español B1 - Intermedio', students: 18, theme: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800', icon: '🦁' },
    { id: 'c3', name: 'Literatura Hispana', students: 12, theme: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-800', icon: '📚' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Mis Clases</h1>
          <p className="text-slate-500 font-bold">Hola Profe, ¿dónde vamos a enseñar hoy?</p>
        </div>
        <Button className="bg-slate-800 text-white rounded-2xl h-12 px-6 font-bold hover:bg-slate-700 shadow-lg hover:-translate-y-1 transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Nueva Clase
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div 
            key={cls.id}
            onClick={() => onSelectClass(cls.id)}
            className={`relative group cursor-pointer bg-white rounded-[2rem] p-6 border-b-8 border-r-2 border-l-2 border-t-2 border-slate-100 hover:border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl`}
          >
            <div className={`w-16 h-16 rounded-2xl ${cls.theme} ${cls.text} border-2 ${cls.border} flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
              {cls.icon}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">{cls.name}</h3>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-6">
              <Users className="w-4 h-4" />
              {cls.students} Estudiantes
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
        ))}
      </div>
    </div>
  );
};